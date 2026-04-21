from sqlalchemy import Column, Date, Integer, String

from database import Base


class Budget(Base):
    __tablename__ = "budgets"

    id = Column(Integer, primary_key=True, index=True)
    category = Column(String(100), nullable=False, index=True)
    allocated_amount = Column(Integer, nullable=False)
    spent_amount = Column(Integer, nullable=False, default=0)
    period = Column(String(20), nullable=False)
    record_date = Column(Date, nullable=False)
