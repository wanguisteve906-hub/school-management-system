from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from auth import get_current_user
from crud import student as student_crud
from database import get_db
from schemas.student import StudentCreate, StudentOut, StudentUpdate

router = APIRouter(prefix="/students", tags=["students"])


@router.get("", dependencies=[Depends(get_current_user)])
def list_students(
    skip: int = 0,
    limit: int = Query(default=20, ge=1, le=100),
    q: str | None = None,
    form: int | None = None,
    stream: str | None = None,
    kcpe_min: int | None = None,
    kcpe_max: int | None = None,
    db: Session = Depends(get_db),
):
    students = student_crud.get_students(db, skip=skip, limit=limit, query=q, form=form, stream=stream, kcpe_min=kcpe_min, kcpe_max=kcpe_max)
    total = student_crud.get_total_count(db, query=q, form=form, stream=stream, kcpe_min=kcpe_min, kcpe_max=kcpe_max)
    return {"students": students, "total": total, "skip": skip, "limit": limit}


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
