from sqlalchemy import Column, Integer, String
from sqlalchemy.orm import relationship

from database import Base


class Student(Base):
    __tablename__ = "students"

    id = Column(Integer, primary_key=True, index=True)
    admission_no = Column(String(50), unique=True, index=True, nullable=False)
    first_name = Column(String(100), nullable=False)
    last_name = Column(String(100), nullable=False)
    gender = Column(String(10), nullable=False)
    form = Column(Integer, nullable=False)
    stream = Column(String(20), nullable=False)
    kcpe_score = Column(Integer, nullable=True)
    guardian_name = Column(String(150), nullable=True)
    guardian_phone = Column(String(20), nullable=True)
    fee_balance = Column(Integer, default=0, nullable=False)

    grades = relationship("Grade", back_populates="student", cascade="all, delete-orphan")
    student_fees = relationship("StudentFee", back_populates="student", cascade="all, delete-orphan")
    payments = relationship("Payment", back_populates="student", cascade="all, delete-orphan")
