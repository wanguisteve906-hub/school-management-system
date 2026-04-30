from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from auth import get_current_user
from crud import analytics as analytics_crud
from database import get_db

router = APIRouter(prefix="/analytics", tags=["analytics"])


def _filters(form=None, stream=None, term=None, year=None, subject=None):
    return {
        "form": form,
        "stream": stream,
        "term": term,
        "year": year,
        "subject": subject,
    }


@router.get("/overview", dependencies=[Depends(get_current_user)])
def analytics_overview(
    form: int | None = None,
    stream: str | None = None,
    term: int | None = None,
    year: int | None = None,
    subject: str | None = None,
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
):
    try:
        return analytics_crud.overview(db, user=user, **_filters(form, stream, term, year, subject))
    except ValueError as exc:
        raise HTTPException(status_code=403, detail=str(exc))


@router.get("/subject-teacher", dependencies=[Depends(get_current_user)])
def analytics_subject_teacher(
    form: int | None = None,
    stream: str | None = None,
    term: int | None = None,
    year: int | None = None,
    subject: str | None = None,
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
):
    try:
        return analytics_crud.subject_teacher_insights(
            db, user=user, **_filters(form, stream, term, year, subject)
        )
    except ValueError as exc:
        raise HTTPException(status_code=403, detail=str(exc))


@router.get("/streams", dependencies=[Depends(get_current_user)])
def analytics_streams(
    form: int | None = None,
    stream: str | None = None,
    term: int | None = None,
    year: int | None = None,
    subject: str | None = None,
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
):
    try:
        return analytics_crud.stream_comparison(
            db, user=user, **_filters(form, stream, term, year, subject)
        )
    except ValueError as exc:
        raise HTTPException(status_code=403, detail=str(exc))


@router.get("/rankings-outliers", dependencies=[Depends(get_current_user)])
def analytics_rankings_outliers(
    form: int | None = None,
    stream: str | None = None,
    term: int | None = None,
    year: int | None = None,
    subject: str | None = None,
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
):
    try:
        return analytics_crud.rankings_and_outliers(
            db, user=user, **_filters(form, stream, term, year, subject)
        )
    except ValueError as exc:
        raise HTTPException(status_code=403, detail=str(exc))


@router.get("/student/{student_id}", dependencies=[Depends(get_current_user)])
def analytics_student_drilldown(
    student_id: int,
    form: int | None = None,
    stream: str | None = None,
    term: int | None = None,
    year: int | None = None,
    subject: str | None = None,
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
):
    try:
        data = analytics_crud.student_drilldown(
            db,
            student_id=student_id,
            user=user,
            **_filters(form, stream, term, year, subject),
        )
    except ValueError as exc:
        raise HTTPException(status_code=403, detail=str(exc))
    if not data:
        raise HTTPException(status_code=404, detail="Student analytics not found")
    return data


@router.get("/teacher/{teacher_id}", dependencies=[Depends(get_current_user)])
def analytics_teacher_drilldown(
    teacher_id: int,
    form: int | None = None,
    stream: str | None = None,
    term: int | None = None,
    year: int | None = None,
    subject: str | None = None,
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
):
    try:
        data = analytics_crud.teacher_drilldown(
            db,
            teacher_id=teacher_id,
            user=user,
            **_filters(form, stream, term, year, subject),
        )
    except ValueError as exc:
        raise HTTPException(status_code=403, detail=str(exc))
    if not data:
        raise HTTPException(status_code=404, detail="Teacher analytics not found")
    return data


@router.get("/operational-feed", dependencies=[Depends(get_current_user)])
def analytics_operational_feed(
    form: int | None = None,
    stream: str | None = None,
    term: int | None = None,
    year: int | None = None,
    subject: str | None = None,
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
):
    try:
        return analytics_crud.operational_feed(db, user=user, **_filters(form, stream, term, year, subject))
    except ValueError as exc:
        raise HTTPException(status_code=403, detail=str(exc))
