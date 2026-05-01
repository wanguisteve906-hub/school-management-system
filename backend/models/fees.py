from sqlalchemy import Column, Date, DateTime, ForeignKey, Integer, String, func
from sqlalchemy.orm import relationship

from database import Base


class FeeStructure(Base):
    __tablename__ = "fee_structures"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(120), nullable=False)
    grade = Column(Integer, nullable=False, index=True)
    term = Column(Integer, nullable=False, index=True)
    amount = Column(Integer, nullable=False)
    year = Column(Integer, nullable=False, index=True)
    description = Column(String(255), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    student_fees = relationship("StudentFee", back_populates="fee_structure", cascade="all, delete-orphan")


class StudentFee(Base):
    __tablename__ = "student_fees"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id"), nullable=False, index=True)
    fee_structure_id = Column(Integer, ForeignKey("fee_structures.id"), nullable=False, index=True)
    amount_owed = Column(Integer, nullable=False)
    amount_paid = Column(Integer, nullable=False, default=0)
    status = Column(String(20), nullable=False, default="pending")
    assigned_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    student = relationship("Student", back_populates="student_fees")
    fee_structure = relationship("FeeStructure", back_populates="student_fees")
    payments = relationship("Payment", back_populates="student_fee", cascade="all, delete-orphan")


class Payment(Base):
    __tablename__ = "payments"

    id = Column(Integer, primary_key=True, index=True)
    student_fee_id = Column(Integer, ForeignKey("student_fees.id"), nullable=False, index=True)
    student_id = Column(Integer, ForeignKey("students.id"), nullable=False, index=True)
    amount = Column(Integer, nullable=False)
    payment_method = Column(String(30), nullable=False)
    receipt_number = Column(String(20), nullable=False, unique=True, index=True)
    mpesa_code = Column(String(40), nullable=True, index=True)
    transaction_reference = Column(String(120), nullable=True)
    paid_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    student_fee = relationship("StudentFee", back_populates="payments")
    student = relationship("Student", back_populates="payments")


class AttendanceRecord(Base):
    __tablename__ = "attendance_records"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id"), nullable=False, index=True)
    date = Column(Date, nullable=False, index=True)
    status = Column(String(20), nullable=False, default="present")
    marked_by = Column(Integer, ForeignKey("staff.id"), nullable=False, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    student = relationship("Student")


class ParentFeeMessage(Base):
    __tablename__ = "parent_fee_messages"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id"), nullable=False, index=True)
    sent_by = Column(Integer, ForeignKey("staff.id"), nullable=False, index=True)
    guardian_phone = Column(String(20), nullable=True)
    message = Column(String(500), nullable=False)
    status = Column(String(20), nullable=False, default="queued")
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    student = relationship("Student")


class PocketMoneyTransaction(Base):
    __tablename__ = "pocket_money_transactions"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id"), nullable=False, index=True)
    amount = Column(Integer, nullable=False)
    transaction_type = Column(String(20), nullable=False)
    note = Column(String(255), nullable=True)
    recorded_by = Column(Integer, ForeignKey("staff.id"), nullable=False, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    student = relationship("Student")
