PATIENT_PAYLOAD = {
    "full_name": "Report Patient",
    "age": 60,
    "gender": "male",
    "phone": "+250788444555",
    "condition": "hypertension",
    "language": "en",
    "recurrence_days": 30,
    "first_appointment_date": "2026-08-01T09:00:00Z",
}


def test_facility_report_starts_empty(client, admin_headers):
    response = client.get("/reports/facility", headers=admin_headers)
    assert response.status_code == 200
    body = response.json()
    assert body["total_patients"] == 0
    assert body["attendance_rate"] == 0.0


def test_facility_report_reflects_attendance(client, nurse_headers, admin_headers):
    client.post("/patients", json=PATIENT_PAYLOAD, headers=nurse_headers)
    dashboard = client.get("/dashboard", headers=nurse_headers).json()
    appointment_id = dashboard["upcoming"][0]["id"]
    client.post(f"/appointments/{appointment_id}/attend", headers=nurse_headers)

    report = client.get("/reports/facility", headers=admin_headers).json()
    assert report["total_patients"] == 1
    assert report["attended_count"] == 1
    assert report["missed_count"] == 0
    assert report["attendance_rate"] == 1.0


def test_nurse_cannot_view_facility_report(client, nurse_headers):
    response = client.get("/reports/facility", headers=nurse_headers)
    assert response.status_code == 403


def test_patient_history_includes_appointments(client, nurse_headers):
    patient = client.post("/patients", json=PATIENT_PAYLOAD, headers=nurse_headers).json()

    response = client.get(f"/patients/{patient['id']}/history", headers=nurse_headers)
    assert response.status_code == 200
    body = response.json()
    assert body["patient"]["id"] == patient["id"]
    assert len(body["appointments"]) == 1
    assert body["check_ins"] == []
