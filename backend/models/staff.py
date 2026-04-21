from sqlalchemy import Column, Integer, String
from sqlalchemy.orm import relationship

from database import Base


class Staff(Base):
    __tablename__ = "staff"

    id = Column(Integer, primary_key=True, index=True)
    staff_no = Column(String(50), unique=True, index=True, nullable=False)
    first_name = Column(String(100), nullable=False)
    last_name = Column(String(100), nullable=False)
    role = Column(String(50), nullable=False)
    subject = Column(String(50), nullable=False)
    phone = Column(String(20), nullable=True)
    email = Column(String(120), nullable=True)
    hashed_password = Column(String(255), nullable=False, default="$2b$12$dummy")

    grades = relationship("Grade", back_populates="teacher")
