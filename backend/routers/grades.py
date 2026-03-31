from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from auth import get_current_user
from crud import grade as grade_crud
from database import get_db
from schemas.grade import GradeCreate, GradeOut, GradeUpdate
from utils.cache import cache_delete_prefix, cache_get_json, cache_set_json

router = APIRouter(prefix="/grades", tags=["grades"])


@router.get("", response_model=list[GradeOut], dependencies=[Depends(get_current_user)])
def list_grades(
    form: int | None = None,
    stream: str | None = None,
    term: int | None = None,
    db: Session = Depends(get_db),
):
    return grade_crud.get_grades(db, form=form, stream=stream, term=term)


@router.post("", response_model=GradeOut, dependencies=[Depends(get_current_user)])
def create_grade(payload: GradeCreate, db: Session = Depends(get_db)):
    cache_delete_prefix("class_performance")
    cache_delete_prefix("student_rankings")
    return grade_crud.create_grade(db, payload)


@router.put("/{grade_id}", response_model=GradeOut, dependencies=[Depends(get_current_user)])
def update_grade(grade_id: int, payload: GradeUpdate, db: Session = Depends(get_db)):
    record = grade_crud.get_grade_by_id(db, grade_id)
    if not record:
        raise HTTPException(status_code=404, detail="Grade not found")
    cache_delete_prefix("class_performance")
    cache_delete_prefix("student_rankings")
    return grade_crud.update_grade(db, record, payload)


@router.delete("/{grade_id}", dependencies=[Depends(get_current_user)])
def delete_grade(grade_id: int, db: Session = Depends(get_db)):
    record = grade_crud.get_grade_by_id(db, grade_id)
    if not record:
        raise HTTPException(status_code=404, detail="Grade not found")
    cache_delete_prefix("class_performance")
    cache_delete_prefix("student_rankings")
    grade_crud.delete_grade(db, record)
    return {"message": "Grade deleted"}


@router.get("/summary/class-performance", dependencies=[Depends(get_current_user)])
def class_performance(db: Session = Depends(get_db)):
    key = "class_performance:v1"
    cached = cache_get_json(key)
    if cached:
        return {"source": "cache", "data": cached}
    data = grade_crud.class_performance_summary(db)
    cache_set_json(key, data, ttl_seconds=300)
    return {"source": "db", "data": data}


@router.get("/summary/rankings", dependencies=[Depends(get_current_user)])
def rankings(term: int | None = None, db: Session = Depends(get_db)):
    key = f"student_rankings:{term or 'all'}"
    cached = cache_get_json(key)
    if cached:
        return {"source": "cache", "data": cached}
    data = grade_crud.student_rankings(db, term=term)
    cache_set_json(key, data, ttl_seconds=180)
    return {"source": "db", "data": data}
