from sqlalchemy import func
from sqlalchemy.orm import Session

from models.fees import FeeStructure, Payment, StudentFee
from models.student import Student
from schemas.fees import FeeStructureCreate, PaymentCreate


def create_fee_structure(db: Session, payload: FeeStructureCreate):
    db_obj = FeeStructure(**payload.model_dump())
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj


def list_fee_structures(db: Session, skip: int = 0, limit: int = 100):
    return db.query(FeeStructure).order_by(FeeStructure.year.desc(), FeeStructure.term.asc(), FeeStructure.grade.asc()).offset(skip).limit(limit).all()


def assign_fee_to_grade_students(db: Session, fee_structure: FeeStructure, grade: int):
    students = db.query(Student).filter(Student.form == grade).all()
    assigned_count = 0
    updated_count = 0

    for student in students:
        existing = (
            db.query(StudentFee)
            .filter(StudentFee.student_id == student.id, StudentFee.fee_structure_id == fee_structure.id)
            .first()
        )
        if existing:
            if existing.amount_owed != fee_structure.amount:
                delta = fee_structure.amount - existing.amount_owed
                existing.amount_owed = fee_structure.amount
                existing.status = _derive_status(existing.amount_owed, existing.amount_paid)
                student.fee_balance = max(0, student.fee_balance + delta)
                updated_count += 1
            continue

        student_fee = StudentFee(
            student_id=student.id,
            fee_structure_id=fee_structure.id,
            amount_owed=fee_structure.amount,
            amount_paid=0,
            status="pending",
        )
        db.add(student_fee)
        student.fee_balance = max(0, student.fee_balance + fee_structure.amount)
        assigned_count += 1

    db.commit()
    return {"assigned_count": assigned_count, "updated_count": updated_count}


def get_fee_structure_by_id(db: Session, fee_id: int):
    return db.query(FeeStructure).filter(FeeStructure.id == fee_id).first()


def generate_receipt_number(db: Session):
    last_payment = db.query(Payment).order_by(Payment.id.desc()).first()
    next_num = (last_payment.id + 1) if last_payment else 1
    return f"RCP-{next_num:08d}"


def record_payment(db: Session, payload: PaymentCreate):
    student_fee = db.query(StudentFee).filter(StudentFee.id == payload.student_fee_id).first()
    if not student_fee:
        return None, "Student fee assignment not found"

    remaining = student_fee.amount_owed - student_fee.amount_paid
    if payload.amount > remaining:
        return None, f"Payment exceeds outstanding balance ({remaining})"

    receipt_number = generate_receipt_number(db)
    payment = Payment(
        student_fee_id=student_fee.id,
        student_id=student_fee.student_id,
        amount=payload.amount,
        payment_method=payload.payment_method,
        receipt_number=receipt_number,
        mpesa_code=payload.mpesa_code,
        transaction_reference=payload.transaction_reference,
    )
    db.add(payment)

    student_fee.amount_paid += payload.amount
    student_fee.status = _derive_status(student_fee.amount_owed, student_fee.amount_paid)

    student = db.query(Student).filter(Student.id == student_fee.student_id).first()
    if student:
        student.fee_balance = max(0, student.fee_balance - payload.amount)

    db.commit()
    db.refresh(payment)
    return payment, None


def get_student_balance(db: Session, student_id: int):
    student = db.query(Student).filter(Student.id == student_id).first()
    if not student:
        return None

    owed, paid = (
        db.query(
            func.coalesce(func.sum(StudentFee.amount_owed), 0),
            func.coalesce(func.sum(StudentFee.amount_paid), 0),
        )
        .filter(StudentFee.student_id == student_id)
        .one()
    )
    return {
        "student_id": student.id,
        "student_name": f"{student.first_name} {student.last_name}",
        "total_owed": int(owed),
        "total_paid": int(paid),
        "balance": int(owed - paid),
    }


def list_defaulters(db: Session):
    rows = (
        db.query(
            Student.id,
            Student.first_name,
            Student.last_name,
            func.coalesce(func.sum(StudentFee.amount_owed), 0).label("owed"),
            func.coalesce(func.sum(StudentFee.amount_paid), 0).label("paid"),
        )
        .join(StudentFee, StudentFee.student_id == Student.id)
        .group_by(Student.id, Student.first_name, Student.last_name)
        .having(func.coalesce(func.sum(StudentFee.amount_owed), 0) > func.coalesce(func.sum(StudentFee.amount_paid), 0))
        .all()
    )

    return [
        {
            "student_id": row.id,
            "student_name": f"{row.first_name} {row.last_name}",
            "total_owed": int(row.owed),
            "total_paid": int(row.paid),
            "balance": int(row.owed - row.paid),
        }
        for row in rows
    ]


def list_student_fees(db: Session, student_id: int | None = None):
    q = db.query(StudentFee, Student, FeeStructure).join(Student, Student.id == StudentFee.student_id).join(
        FeeStructure, FeeStructure.id == StudentFee.fee_structure_id
    )
    if student_id is not None:
        q = q.filter(StudentFee.student_id == student_id)

    rows = q.order_by(Student.first_name.asc(), Student.last_name.asc(), FeeStructure.year.desc(), FeeStructure.term.asc()).all()
    return [
        {
            "id": fee.id,
            "student_id": student.id,
            "student_name": f"{student.first_name} {student.last_name}",
            "fee_structure_id": structure.id,
            "fee_name": structure.name,
            "term": structure.term,
            "year": structure.year,
            "amount_owed": fee.amount_owed,
            "amount_paid": fee.amount_paid,
            "balance": max(0, fee.amount_owed - fee.amount_paid),
            "status": fee.status,
        }
        for fee, student, structure in rows
    ]


def _derive_status(amount_owed: int, amount_paid: int):
    if amount_paid <= 0:
        return "pending"
    if amount_paid >= amount_owed:
        return "paid"
    return "partial"
