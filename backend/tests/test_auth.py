import uuid


def test_signup(client):
    tsc = f"TSC-NEW-{uuid.uuid4().hex[:8]}"
    res = client.post(
        "/auth/signup",
        json={
            "first_name": "Jane",
            "last_name": "Doe",
            "tsc_number": tsc,
        },
    )
    assert res.status_code == 201
    assert "message" in res.json()


def test_signup_duplicate(client):
    tsc = f"TSC-DUP-{uuid.uuid4().hex[:8]}"
    r1 = client.post(
        "/auth/signup",
        json={"first_name": "A", "last_name": "B", "tsc_number": tsc},
    )
    assert r1.status_code == 201
    r2 = client.post(
        "/auth/signup",
        json={"first_name": "C", "last_name": "D", "tsc_number": tsc},
    )
    assert r2.status_code == 400


def test_login_success(client):
    res = client.post(
        "/auth/login",
        json={"tsc_number": "TEST001", "password": "TEST001", "name": "User"},
    )
    assert res.status_code == 200
    data = res.json()
    assert "access_token" in data
    assert data["access_token"]


def test_login_invalid_password(client):
    res = client.post(
        "/auth/login",
        json={"tsc_number": "TEST001", "password": "wrong", "name": "Test"},
    )
    assert res.status_code == 401
    assert "error" in res.json()


def test_login_wrong_name(client):
    res = client.post(
        "/auth/login",
        json={"tsc_number": "TEST001", "password": "TEST001", "name": "Nobody"},
    )
    assert res.status_code == 401


def test_students_requires_auth(client):
    res = client.get("/api/students")
    assert res.status_code == 401
