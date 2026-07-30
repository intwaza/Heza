PATIENT_PAYLOAD = {
    "full_name": "Alice Uwimana",
    "age": 40,
    "gender": "female",
    "phone": "+250788111222",
    "condition": "type2_diabetes",
    "language": "rw",
    "recurrence_days": 90,
    "first_appointment_date": "2026-08-01T09:00:00Z",
}


def _register_patient_and_get_appointment_id(client, headers) -> tuple[int, int]:
    patient = client.post("/patients", json=PATIENT_PAYLOAD, headers=headers).json()
    dashboard = client.get("/dashboard", headers=headers).json()
    appointment_id = dashboard["upcoming"][0]["id"]
    return patient["id"], appointment_id


def test_mark_attended_moves_appointment_and_schedules_next_cycle(client, nurse_headers):
    _, appointment_id = _register_patient_and_get_appointment_id(client, nurse_headers)

    response = client.post(f"/appointments/{appointment_id}/attend", headers=nurse_headers)
    assert response.status_code == 200
    body = response.json()
    assert body["status"] == "attended"
    assert body["attended_date"] is not None

    dashboard = client.get("/dashboard", headers=nurse_headers).json()
    assert len(dashboard["attended"]) == 1
    assert len(dashboard["upcoming"]) == 1
    assert dashboard["upcoming"][0]["recurrence_days"] == 90


def test_cannot_mark_the_same_appointment_attended_twice(client, nurse_headers):
    _, appointment_id = _register_patient_and_get_appointment_id(client, nurse_headers)

    first = client.post(f"/appointments/{appointment_id}/attend", headers=nurse_headers)
    assert first.status_code == 200

    second = client.post(f"/appointments/{appointment_id}/attend", headers=nurse_headers)
    assert second.status_code == 400


def test_follow_up_note_requires_missed_status(client, nurse_headers):
    _, appointment_id = _register_patient_and_get_appointment_id(client, nurse_headers)

    response = client.post(
        f"/appointments/{appointment_id}/follow-up", json={"note": "Called, no answer"}, headers=nurse_headers
    )
    assert response.status_code == 400


def test_follow_up_note_on_missed_appointment(client, db_session, nurse_headers):
    from app.models import Appointment
    from app.models.enums import AppointmentStatus

    _, appointment_id = _register_patient_and_get_appointment_id(client, nurse_headers)
    appointment = db_session.get(Appointment, appointment_id)
    appointment.status = AppointmentStatus.missed
    db_session.commit()

    response = client.post(
        f"/appointments/{appointment_id}/follow-up", json={"note": "Called, will come tomorrow"}, headers=nurse_headers
    )
    assert response.status_code == 200
    assert response.json()["status"] == "followed_up"
    assert response.json()["follow_up_note"] == "Called, will come tomorrow"
