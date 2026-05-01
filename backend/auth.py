from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from crud import staff as staff_crud
from database import get_db
from security import decode_token

security_scheme = HTTPBearer()


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security_scheme),
    db: Session = Depends(get_db),
):
    token = credentials.credentials
    try:
        payload = decode_token(token)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials",
        )

    staff_id = payload.get("sub")
    if not staff_id:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token subject missing")

    user = staff_crud.get_staff_by_id(db, int(staff_id))
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")
    return user


def require_roles(*allowed_roles: str):
    allowed = {r.strip().casefold() for r in allowed_roles if r.strip()}

    def _checker(user=Depends(get_current_user)):
        role = (user.role or "").strip().casefold()
        if role not in allowed:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You are not allowed to access this resource")
        return user

    return _checker


def require_class_teacher(user=Depends(get_current_user)):
    role = (user.role or "").strip().casefold()
    if role != "class_teacher":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Class teacher access required")
    if user.assigned_form is None or not user.assigned_stream:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Class teacher is not assigned to a class")
    return user
