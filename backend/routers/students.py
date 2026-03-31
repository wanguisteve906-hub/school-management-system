from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from auth import get_current_user
from crud import student as student_crud
from database import get_db
from schemas.student import StudentCreate, StudentOut, StudentUpdate

router = APIRouter(prefix="/students", tags=["students"])


@router.get("", response_model=list[StudentOut], dependencies=[Depends(get_current_user)])
def list_students(
    skip: int = 0,
    limit: int = Query(default=100, le=500),
    q: str | None = None,
    db: Session = Depends(get_db),
):
    return student_crud.get_students(db, skip=skip, limit=limit, query=q)


@router.get("/{student_id}", response_model=StudentOut, dependencies=[Depends(get_current_user)])
def get_student(student_id: int, db: Session = Depends(get_db)):
    student = student_crud.get_student_by_id(db, student_id)
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    return student


@router.post("", response_model=StudentOut, dependencies=[Depends(get_current_user)])
def create_student(payload: StudentCreate, db: Session = Depends(get_db)):
    return student_crud.create_student(db, payload)


@router.put("/{student_id}", response_model=StudentOut, dependencies=[Depends(get_current_user)])
def update_student(student_id: int, payload: StudentUpdate, db: Session = Depends(get_db)):
    student = student_crud.get_student_by_id(db, student_id)
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    return student_crud.update_student(db, student, payload)


@router.delete("/{student_id}", dependencies=[Depends(get_current_user)])
def delete_student(student_id: int, db: Session = Depends(get_db)):
    student = student_crud.get_student_by_id(db, student_id)
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    student_crud.delete_student(db, student)
    return {"message": "Student deleted"}
