from pydantic import BaseModel, Field


class GradeBase(BaseModel):
    student_id: int
    teacher_id: int | None = None
    subject: str
    term: int = Field(ge=1, le=3)
    year: int
    marks: int = Field(ge=0, le=100)


class GradeCreate(GradeBase):
    pass


class GradeUpdate(BaseModel):
    teacher_id: int | None = None
    subject: str | None = None
    term: int | None = Field(default=None, ge=1, le=3)
    year: int | None = None
    marks: int | None = Field(default=None, ge=0, le=100)


class GradeOut(GradeBase):
    id: int
    grade: str

    class Config:
        from_attributes = True
