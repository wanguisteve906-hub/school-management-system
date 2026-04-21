from collections import defaultdict

from sqlalchemy import func
from sqlalchemy.orm import Session

from models.grade import Grade
from models.student import Student
from schemas.grade import GradeCreate, GradeUpdate
from utils.grading import knec_grade


def get_grades(db: Session, form: int | None = None, stream: str | None = None, term: int | None = None):
    q = db.query(Grade).join(Student, Student.id == Grade.student_id)
    if form:
        q = q.filter(Student.form == form)
    if stream:
        q = q.filter(Student.stream == stream)
    if term:
        q = q.filter(Grade.term == term)
    return q.all()


def get_grade_by_id(db: Session, grade_id: int):
    return db.query(Grade).filter(Grade.id == grade_id).first()


def create_grade(db: Session, payload: GradeCreate):
    data = payload.model_dump()
    data["grade"] = knec_grade(data["marks"])
    db_obj = Grade(**data)
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj


def update_grade(db: Session, db_obj: Grade, payload: GradeUpdate):
    updates = payload.model_dump(exclude_unset=True)
    for key, value in updates.items():
        setattr(db_obj, key, value)
    if "marks" in updates:
        db_obj.grade = knec_grade(db_obj.marks)
    db.commit()
    db.refresh(db_obj)
    return db_obj


def delete_grade(db: Session, db_obj: Grade):
    db.delete(db_obj)
    db.commit()


def class_performance_summary(db: Session):
    rows = (
        db.query(Student.form, Student.stream, func.avg(Grade.marks).label("mean_marks"))
        .join(Grade, Grade.student_id == Student.id)
        .group_by(Student.form, Student.stream)
        .all()
    )
    return [
        {
            "form": form,
            "stream": stream,
            "mean_score": round(float(mean_marks), 2),
            "mean_grade": knec_grade(int(round(float(mean_marks)))),
        }
        for form, stream, mean_marks in rows
    ]


def student_rankings(db: Session, term: int | None = None):
    q = db.query(Grade)
    if term:
        q = q.filter(Grade.term == term)
    grade_rows = q.all()

    totals = defaultdict(lambda: {"sum": 0, "count": 0})
    for row in grade_rows:
        totals[row.student_id]["sum"] += row.marks
        totals[row.student_id]["count"] += 1

    entries = []
    for student_id, data in totals.items():
        mean = data["sum"] / data["count"] if data["count"] else 0
        entries.append({"student_id": student_id, "mean_score": round(mean, 2), "grade": knec_grade(int(round(mean)))})

    entries.sort(key=lambda x: x["mean_score"], reverse=True)
    for idx, item in enumerate(entries, 1):
        item["school_rank"] = idx

    by_class = defaultdict(list)
    students = {s.id: s for s in db.query(Student).all()}
    for item in entries:
        student = students.get(item["student_id"])
        if student:
            by_class[(student.form, student.stream)].append(item)

    for (_, _), group in by_class.items():
        group.sort(key=lambda x: x["mean_score"], reverse=True)
        for idx, item in enumerate(group, 1):
            item["class_rank"] = idx

    return entries
