import uuid


def test_list_students_with_token(client, auth_headers):
    res = client.get("/api/students", headers=auth_headers)
    assert res.status_code == 200
    assert isinstance(res.json(), list)


def test_create_student(client, auth_headers):
    uid = uuid.uuid4().hex[:8]
    payload = {
        "admission_no": f"TST-{uid}",
        "first_name": "Jane",
        "last_name": "Doe",
        "gender": "Female",
        "form": 2,
        "stream": "East",
        "guardian_name": "Parent Doe",
        "guardian_phone": "0712345678",
        "fee_balance": 0,
    }
    res = client.post("/api/students", json=payload, headers=auth_headers)
    assert res.status_code == 200
    body = res.json()
    assert body["admission_no"] == payload["admission_no"]
    assert body["id"] > 0

    listed = client.get("/api/students", headers=auth_headers).json()
    assert any(s["admission_no"] == payload["admission_no"] for s in listed)
