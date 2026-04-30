"""
Small deterministic seed for analytics testing (no Faker, no Docker required).

Run:
  python seed_test_analytics.py
"""

from database import Base, db_context, engine
from models.grade import Grade
from models.staff import Staff
from models.student import Student
from security import get_password_hash
from utils.grading import knec_grade


def _upsert_staff(db):
    staff_rows = [
        {
            "staff_no": "TSC100",
            "first_name": "Alice",
            "last_name": "Njeri",
            "role": "Teacher",
            "subject": "Mathematics",
            "phone": "0700000001",
            "email": "alice.njeri@school.local",
        },
        {
            "staff_no": "TSC101",
            "first_name": "Brian",
            "last_name": "Otieno",
            "role": "Class Teacher",
            "subject": "English",
            "phone": "0700000002",
            "email": "brian.otieno@school.local",
        },
        {
            "staff_no": "TSC102",
            "first_name": "Carol",
            "last_name": "Wanjiku",
            "role": "Admin",
            "subject": "Biology",
            "phone": "0700000003",
            "email": "carol.wanjiku@school.local",
        },
        {
            "staff_no": "TSC103",
            "first_name": "Daniel",
            "last_name": "Mwangi",
            "role": "Principal",
            "subject": "Chemistry",
            "phone": "0700000004",
            "email": "daniel.mwangi@school.local",
        },
    ]

    by_staff_no = {}
    for row in staff_rows:
        existing = db.query(Staff).filter(Staff.staff_no == row["staff_no"]).first()
        if existing:
            for key, value in row.items():
                setattr(existing, key, value)
            # Keep login convention: password == staff_no
            existing.hashed_password = get_password_hash(row["staff_no"])
            by_staff_no[row["staff_no"]] = existing
        else:
            new_row = Staff(**row, hashed_password=get_password_hash(row["staff_no"]))
            db.add(new_row)
            db.flush()
            by_staff_no[row["staff_no"]] = new_row
    return by_staff_no


def _upsert_students(db):
    student_rows = [
        ("ADM001", "John", "Kamau", "Male", 4, "North"),
        ("ADM002", "Faith", "Achieng", "Female", 4, "North"),
        ("ADM003", "Kevin", "Mutua", "Male", 4, "South"),
        ("ADM004", "Mercy", "Atieno", "Female", 3, "South"),
        ("ADM005", "Peter", "Kibet", "Male", 2, "East"),
        ("ADM006", "Lydia", "Chebet", "Female", 1, "East"),
    ]
    by_adm = {}
    for adm, first, last, gender, form, stream in student_rows:
        existing = db.query(Student).filter(Student.admission_no == adm).first()
        if existing:
            existing.first_name = first
            existing.last_name = last
            existing.gender = gender
            existing.form = form
            existing.stream = stream
            by_adm[adm] = existing
        else:
            new_row = Student(
                admission_no=adm,
                first_name=first,
                last_name=last,
                gender=gender,
                form=form,
                stream=stream,
                guardian_name="Test Guardian",
                guardian_phone="0700000000",
            )
            db.add(new_row)
            db.flush()
            by_adm[adm] = new_row
    return by_adm


def _replace_grades(db, by_staff_no, by_adm):
    student_ids = [s.id for s in by_adm.values()]
    db.query(Grade).filter(Grade.student_id.in_(student_ids)).delete(synchronize_session=False)

    specs = [
        # year 2025 (last year for 2026 filters) includes Form 4 A grades for KCSE A count checks
        ("ADM001", "TSC100", "Mathematics", 3, 2025, 84),
        ("ADM002", "TSC100", "Mathematics", 3, 2025, 81),
        ("ADM003", "TSC100", "Mathematics", 3, 2025, 69),
        ("ADM001", "TSC101", "English", 3, 2025, 76),
        ("ADM002", "TSC101", "English", 3, 2025, 73),
        ("ADM003", "TSC101", "English", 3, 2025, 66),
        # year 2026 active records across terms/forms
        ("ADM001", "TSC100", "Mathematics", 1, 2026, 78),
        ("ADM001", "TSC100", "Mathematics", 2, 2026, 82),
        ("ADM002", "TSC100", "Mathematics", 1, 2026, 75),
        ("ADM002", "TSC100", "Mathematics", 2, 2026, 79),
        ("ADM003", "TSC100", "Mathematics", 1, 2026, 62),
        ("ADM003", "TSC100", "Mathematics", 2, 2026, 67),
        ("ADM001", "TSC101", "English", 1, 2026, 74),
        ("ADM001", "TSC101", "English", 2, 2026, 77),
        ("ADM002", "TSC101", "English", 1, 2026, 71),
        ("ADM002", "TSC101", "English", 2, 2026, 76),
        ("ADM004", "TSC101", "English", 1, 2026, 58),
        ("ADM004", "TSC101", "English", 2, 2026, 61),
        ("ADM005", "TSC100", "Mathematics", 1, 2026, 49),
        ("ADM006", "TSC101", "English", 1, 2026, 52),
    ]

    for adm, staff_no, subject, term, year, marks in specs:
        db.add(
            Grade(
                student_id=by_adm[adm].id,
                teacher_id=by_staff_no[staff_no].id,
                subject=subject,
                term=term,
                year=year,
                marks=marks,
                grade=knec_grade(marks),
            )
        )


def main():
    Base.metadata.create_all(bind=engine)
    with db_context() as db:
        by_staff_no = _upsert_staff(db)
        by_adm = _upsert_students(db)
        _replace_grades(db, by_staff_no, by_adm)

    print("Seed complete.")
    print("Logins (password = staff_no):")
    print("- Teacher: TSC100")
    print("- Class Teacher: TSC101")
    print("- Admin: TSC102")
    print("- Principal: TSC103")


if __name__ == "__main__":
    main()
