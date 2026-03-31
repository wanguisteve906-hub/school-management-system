import random
from datetime import date

from faker import Faker

from database import Base, SessionLocal, engine
from models.budget import Budget
from models.grade import Grade
from models.inventory import Inventory
from models.staff import Staff
from models.student import Student
from security import get_password_hash
from utils.grading import knec_grade

fake = Faker()

KENYAN_FIRST_NAMES = [
    "Akinyi", "Otieno", "Wanjiku", "Kamau", "Njeri", "Kiptoo", "Auma", "Barasa", "Mutiso", "Atieno",
    "Muthoni", "Chebet", "Mwangi", "Anyango", "Kariuki", "Achieng", "Nambuye", "Omondi", "Koech", "Wekesa",
]
KENYAN_LAST_NAMES = [
    "Odhiambo", "Maina", "Wambui", "Kipchoge", "Mutua", "Were", "Nyaga", "Kiplagat", "Wanjala", "Mulei",
    "Kagwe", "Njoroge", "Mboya", "Kilonzo", "Wafula", "Karanja", "Cherono", "Mburu", "Onyango", "Mumo",
]
SUBJECTS = [
    "Mathematics", "English", "Kiswahili", "Biology", "Chemistry", "Physics",
    "History", "Geography", "CRE", "Business", "Agriculture",
]
STREAMS = ["East", "West", "North"]


def seed():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        if db.query(Student).count() > 0:
            print("Database already seeded.")
            return

        staff_records = []
        for i in range(1, 26):
            staff_member = Staff(
                staff_no=f"TSC{i:03d}",
                first_name=random.choice(KENYAN_FIRST_NAMES),
                last_name=random.choice(KENYAN_LAST_NAMES),
                role="Teacher" if i <= 22 else "Admin",
                subject=SUBJECTS[(i - 1) % len(SUBJECTS)],
                phone=f"07{random.randint(10000000, 99999999)}",
                email=f"staff{i}@elimuhms.ac.ke",
                hashed_password=get_password_hash(f"TSC{i:03d}"),
            )
            db.add(staff_member)
            staff_records.append(staff_member)
        db.flush()

        students = []
        for i in range(1, 221):
            student = Student(
                admission_no=f"ELM{i:04d}",
                first_name=random.choice(KENYAN_FIRST_NAMES),
                last_name=random.choice(KENYAN_LAST_NAMES),
                gender=random.choice(["Male", "Female"]),
                form=random.randint(1, 4),
                stream=random.choice(STREAMS),
                guardian_name=f"{random.choice(KENYAN_FIRST_NAMES)} {random.choice(KENYAN_LAST_NAMES)}",
                guardian_phone=f"07{random.randint(10000000, 99999999)}",
                fee_balance=random.randint(0, 55000),
            )
            db.add(student)
            students.append(student)
        db.flush()

        for student in students:
            for term in [1, 2, 3]:
                for subject in SUBJECTS:
                    mark = random.randint(28, 95)
                    db.add(
                        Grade(
                            student_id=student.id,
                            teacher_id=random.choice(staff_records).id,
                            subject=subject,
                            term=term,
                            year=2026,
                            marks=mark,
                            grade=knec_grade(mark),
                        )
                    )

        budget_records = [
            ("Tuition", 4200000, 3100000),
            ("Infrastructure", 2400000, 1300000),
            ("Meals", 1800000, 1410000),
            ("Utilities", 650000, 530000),
            ("Co-curricular", 500000, 390000),
        ]
        for category, allocated, spent in budget_records:
            db.add(
                Budget(
                    category=category,
                    allocated_amount=allocated,
                    spent_amount=spent,
                    period="2026",
                    record_date=date.today(),
                )
            )

        for item, category, qty, condition in [
            ("Desks", "Furniture", 450, "Good"),
            ("Lab Stools", "Furniture", 120, "Fair"),
            ("Chemistry Kits", "Laboratory", 80, "Good"),
            ("Projectors", "Electronics", 12, "Fair"),
            ("Textbooks", "Academics", 3000, "Good"),
            ("Sports Kits", "Sports", 95, "Damaged"),
        ]:
            db.add(
                Inventory(
                    item_name=item,
                    category=category,
                    quantity=qty,
                    condition=condition,
                    location="Main Store",
                )
            )

        db.commit()
        print("Seed complete: 220 students, 25 staff, grades, budget, inventory.")
    finally:
        db.close()


if __name__ == "__main__":
    seed()
