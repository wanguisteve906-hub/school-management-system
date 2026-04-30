from collections import defaultdict
from statistics import pstdev

from sqlalchemy.orm import Session

from models.grade import Grade
from models.fees import Payment, StudentFee
from models.staff import Staff
from models.student import Student

ROLE_TEACHER = "teacher"
ROLE_CLASS_TEACHER = "class teacher"
ROLE_ADMIN = "admin"
ROLE_PRINCIPAL = "principal"


def _normalize_role(value: str | None) -> str:
    return (value or "").strip().lower()


def _is_adminish(role: str) -> bool:
    # Accept exact + common variants while keeping explicit semantics.
    return (
        role in {ROLE_ADMIN, ROLE_PRINCIPAL}
        or "admin" in role
        or "principal" in role
    )


def _enforce_role_access(user):
    role = _normalize_role(getattr(user, "role", ""))
    if _is_adminish(role):
        return role
    allowed = {ROLE_TEACHER, ROLE_CLASS_TEACHER}
    if role not in allowed:
        raise ValueError(
            "Unsupported role. Expected one of: Teacher, Class Teacher, Admin, Principal."
        )
    return role


def _apply_filters(query, *, form=None, stream=None, term=None, year=None, subject=None):
    if form is not None:
        query = query.filter(Student.form == form)
    if stream:
        query = query.filter(Student.stream == stream)
    if term is not None:
        query = query.filter(Grade.term == term)
    if year is not None:
        query = query.filter(Grade.year == year)
    if subject:
        query = query.filter(Grade.subject == subject)
    return query


def _base_rows(
    db: Session,
    *,
    form=None,
    stream=None,
    term=None,
    year=None,
    subject=None,
    user=None,
):
    query = (
        db.query(Grade, Student, Staff)
        .join(Student, Student.id == Grade.student_id)
        .outerjoin(Staff, Staff.id == Grade.teacher_id)
    )
    query = _apply_filters(
        query,
        form=form,
        stream=stream,
        term=term,
        year=year,
        subject=subject,
    )

    if user is not None:
        role = _enforce_role_access(user)
        if role == ROLE_TEACHER:
            query = query.filter((Grade.teacher_id == user.id) | (Grade.subject == user.subject))
        elif role == ROLE_CLASS_TEACHER:
            # Class teacher is scoped by the class/stream they teach in their subject.
            class_rows = (
                db.query(Grade.student_id)
                .filter((Grade.teacher_id == user.id) | (Grade.subject == user.subject))
                .distinct()
                .all()
            )
            student_ids = [row[0] for row in class_rows]
            if student_ids:
                query = query.filter(Student.id.in_(student_ids))
            else:
                query = query.filter(Grade.teacher_id == user.id)
        elif _is_adminish(role):
            pass

    return query.all()


def overview(db: Session, **filters):
    rows = _base_rows(db, **filters)
    selected_year = filters.get("year")
    if not rows:
        return {
            "mean_score": 0,
            "mean_grade": "N/A",
            "total_students": 0,
            "pass_rate": 0,
            "standard_deviation": 0,
            "kcse_a_count_last_year": 0,
        }

    marks = [g.marks for g, _, _ in rows]
    grades = [g.grade for g, _, _ in rows]
    pass_count = len([g for g in grades if g not in {"D", "D-", "E"}])
    mean_score = sum(marks) / len(marks)

    distribution = defaultdict(int)
    for g in grades:
        distribution[g] += 1
    mean_grade = max(distribution.items(), key=lambda x: x[1])[0]

    if selected_year is None:
        selected_year = max([g.year for g, _, _ in rows], default=None)
    last_year = (selected_year - 1) if selected_year else None
    kcse_a_count_last_year = len(
        [
            1
            for g, s, _ in rows
            if last_year is not None and g.year == last_year and s.form == 4 and g.grade == "A"
        ]
    )

    return {
        "mean_score": round(mean_score, 2),
        "mean_grade": mean_grade,
        "total_students": len({s.id for _, s, _ in rows}),
        "pass_rate": round((pass_count / len(grades)) * 100, 2),
        "standard_deviation": round(pstdev(marks), 2) if len(marks) > 1 else 0,
        "kcse_a_count_last_year": kcse_a_count_last_year,
    }


