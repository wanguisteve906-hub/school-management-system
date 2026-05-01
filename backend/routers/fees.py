from sqlalchemy import func
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from auth import get_current_user, require_roles
from crud import fees as fees_crud
from database import get_db
from models.fees import ParentFeeMessage, PocketMoneyTransaction
from models.student import Student
from schemas.fees import (
    AssignFeeResult,
    DefaulterOut,
    FeeStructureCreate,
    FeeStructureOut,
    ParentMessageCreate,
    ParentMessageOut,
    PaymentCreate,
    PaymentOut,
    PocketMoneyBalanceOut,
    PocketMoneyCreate,
    PocketMoneyOut,
    StudentFeeOut,
    StudentBalanceOut,
)

router = APIRouter(prefix="/fees", tags=["fees"])
bursar_or_admin = Depends(require_roles("bursar", "principal", "finance_officer", "admin"))


@router.post("/structures", response_model=FeeStructureOut, dependencies=[bursar_or_admin])
def create_fee_structure(payload: FeeStructureCreate, db: Session = Depends(get_db)):
    return fees_crud.create_fee_structure(db, payload)


@router.get("/structures", response_model=list[FeeStructureOut], dependencies=[bursar_or_admin])
def list_fee_structures(
    skip: int = 0,
    limit: int = Query(default=100, le=500),
    db: Session = Depends(get_db),
):
    return fees_crud.list_fee_structures(db, skip=skip, limit=limit)


@router.post("/assign/{fee_id}/{grade}", response_model=AssignFeeResult, dependencies=[bursar_or_admin])
def assign_fee(fee_id: int, grade: int, db: Session = Depends(get_db)):
    if grade < 1 or grade > 4:
        raise HTTPException(status_code=400, detail="Grade must be between 1 and 4")

    fee_structure = fees_crud.get_fee_structure_by_id(db, fee_id)
    if not fee_structure:
        raise HTTPException(status_code=404, detail="Fee structure not found")

    result = fees_crud.assign_fee_to_grade_students(db, fee_structure, grade)
    return result


@router.post("/payments", response_model=PaymentOut, dependencies=[bursar_or_admin])
def record_payment(payload: PaymentCreate, db: Session = Depends(get_db)):
    payment, error = fees_crud.record_payment(db, payload)
    if error:
        raise HTTPException(status_code=400, detail=error)
    return payment


@router.get("/student-fees", response_model=list[StudentFeeOut], dependencies=[bursar_or_admin])
def list_student_fees(student_id: int | None = None, db: Session = Depends(get_db)):
    return fees_crud.list_student_fees(db, student_id=student_id)


@router.get("/balance/{student_id}", response_model=StudentBalanceOut, dependencies=[bursar_or_admin])
def get_balance(student_id: int, db: Session = Depends(get_db)):
    balance = fees_crud.get_student_balance(db, student_id)
    if not balance:
        raise HTTPException(status_code=404, detail="Student not found")
    return balance


@router.get("/defaulters", response_model=list[DefaulterOut], dependencies=[bursar_or_admin])
def list_defaulters(db: Session = Depends(get_db)):
    return fees_crud.list_defaulters(db)


@router.get("/clearance-status", response_model=list[StudentFeeOut], dependencies=[bursar_or_admin])
def clearance_status(student_id: int | None = None, db: Session = Depends(get_db)):
    return fees_crud.list_student_fees(db, student_id=student_id)


@router.post("/defaulters/{student_id}/message", response_model=ParentMessageOut, dependencies=[bursar_or_admin])
def message_defaulter_parent(
    student_id: int,
    payload: ParentMessageCreate,
    user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    student = db.query(Student).filter(Student.id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    message = ParentFeeMessage(
        student_id=student.id,
        sent_by=user.id,
        guardian_phone=student.guardian_phone,
        message=payload.message,
        status="queued",
    )
    db.add(message)
    db.commit()
    db.refresh(message)
    return {
        "id": message.id,
        "student_id": student.id,
        "student_name": f"{student.first_name} {student.last_name}",
        "guardian_phone": message.guardian_phone,
        "message": message.message,
        "status": message.status,
        "created_at": message.created_at,
    }


@router.get("/defaulters/messages", response_model=list[ParentMessageOut], dependencies=[bursar_or_admin])
def list_parent_messages(db: Session = Depends(get_db)):
    rows = (
        db.query(ParentFeeMessage, Student)
        .join(Student, Student.id == ParentFeeMessage.student_id)
        .order_by(ParentFeeMessage.created_at.desc())
        .limit(100)
        .all()
    )
    return [
        {
            "id": m.id,
            "student_id": s.id,
            "student_name": f"{s.first_name} {s.last_name}",
            "guardian_phone": m.guardian_phone,
            "message": m.message,
            "status": m.status,
            "created_at": m.created_at,
        }
        for m, s in rows
    ]


@router.post("/pocket-money/{student_id}", response_model=PocketMoneyOut, dependencies=[bursar_or_admin])
def record_pocket_money(
    student_id: int,
    payload: PocketMoneyCreate,
    user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    student = db.query(Student).filter(Student.id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    txn = PocketMoneyTransaction(
        student_id=student.id,
        amount=payload.amount,
        transaction_type=payload.transaction_type,
        note=payload.note,
        recorded_by=user.id,
    )
    db.add(txn)
    db.commit()
    db.refresh(txn)
    return {
        "id": txn.id,
        "student_id": student.id,
        "student_name": f"{student.first_name} {student.last_name}",
        "amount": txn.amount,
        "transaction_type": txn.transaction_type,
        "note": txn.note,
        "created_at": txn.created_at,
    }


@router.get("/pocket-money/{student_id}", response_model=PocketMoneyBalanceOut, dependencies=[bursar_or_admin])
def pocket_money_balance(student_id: int, db: Session = Depends(get_db)):
    student = db.query(Student).filter(Student.id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    deposits = (
        db.query(func.coalesce(func.sum(PocketMoneyTransaction.amount), 0))
        .filter(PocketMoneyTransaction.student_id == student_id, PocketMoneyTransaction.transaction_type == "deposit")
        .scalar()
    )
    withdrawals = (
        db.query(func.coalesce(func.sum(PocketMoneyTransaction.amount), 0))
        .filter(PocketMoneyTransaction.student_id == student_id, PocketMoneyTransaction.transaction_type == "withdrawal")
        .scalar()
    )
    return {
        "student_id": student.id,
        "student_name": f"{student.first_name} {student.last_name}",
        "balance": int(deposits or 0) - int(withdrawals or 0),
    }
