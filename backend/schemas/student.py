from pydantic import BaseModel, Field


class StudentBase(BaseModel):
    admission_no: str
    first_name: str
    last_name: str
    gender: str
    form: int = Field(ge=1, le=4)
    stream: str
    kcpe_score: int | None = None
    guardian_name: str | None = None
    guardian_phone: str | None = None
    fee_balance: int = 0


class StudentCreate(StudentBase):
    pass


class StudentUpdate(BaseModel):
    first_name: str | None = None
    last_name: str | None = None
    gender: str | None = None
    form: int | None = Field(default=None, ge=1, le=4)
    stream: str | None = None
    kcpe_score: int | None = None
    guardian_name: str | None = None
    guardian_phone: str | None = None
    fee_balance: int | None = None


class StudentOut(StudentBase):
    id: int

    class Config:
        from_attributes = True
