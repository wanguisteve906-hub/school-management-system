from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from auth import get_current_user
from crud import staff as staff_crud
from database import get_db
from schemas.staff import StaffCreate, StaffOut, StaffUpdate

router = APIRouter(prefix="/staff", tags=["staff"])


@router.get("", response_model=list[StaffOut], dependencies=[Depends(get_current_user)])
def list_staff(db: Session = Depends(get_db)):
    return staff_crud.get_staff(db)


@router.post("", response_model=StaffOut, dependencies=[Depends(get_current_user)])
def create_staff(payload: StaffCreate, db: Session = Depends(get_db)):
    return staff_crud.create_staff(db, payload)


@router.put("/{staff_id}", response_model=StaffOut, dependencies=[Depends(get_current_user)])
def update_staff(staff_id: int, payload: StaffUpdate, db: Session = Depends(get_db)):
    record = staff_crud.get_staff_by_id(db, staff_id)
    if not record:
        raise HTTPException(status_code=404, detail="Staff not found")
    return staff_crud.update_staff(db, record, payload)


@router.delete("/{staff_id}", dependencies=[Depends(get_current_user)])
def delete_staff(staff_id: int, db: Session = Depends(get_db)):
    record = staff_crud.get_staff_by_id(db, staff_id)
    if not record:
        raise HTTPException(status_code=404, detail="Staff not found")
    staff_crud.delete_staff(db, record)
    return {"message": "Staff deleted"}