def subject_teacher_insights(db: Session, **filters):
    rows = _base_rows(db, **filters)
    grouped = defaultdict(lambda: {"total": 0, "count": 0})
    for grade, _, teacher in rows:
        teacher_name = (
            f"{teacher.first_name} {teacher.last_name}" if teacher else "Unassigned"
        )
        teacher_id = teacher.id if teacher else None
        key = (teacher_id, grade.subject, teacher_name)
        grouped[key]["total"] += grade.marks
        grouped[key]["count"] += 1

    data = []
    for (teacher_id, subject, teacher_name), stats in grouped.items():
        data.append(
            {
                "teacher_id": teacher_id,
                "subject": subject,
                "teacher": teacher_name,
                "mean_score": round(stats["total"] / stats["count"], 2),
                "records": stats["count"],
            }
        )
    data.sort(key=lambda x: x["mean_score"], reverse=True)
    return {
        "best": data[0] if data else None,
        "worst": data[-1] if data else None,
        "rows": data,
    }


def stream_comparison(db: Session, **filters):
    rows = _base_rows(db, **filters)
    by_stream = defaultdict(lambda: {"total": 0, "count": 0, "subjects": defaultdict(lambda: {"total": 0, "count": 0})})
    for grade, student, _ in rows:
        stream = student.stream
        by_stream[stream]["total"] += grade.marks
        by_stream[stream]["count"] += 1
        by_stream[stream]["subjects"][grade.subject]["total"] += grade.marks
        by_stream[stream]["subjects"][grade.subject]["count"] += 1

    result = []
    for stream, stats in by_stream.items():
        subject_means = []
        for subject, sub_stats in stats["subjects"].items():
            subject_means.append((subject, sub_stats["total"] / sub_stats["count"]))
        subject_means.sort(key=lambda x: x[1], reverse=True)
        result.append(
            {
                "stream": stream,
                "mean_score": round(stats["total"] / stats["count"], 2),
                "best_subject": subject_means[0][0] if subject_means else None,
                "weakest_subject": subject_means[-1][0] if subject_means else None,
            }
        )
    result.sort(key=lambda x: x["mean_score"], reverse=True)
    return result


def rankings_and_outliers(db: Session, **filters):
    rows = _base_rows(db, **filters)
    by_student = defaultdict(lambda: {"marks": [], "terms": defaultdict(list)})
    for grade, student, _ in rows:
        by_student[student.id]["marks"].append(grade.marks)
        by_student[student.id]["terms"][grade.term].append(grade.marks)

    rankings = []
    for student_id, stats in by_student.items():
        m = sum(stats["marks"]) / len(stats["marks"])
        rankings.append({"student_id": student_id, "mean_score": round(m, 2)})
    rankings.sort(key=lambda x: x["mean_score"], reverse=True)

    prev_score = None
    prev_rank = 0
    for idx, row in enumerate(rankings, start=1):
        if prev_score is None or row["mean_score"] != prev_score:
            prev_rank = idx
            prev_score = row["mean_score"]
        row["rank"] = prev_rank

    changes = []
    for student_id, stats in by_student.items():
        means = [
            (term, (sum(marks) / len(marks)))
            for term, marks in stats["terms"].items()
            if marks
        ]
        means.sort(key=lambda x: x[0])
        if len(means) >= 2:
            changes.append(
                {
                    "student_id": student_id,
                    "change": round(means[-1][1] - means[0][1], 2),
                }
            )

    return {
        "top_students": rankings[:10],
        "bottom_students": list(reversed(rankings[-10:])),
        "improvers": sorted(changes, key=lambda x: x["change"], reverse=True)[:5],
        "drops": sorted(changes, key=lambda x: x["change"])[:5],
        "failing": [r for r in rankings if r["mean_score"] < 40][:10],
    }


