from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from crud import staff as staff_crud
from database import get_db
from models.staff import Staff
from schemas.auth import LoginRequest, MessageResponse, SignupRequest, TokenResponse
from security import create_access_token, get_password_hash, verify_password

router = APIRouter(prefix="/auth", tags=["auth"])


def _name_matches(entered: str, first: str, last: str) -> bool:
    e = " ".join(entered.strip().split()).casefold()
    return e == " ".join(first.strip().split()).casefold() or e == " ".join(last.strip().split()).casefold()


@router.post("/signup", response_model=MessageResponse, status_code=status.HTTP_201_CREATED)
def signup(payload: SignupRequest, db: Session = Depends(get_db)):
    tsc = payload.tsc_number.strip()
    if staff_crud.get_staff_by_username(db, tsc):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This TSC number is already registered",
        )
    db.add(
        Staff(
            staff_no=tsc,
            first_name=payload.first_name.strip(),
            last_name=payload.last_name.strip(),
            role="Teacher",
            subject="General",
            hashed_password=get_password_hash(tsc),
        )
    )
    db.commit()
    return MessageResponse(message="Account created. You can sign in now.")


@router.post("/login", response_model=TokenResponse)
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    tsc = payload.tsc_number.strip()
    user = staff_crud.get_staff_by_username(db, tsc)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid TSC number, password, or name",
        )
    if not verify_password(payload.password.strip(), user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid TSC number, password, or name",
        )
    if not _name_matches(payload.name, user.first_name, user.last_name):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid TSC number, password, or name",
        )
    token = create_access_token({"sub": str(user.id), "staff_no": user.staff_no})
    return TokenResponse(access_token=token)
