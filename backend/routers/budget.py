from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from auth import get_current_user
from crud import budget as budget_crud
from database import get_db
from schemas.budget import BudgetCreate, BudgetOut, BudgetUpdate

router = APIRouter(prefix="/budget", tags=["budget"])


@router.get("", response_model=list[BudgetOut], dependencies=[Depends(get_current_user)])
def list_budget(db: Session = Depends(get_db)):
    return budget_crud.get_budget_records(db)


@router.post("", response_model=BudgetOut, dependencies=[Depends(get_current_user)])
def create_budget(payload: BudgetCreate, db: Session = Depends(get_db)):
    return budget_crud.create_budget(db, payload)


@router.put("/{budget_id}", response_model=BudgetOut, dependencies=[Depends(get_current_user)])
def update_budget(budget_id: int, payload: BudgetUpdate, db: Session = Depends(get_db)):
    record = budget_crud.get_budget_by_id(db, budget_id)
    if not record:
        raise HTTPException(status_code=404, detail="Budget record not found")
    return budget_crud.update_budget(db, record, payload)


@router.delete("/{budget_id}", dependencies=[Depends(get_current_user)])
def delete_budget(budget_id: int, db: Session = Depends(get_db)):
    record = budget_crud.get_budget_by_id(db, budget_id)
    if not record:
        raise HTTPException(status_code=404, detail="Budget record not found")
    budget_crud.delete_budget(db, record)
    return {"message": "Budget record deleted"}
