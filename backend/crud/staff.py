from sqlalchemy.orm import Session

from models.staff import Staff
from schemas.staff import StaffCreate, StaffUpdate
from security import get_password_hash


def get_staff(db: Session, skip: int = 0, limit: int = 100):
    return db.query(Staff).offset(skip).limit(limit).all()


def get_staff_by_id(db: Session, staff_id: int):
    return db.query(Staff).filter(Staff.id == staff_id).first()


def get_staff_by_username(db: Session, username: str):
    return db.query(Staff).filter(Staff.staff_no == username).first()


def create_staff(db: Session, payload: StaffCreate):
    data = payload.model_dump()
    raw_password = data.pop("staff_no")
    db_obj = Staff(**data, staff_no=payload.staff_no, hashed_password=get_password_hash(raw_password))
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj


def update_staff(db: Session, db_obj: Staff, payload: StaffUpdate):
    updates = payload.model_dump(exclude_unset=True)
    for key, value in updates.items():
        setattr(db_obj, key, value)
    db.commit()
    db.refresh(db_obj)
    return db_obj


def delete_staff(db: Session, db_obj: Staff):
    db.delete(db_obj)
    db.commit()
