from datetime import date

from pydantic import BaseModel


class BudgetBase(BaseModel):
    category: str
    allocated_amount: int
    spent_amount: int
    period: str
    record_date: date


class BudgetCreate(BudgetBase):
    pass


class BudgetUpdate(BaseModel):
    category: str | None = None
    allocated_amount: int | None = None
    spent_amount: int | None = None
    period: str | None = None
    record_date: date | None = None


class BudgetOut(BudgetBase):
    id: int

    class Config:
        from_attributes = True
