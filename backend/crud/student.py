from sqlalchemy.orm import Session

from models.student import Student
from schemas.student import StudentCreate, StudentUpdate


def get_students(db: Session, skip: int = 0, limit: int = 100, query: str | None = None):
    q = db.query(Student)
    if query:
        like = f"%{query}%"
        q = q.filter((Student.first_name.ilike(like)) | (Student.last_name.ilike(like)) | (Student.admission_no.ilike(like)))
    return q.offset(skip).limit(limit).all()


def get_student_by_id(db: Session, student_id: int):
    return db.query(Student).filter(Student.id == student_id).first()


def create_student(db: Session, payload: StudentCreate):
    db_obj = Student(**payload.model_dump())
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj


def update_student(db: Session, db_obj: Student, payload: StudentUpdate):
    updates = payload.model_dump(exclude_unset=True)
    for key, value in updates.items():
        setattr(db_obj, key, value)
    db.commit()
    db.refresh(db_obj)
    return db_obj


def delete_student(db: Session, db_obj: Student):
    db.delete(db_obj)
    db.commit()