def student_drilldown(db: Session, student_id: int, **filters):
    rows = _base_rows(db, **filters)
    rows = [(g, s, t) for g, s, t in rows if s.id == student_id]
    if not rows:
        return None

    by_subject = defaultdict(list)
    by_term = defaultdict(list)
    for grade, _, _ in rows:
        by_subject[grade.subject].append(grade.marks)
        by_term[grade.term].append(grade.marks)

    subject_scores = [
        {"subject": subject, "mean_score": round(sum(marks) / len(marks), 2)}
        for subject, marks in by_subject.items()
    ]
    trend = [
        {"term": term, "mean_score": round(sum(marks) / len(marks), 2)}
        for term, marks in sorted(by_term.items(), key=lambda x: x[0])
    ]
    all_marks = [g.marks for g, _, _ in rows]

    return {
        "student_id": student_id,
        "overall_mean": round(sum(all_marks) / len(all_marks), 2),
        "subject_scores": sorted(subject_scores, key=lambda x: x["mean_score"], reverse=True),
        "trend": trend,
        "strengths": [s["subject"] for s in sorted(subject_scores, key=lambda x: x["mean_score"], reverse=True)[:3]],
        "weaknesses": [s["subject"] for s in sorted(subject_scores, key=lambda x: x["mean_score"])[:3]],
    }


def teacher_drilldown(db: Session, teacher_id: int, **filters):
    rows = _base_rows(db, **filters)
    rows = [(g, s, t) for g, s, t in rows if t and t.id == teacher_id]
    if not rows:
        return None

    teacher = rows[0][2]

    subject_perf = defaultdict(list)
    for grade, _, _ in rows:
        subject_perf[grade.subject].append(grade.marks)
    subject_performance = [
        {
            "subject": subject,
            "mean_score": round(sum(marks) / len(marks), 2),
            "records": len(marks),
        }
        for subject, marks in sorted(subject_perf.items(), key=lambda x: x[0])
    ]
    subjects_taught = [x["subject"] for x in subject_performance]

    form_perf = defaultdict(list)
    for grade, student, _ in rows:
        form_perf[student.form].append(grade.marks)
    form_performance = [
        {"form": form, "mean_score": round(sum(marks) / len(marks), 2), "records": len(marks)}
        for form, marks in sorted(form_perf.items(), key=lambda x: x[0])
    ]

    teacher_scores = defaultdict(list)
    for grade, _, t in _base_rows(db, **filters):
        if t:
            teacher_scores[t.id].append(grade.marks)
    ranking = sorted(
        [{"teacher_id": tid, "mean_score": round(sum(vals) / len(vals), 2)} for tid, vals in teacher_scores.items() if vals],
        key=lambda x: x["mean_score"],
        reverse=True,
    )
    rank = next((idx + 1 for idx, row in enumerate(ranking) if row["teacher_id"] == teacher_id), None)

    selected_year = filters.get("year")
    if selected_year is None:
        selected_year = max([g.year for g, _, _ in rows], default=None)
    last_year = (selected_year - 1) if selected_year else None
    kcse_a_count_last_year = len(
        [1 for g, s, _ in rows if last_year is not None and g.year == last_year and s.form == 4 and g.grade == "A"]
    )

    return {
        "teacher_id": teacher.id,
        "teacher_name": f"{teacher.first_name} {teacher.last_name}",
        "subject": ", ".join(subjects_taught) if subjects_taught else (teacher.subject or "N/A"),
        "subjects_taught": subjects_taught,
        "subject_performance": subject_performance,
        "overall_mean_score": round(sum([g.marks for g, _, _ in rows]) / len(rows), 2),
        "forms_taught": sorted(list(form_perf.keys())),
        "form_performance": form_performance,
        "teacher_rank": rank,
        "teachers_compared": len(ranking),
        "kcse_a_count_last_year": kcse_a_count_last_year,
    }


