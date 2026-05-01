from pydantic import BaseModel


class StaffBase(BaseModel):
    staff_no: str
    first_name: str
    last_name: str
    role: str
    subject: str
    assigned_form: int | None = None
    assigned_stream: str | None = None
    phone: str | None = None
    email: str | None = None


class StaffCreate(StaffBase):
    pass


class StaffUpdate(BaseModel):
    first_name: str | None = None
    last_name: str | None = None
    role: str | None = None
    subject: str | None = None
    phone: str | None = None
    email: str | None = None


class StaffOut(StaffBase):
    id: int

    class Config:
        from_attributes = True
