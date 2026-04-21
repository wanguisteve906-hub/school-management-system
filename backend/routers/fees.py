from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from auth import get_current_user
from crud import fees as fees_crud
from database import get_db
from schemas.fees import (
    AssignFeeResult,
    DefaulterOut,
    FeeStructureCreate,
    FeeStructureOut,
    PaymentCreate,
    PaymentOut,
    StudentFeeOut,
    StudentBalanceOut,
)

router = APIRouter(prefix="/fees", tags=["fees"])


@router.post("/structures", response_model=FeeStructureOut, dependencies=[Depends(get_current_user)])
def create_fee_structure(payload: FeeStructureCreate, db: Session = Depends(get_db)):
    return fees_crud.create_fee_structure(db, payload)


@router.get("/structures", response_model=list[FeeStructureOut], dependencies=[Depends(get_current_user)])
def list_fee_structures(
    skip: int = 0,
    limit: int = Query(default=100, le=500),
    db: Session = Depends(get_db),
):
    return fees_crud.list_fee_structures(db, skip=skip, limit=limit)


@router.post("/assign/{fee_id}/{grade}", response_model=AssignFeeResult, dependencies=[Depends(get_current_user)])
def assign_fee(fee_id: int, grade: int, db: Session = Depends(get_db)):
    if grade < 1 or grade > 4:
        raise HTTPException(status_code=400, detail="Grade must be between 1 and 4")

    fee_structure = fees_crud.get_fee_structure_by_id(db, fee_id)
    if not fee_structure:
        raise HTTPException(status_code=404, detail="Fee structure not found")

    result = fees_crud.assign_fee_to_grade_students(db, fee_structure, grade)
    return result


@router.post("/payments", response_model=PaymentOut, dependencies=[Depends(get_current_user)])
def record_payment(payload: PaymentCreate, db: Session = Depends(get_db)):
    payment, error = fees_crud.record_payment(db, payload)
    if error:
        raise HTTPException(status_code=400, detail=error)
    return payment


@router.get("/student-fees", response_model=list[StudentFeeOut], dependencies=[Depends(get_current_user)])
def list_student_fees(student_id: int | None = None, db: Session = Depends(get_db)):
    return fees_crud.list_student_fees(db, student_id=student_id)


@router.get("/balance/{student_id}", response_model=StudentBalanceOut, dependencies=[Depends(get_current_user)])
def get_balance(student_id: int, db: Session = Depends(get_db)):
    balance = fees_crud.get_student_balance(db, student_id)
    if not balance:
        raise HTTPException(status_code=404, detail="Student not found")
    return balance


@router.get("/defaulters", response_model=list[DefaulterOut], dependencies=[Depends(get_current_user)])
def list_defaulters(db: Session = Depends(get_db)):
    return fees_crud.list_defaulters(db)
