import os

os.environ.setdefault("JWT_SECRET_KEY", "test_jwt_secret_key")

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

import database

_test_engine = create_engine(
    "sqlite://",
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
database.engine = _test_engine
database.SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=database.engine)

from models import budget, grade, inventory, staff, student  # noqa: F401, E402

database.Base.metadata.create_all(bind=database.engine)

from fastapi.testclient import TestClient  # noqa: E402
import pytest  # noqa: E402

from database import SessionLocal  # noqa: E402
from main import app  # noqa: E402
from models.staff import Staff  # noqa: E402
from security import get_password_hash  # noqa: E402


@pytest.fixture
def client():
    db = SessionLocal()
    try:
        if db.query(Staff).filter(Staff.staff_no == "TEST001").first() is None:
            db.add(
                Staff(
                    staff_no="TEST001",
                    first_name="Test",
                    last_name="User",
                    role="Teacher",
                    subject="Mathematics",
                    hashed_password=get_password_hash("TEST001"),
                )
            )
            db.commit()
    finally:
        db.close()

    with TestClient(app) as c:
        yield c


@pytest.fixture
def auth_headers(client):
    res = client.post(
        "/auth/login",
        json={"tsc_number": "TEST001", "password": "TEST001", "name": "Test"},
    )
    assert res.status_code == 200
    token = res.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}
