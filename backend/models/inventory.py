from sqlalchemy import Column, Integer, String

from database import Base


class Inventory(Base):
    __tablename__ = "inventory"

    id = Column(Integer, primary_key=True, index=True)
    item_name = Column(String(120), nullable=False, index=True)
    category = Column(String(80), nullable=False)
    quantity = Column(Integer, nullable=False)
    condition = Column(String(20), nullable=False, default="Good")
    location = Column(String(100), nullable=True)
