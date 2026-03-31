from sqlalchemy import Column, ForeignKey, Integer, String
from sqlalchemy.orm import relationship

from database import Base


class Grade(Base):
    __tablename__ = "grades"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id"), nullable=False, index=True)
    teacher_id = Column(Integer, ForeignKey("staff.id"), nullable=True, index=True)
    subject = Column(String(50), nullable=False)
    term = Column(Integer, nullable=False)
    year = Column(Integer, nullable=False)
    marks = Column(Integer, nullable=False)
    grade = Column(String(2), nullable=False)

    student = relationship("Student", back_populates="grades")
    teacher = relationship("Staff", back_populates="grades")
