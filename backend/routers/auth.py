from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from crud import staff as staff_crud
from database import get_db
from schemas.auth import LoginRequest, TokenResponse
from security import create_access_token, verify_password

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/login", response_model=TokenResponse)
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    user = staff_crud.get_staff_by_username(db, payload.username)
    if not user or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username or password",
        )
    token = create_access_token({"sub": str(user.id), "staff_no": user.staff_no})
    return TokenResponse(access_token=token)
