from datetime import date, datetime
from typing import Literal

from pydantic import BaseModel, Field, model_validator


PaymentMethod = Literal["Cash", "M-Pesa", "Bank Transfer", "Cheque"]


class FeeStructureCreate(BaseModel):
    name: str
    grade: int = Field(ge=1, le=4)
    term: int = Field(ge=1, le=3)
    amount: int = Field(gt=0)
    year: int = Field(ge=2000)
    description: str | None = None


class FeeStructureOut(FeeStructureCreate):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True


class AssignFeeResult(BaseModel):
    assigned_count: int
    updated_count: int


class PaymentCreate(BaseModel):
    student_fee_id: int
    amount: int = Field(gt=0)
    payment_method: PaymentMethod
    mpesa_code: str | None = None
    transaction_reference: str | None = None

    @model_validator(mode="after")
    def validate_mpesa_code(self):
        if self.payment_method == "M-Pesa" and not self.mpesa_code:
            raise ValueError("mpesa_code is required for M-Pesa payments")
        return self


class PaymentOut(BaseModel):
    id: int
    student_fee_id: int
    student_id: int
    amount: int
    payment_method: PaymentMethod
    receipt_number: str
    mpesa_code: str | None
    transaction_reference: str | None
    paid_at: datetime

    class Config:
        from_attributes = True


class StudentFeeOut(BaseModel):
    id: int
    student_id: int
    student_name: str
    fee_structure_id: int
    fee_name: str
    term: int
    year: int
    amount_owed: int
    amount_paid: int
    balance: int
    status: str


class StudentBalanceOut(BaseModel):
    student_id: int
    student_name: str
    total_owed: int
    total_paid: int
    balance: int


class DefaulterOut(StudentBalanceOut):
    pass


class AttendanceMark(BaseModel):
    student_id: int
    status: Literal["present", "absent", "late"]


class AttendanceBatchUpdate(BaseModel):
    date: date
    records: list[AttendanceMark]


class AttendanceOut(BaseModel):
    student_id: int
    student_name: str
    status: str


class ParentMessageCreate(BaseModel):
    message: str = Field(min_length=3, max_length=500)


class ParentMessageOut(BaseModel):
    id: int
    student_id: int
    student_name: str
    guardian_phone: str | None
    message: str
    status: str
    created_at: datetime


class PocketMoneyCreate(BaseModel):
    amount: int = Field(gt=0)
    transaction_type: Literal["deposit", "withdrawal"]
    note: str | None = Field(default=None, max_length=255)


class PocketMoneyOut(BaseModel):
    id: int
    student_id: int
    student_name: str
    amount: int
    transaction_type: str
    note: str | None
    created_at: datetime


class PocketMoneyBalanceOut(BaseModel):
    student_id: int
    student_name: str
    balance: int
