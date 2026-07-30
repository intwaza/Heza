PATIENT_PAYLOAD = {
    "full_name": "Jean Bosco Nshuti",
    "age": 54,
    "gender": "male",
    "phone": "+250788123456",
    "condition": "hypertension",
    "language": "en",
    "recurrence_days": 30,
    "first_appointment_date": "2026-08-01T09:00:00Z",
}


def test_register_patient_also_creates_first_appointment(client, nurse_headers):
    response = client.post("/patients", json=PATIENT_PAYLOAD, headers=nurse_headers)
    assert response.status_code == 201
    body = response.json()
    assert body["full_name"] == "Jean Bosco Nshuti"
    assert body["status"] == "active"

    dashboard = client.get("/dashboard", headers=nurse_headers).json()
    assert len(dashboard["upcoming"]) == 1
    assert dashboard["upcoming"][0]["patient_id"] == body["id"]


def test_register_patient_rejects_bad_phone(client, nurse_headers):
    payload = {**PATIENT_PAYLOAD, "phone": "not-a-phone"}
    response = client.post("/patients", json=payload, headers=nurse_headers)
    assert response.status_code == 422


def test_register_patient_rejects_invalid_recurrence(client, nurse_headers):
    payload = {**PATIENT_PAYLOAD, "recurrence_days": 45}
    response = client.post("/patients", json=payload, headers=nurse_headers)
    assert response.status_code == 422


def test_update_patient_phone(client, nurse_headers):
    created = client.post("/patients", json=PATIENT_PAYLOAD, headers=nurse_headers).json()

    response = client.patch(
        f"/patients/{created['id']}", json={"phone": "+250788999999"}, headers=nurse_headers
    )
    assert response.status_code == 200
    assert response.json()["phone"] == "+250788999999"


def test_deactivate_patient(client, nurse_headers):
    created = client.post("/patients", json=PATIENT_PAYLOAD, headers=nurse_headers).json()

    response = client.post(f"/patients/{created['id']}/deactivate", headers=nurse_headers)
    assert response.status_code == 200
    assert response.json()["status"] == "deactivated"

    second_attempt = client.post(f"/patients/{created['id']}/deactivate", headers=nurse_headers)
    assert second_attempt.status_code == 400


def test_worker_cannot_see_patient_from_another_facility(client, nurse_headers, make_worker, other_facility):
    created = client.post("/patients", json=PATIENT_PAYLOAD, headers=nurse_headers).json()

    outsider = make_worker(username="outsider", facility_id=other_facility.id)
    from tests.conftest import auth_header

    outsider_headers = auth_header(outsider)

    response = client.get(f"/patients/{created['id']}", headers=outsider_headers)
    assert response.status_code == 404


def test_worker_cannot_list_other_facilities_patients(client, nurse_headers, make_worker, other_facility):
    client.post("/patients", json=PATIENT_PAYLOAD, headers=nurse_headers)

    outsider = make_worker(username="outsider2", facility_id=other_facility.id)
    from tests.conftest import auth_header

    response = client.get("/patients", headers=auth_header(outsider))
    assert response.json() == []
