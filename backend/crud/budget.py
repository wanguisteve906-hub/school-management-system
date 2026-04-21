from sqlalchemy.orm import Session

from models.budget import Budget
from schemas.budget import BudgetCreate, BudgetUpdate


def get_budget_records(db: Session):
    return db.query(Budget).all()


def get_budget_by_id(db: Session, budget_id: int):
    return db.query(Budget).filter(Budget.id == budget_id).first()


def create_budget(db: Session, payload: BudgetCreate):
    db_obj = Budget(**payload.model_dump())
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj


def update_budget(db: Session, db_obj: Budget, payload: BudgetUpdate):
    updates = payload.model_dump(exclude_unset=True)
    for key, value in updates.items():
        setattr(db_obj, key, value)
    db.commit()
    db.refresh(db_obj)
    return db_obj


def delete_budget(db: Session, db_obj: Budget):
    db.delete(db_obj)
    db.commit()