def operational_feed(db: Session, **filters):
    rows = _base_rows(db, **filters)
    total_students = db.query(Student).count()
    total_staff = db.query(Staff).count()
    total_grades = db.query(Grade).count()
    total_payments = db.query(Payment).count()

    outstanding = (
        db.query(StudentFee)
        .filter((StudentFee.amount_owed - StudentFee.amount_paid) > 0)
        .all()
    )
    severe_defaulters = len([x for x in outstanding if (x.amount_owed - x.amount_paid) >= 10000])

    marks = [g.marks for g, _, _ in rows]
    average_score = round((sum(marks) / len(marks)), 2) if marks else 0
    attendance_proxy = 94 if total_staff > 0 else 0
    active_staff_proxy = max(total_staff - max(1, total_staff // 8), 0) if total_staff else 0

    stream_scores = defaultdict(list)
    for grade, student, _ in rows:
        stream_scores[f"Form {student.form}{student.stream}"].append(grade.marks)
    weakest_stream = None
    if stream_scores:
        weakest_stream = min(
            (
                {"stream": stream, "mean_score": round(sum(vals) / len(vals), 2)}
                for stream, vals in stream_scores.items()
            ),
            key=lambda x: x["mean_score"],
        )

    latest_payment = db.query(Payment).order_by(Payment.paid_at.desc()).first()
    latest_payment_amount = latest_payment.amount if latest_payment else 0

    alerts = [
        {
            "id": "fee-arrears",
            "type": "danger" if severe_defaulters > 0 else "success",
            "message": (
                f"{severe_defaulters} students have balances above KES 10,000"
                if severe_defaulters > 0
                else "No severe fee arrears detected"
            ),
            "time": "live",
            "severity": "high" if severe_defaulters > 0 else "low",
            "actionTo": "/fees/balances",
        },
        {
            "id": "attendance-watch",
            "type": "warning" if attendance_proxy < 90 else "info",
            "message": f"Teacher attendance proxy is {attendance_proxy}%",
            "time": "live",
            "severity": "medium" if attendance_proxy < 90 else "low",
            "actionTo": "/staff",
        },
        {
            "id": "academic-risk",
            "type": "warning" if weakest_stream and weakest_stream["mean_score"] < 45 else "info",
            "message": (
                f"{weakest_stream['stream']} is below 45% mean score"
                if weakest_stream and weakest_stream["mean_score"] < 45
                else "No critical academic outlier detected"
            ),
            "time": "live",
            "severity": "medium" if weakest_stream and weakest_stream["mean_score"] < 45 else "low",
            "actionTo": "/performance",
        },
    ]

    activity = [
        {
            "id": "activity-payments",
            "user": "Finance",
            "action": "processed latest payment of",
            "target": f"KES {latest_payment_amount:,}",
            "time": "just now",
        },
        {
            "id": "activity-grades",
            "user": "Academics",
            "action": "synchronized grade records:",
            "target": f"{total_grades}",
            "time": "1 min ago",
        },
        {
            "id": "activity-admissions",
            "user": "Admissions",
            "action": "student roster currently at",
            "target": f"{total_students}",
            "time": "2 min ago",
        },
        {
            "id": "activity-staff",
            "user": "HR",
            "action": "active staffing estimate",
            "target": f"{active_staff_proxy}/{total_staff}",
            "time": "3 min ago",
        },
        {
            "id": "activity-system",
            "user": "System",
            "action": "payment transactions tracked",
            "target": f"{total_payments}",
            "time": "4 min ago",
        },
    ]

    schedule = [
        {"label": "NOW", "time": "08:00", "title": "Mathematics", "meta": "Form 3A - Room 4B", "highlight": True},
        {"label": "UPCOMING", "time": "10:00", "title": "Chemistry Exam", "meta": "Form 4 - Lab 2", "highlight": False},
        {"label": "EVENT", "time": "14:00", "title": "Staff Meeting", "meta": "Conference Room", "highlight": False},
        {
            "label": "DEADLINE",
            "time": "16:30",
            "title": "Fee Follow-up Cutoff",
            "meta": f"{len(outstanding)} outstanding accounts",
            "highlight": False,
        },
    ]

    return {
        "alerts": alerts,
        "activity": activity,
        "schedule": schedule,
        "meta": {
            "students": total_students,
            "staff": total_staff,
            "average_score": average_score,
            "outstanding_accounts": len(outstanding),
        },
    }
