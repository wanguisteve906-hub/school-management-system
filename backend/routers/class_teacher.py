from datetime import date

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from auth import require_class_teacher
from database import get_db
from models.fees import AttendanceRecord
from models.student import Student
from schemas.fees import AttendanceBatchUpdate, AttendanceOut

router = APIRouter(prefix="/class-teacher", tags=["class_teacher"])


@router.get("/my-class/students")
def list_assigned_class_students(user=Depends(require_class_teacher), db: Session = Depends(get_db)):
    students = (
        db.query(Student)
        .filter(Student.form == user.assigned_form, Student.stream == user.assigned_stream)
        .order_by(Student.first_name.asc(), Student.last_name.asc())
        .all()
    )
    return [
        {
            "id": s.id,
            "admission_no": s.admission_no,
            "first_name": s.first_name,
            "last_name": s.last_name,
            "form": s.form,
            "stream": s.stream,
            "guardian_name": s.guardian_name,
            "guardian_phone": s.guardian_phone,
        }
        for s in students
    ]


@router.get("/my-class/attendance", response_model=list[AttendanceOut])
def get_class_attendance(
    target_date: date,
    user=Depends(require_class_teacher),
    db: Session = Depends(get_db),
):
    students = (
        db.query(Student)
        .filter(Student.form == user.assigned_form, Student.stream == user.assigned_stream)
        .order_by(Student.first_name.asc(), Student.last_name.asc())
        .all()
    )
    student_ids = {s.id for s in students}
    records = (
        db.query(AttendanceRecord)
        .filter(AttendanceRecord.date == target_date, AttendanceRecord.student_id.in_(student_ids))
        .all()
    )
    by_student = {r.student_id: r.status for r in records}
    return [
        {
            "student_id": s.id,
            "student_name": f"{s.first_name} {s.last_name}",
            "status": by_student.get(s.id, "present"),
        }
        for s in students
    ]


@router.put("/my-class/attendance")
def update_class_attendance(payload: AttendanceBatchUpdate, user=Depends(require_class_teacher), db: Session = Depends(get_db)):
    students = (
        db.query(Student.id)
        .filter(Student.form == user.assigned_form, Student.stream == user.assigned_stream)
        .all()
    )
    allowed_ids = {s.id for s in students}

    updated = 0
    for item in payload.records:
        if item.student_id not in allowed_ids:
            continue
        record = (
            db.query(AttendanceRecord)
            .filter(AttendanceRecord.student_id == item.student_id, AttendanceRecord.date == payload.date)
            .first()
        )
        if not record:
            record = AttendanceRecord(
                student_id=item.student_id,
                date=payload.date,
                status=item.status,
                marked_by=user.id,
            )
            db.add(record)
        else:
            record.status = item.status
            record.marked_by = user.id
        updated += 1

    db.commit()
    return {"updated_count": updated, "date": payload.date}
