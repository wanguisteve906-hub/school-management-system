"""Seed demo data for class teacher and bursar workflows.

This script is idempotent: re-running it updates/reuses existing demo records.
"""

from datetime import date

from database import Base, SessionLocal, engine
from models.fees import AttendanceRecord, FeeStructure, ParentFeeMessage, PocketMoneyTransaction, StudentFee
from models.staff import Staff
from models.student import Student
from security import get_password_hash


def _upsert_staff(db, *, staff_no: str, first_name: str, last_name: str, role: str, subject: str, assigned_form=None, assigned_stream=None):
    staff = db.query(Staff).filter(Staff.staff_no == staff_no).first()
    if not staff:
        staff = Staff(
            staff_no=staff_no,
            first_name=first_name,
            last_name=last_name,
            role=role,
            subject=subject,
            assigned_form=assigned_form,
            assigned_stream=assigned_stream,
            hashed_password=get_password_hash(staff_no),
        )
        db.add(staff)
        db.flush()
        return staff

    staff.first_name = first_name
    staff.last_name = last_name
    staff.role = role
    staff.subject = subject
    staff.assigned_form = assigned_form
    staff.assigned_stream = assigned_stream
    return staff


def _upsert_student(
    db,
    *,
    admission_no: str,
    first_name: str,
    last_name: str,
    form: int,
    stream: str,
    guardian_name: str,
    guardian_phone: str,
):
    student = db.query(Student).filter(Student.admission_no == admission_no).first()
    if not student:
        student = Student(
            admission_no=admission_no,
            first_name=first_name,
            last_name=last_name,
            gender="Female" if first_name.endswith("a") else "Male",
            form=form,
            stream=stream,
            guardian_name=guardian_name,
            guardian_phone=guardian_phone,
            fee_balance=0,
        )
        db.add(student)
        db.flush()
        return student

    student.first_name = first_name
    student.last_name = last_name
    student.form = form
    student.stream = stream
    student.guardian_name = guardian_name
    student.guardian_phone = guardian_phone
    return student


def _ensure_fee_assignment(db, student: Student, fee_structure: FeeStructure):
    student_fee = (
        db.query(StudentFee)
        .filter(StudentFee.student_id == student.id, StudentFee.fee_structure_id == fee_structure.id)
        .first()
    )
    if not student_fee:
        student_fee = StudentFee(
            student_id=student.id,
            fee_structure_id=fee_structure.id,
            amount_owed=fee_structure.amount,
            amount_paid=0,
            status="pending",
        )
        db.add(student_fee)
        db.flush()
    return student_fee


def seed_demo():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        class_teacher = _upsert_staff(
            db,
            staff_no="TSC1001",
            first_name="Grace",
            last_name="Wanjiku",
            role="class_teacher",
            subject="Mathematics",
            assigned_form=2,
            assigned_stream="North",
        )
        bursar = _upsert_staff(
            db,
            staff_no="TSC2001",
            first_name="Peter",
            last_name="Mwangi",
            role="bursar",
            subject="Finance",
        )

        students = [
            _upsert_student(
                db,
                admission_no="ADM2001",
                first_name="Brian",
                last_name="Kamau",
                form=2,
                stream="North",
                guardian_name="Alice Kamau",
                guardian_phone="+254700000111",
            ),
            _upsert_student(
                db,
                admission_no="ADM2002",
                first_name="Lilian",
                last_name="Achieng",
                form=2,
                stream="North",
                guardian_name="John Achieng",
                guardian_phone="+254700000222",
            ),
            _upsert_student(
                db,
                admission_no="ADM2003",
                first_name="Kevin",
                last_name="Otieno",
                form=2,
                stream="North",
                guardian_name="Rose Otieno",
                guardian_phone="+254700000333",
            ),
        ]

        fee_structure = (
            db.query(FeeStructure)
            .filter(FeeStructure.name == "Form 2 Term 2 2026", FeeStructure.grade == 2, FeeStructure.term == 2, FeeStructure.year == 2026)
            .first()
        )
        if not fee_structure:
            fee_structure = FeeStructure(
                name="Form 2 Term 2 2026",
                grade=2,
                term=2,
                amount=32000,
                year=2026,
                description="Demo fee structure for bursar dashboard",
            )
            db.add(fee_structure)
            db.flush()

        for index, student in enumerate(students):
            student_fee = _ensure_fee_assignment(db, student, fee_structure)
            target_paid = 20000 if index == 0 else 12000 if index == 1 else 5000
            student_fee.amount_paid = min(target_paid, student_fee.amount_owed)
            student_fee.status = "paid" if student_fee.amount_paid >= student_fee.amount_owed else "partial"
            student.fee_balance = max(0, student_fee.amount_owed - student_fee.amount_paid)

            attendance = (
                db.query(AttendanceRecord)
                .filter(AttendanceRecord.student_id == student.id, AttendanceRecord.date == date.today())
                .first()
            )
            if not attendance:
                attendance = AttendanceRecord(
                    student_id=student.id,
                    date=date.today(),
                    status="present" if index != 2 else "absent",
                    marked_by=class_teacher.id,
                )
                db.add(attendance)
            else:
                attendance.status = "present" if index != 2 else "absent"
                attendance.marked_by = class_teacher.id

        existing_message = (
            db.query(ParentFeeMessage)
            .filter(ParentFeeMessage.student_id == students[2].id, ParentFeeMessage.sent_by == bursar.id)
            .first()
        )
        if not existing_message:
            db.add(
                ParentFeeMessage(
                    student_id=students[2].id,
                    sent_by=bursar.id,
                    guardian_phone=students[2].guardian_phone,
                    message="Demo reminder: Please clear the outstanding fee balance for this term.",
                    status="queued",
                )
            )

        if not db.query(PocketMoneyTransaction).filter(PocketMoneyTransaction.student_id == students[0].id).first():
            db.add(
                PocketMoneyTransaction(
                    student_id=students[0].id,
                    amount=1500,
                    transaction_type="deposit",
                    note="Demo opening balance",
                    recorded_by=bursar.id,
                )
            )
            db.add(
                PocketMoneyTransaction(
                    student_id=students[0].id,
                    amount=400,
                    transaction_type="withdrawal",
                    note="Demo canteen purchase",
                    recorded_by=bursar.id,
                )
            )

        db.commit()
        print("Demo seed complete.")
        print("Class teacher login -> tsc_number: TSC1001, password: TSC1001, name: Grace")
        print("Bursar login -> tsc_number: TSC2001, password: TSC2001, name: Peter")
    finally:
        db.close()


if __name__ == "__main__":
    seed_demo()
