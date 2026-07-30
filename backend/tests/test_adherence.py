from datetime import datetime, timedelta, timezone

from app.models import AdherenceCheckIn, Patient
from app.models.enums import CheckInStatus, Condition, Gender, Language, PatientStatus
from app.scheduler.jobs import close_stale_adherence_checkins
from app.services.adherence_service import close_overdue_checkins, send_weekly_checkins


def _make_patient(db_session, facility, nurse, **overrides) -> Patient:
    defaults = dict(
        facility_id=facility.id,
        created_by_id=nurse.id,
        full_name="Adherence Patient",
        age=38,
        gender=Gender.female,
        phone="+250788555666",
        condition=Condition.hiv,
        language=Language.en,
        status=PatientStatus.active,
    )
    defaults.update(overrides)
    patient = Patient(**defaults)
    db_session.add(patient)
    db_session.commit()
    db_session.refresh(patient)
    return patient


def test_weekly_checkin_sent_to_active_patient(db_session, facility, nurse, gateway):
    _make_patient(db_session, facility, nurse)

    sent = send_weekly_checkins(db_session, gateway)

    assert len(sent) == 1
    assert sent[0].status == CheckInStatus.sent
    assert len(gateway._provider.sent_messages) == 1


def test_weekly_checkin_skips_patient_already_checked_in_this_week(db_session, facility, nurse, gateway):
    patient = _make_patient(db_session, facility, nurse)
    db_session.add(
        AdherenceCheckIn(
            patient_id=patient.id,
            sent_date=datetime.now(timezone.utc) - timedelta(days=2),
            status=CheckInStatus.sent,
        )
    )
    db_session.commit()

    sent = send_weekly_checkins(db_session, gateway)

    assert sent == []
    assert gateway._provider.sent_messages == []


def test_webhook_records_yes_reply(client, db_session, facility, nurse):
    patient = _make_patient(db_session, facility, nurse, phone="+250788777888")
    db_session.add(
        AdherenceCheckIn(patient_id=patient.id, sent_date=datetime.now(timezone.utc), status=CheckInStatus.sent)
    )
    db_session.commit()

    response = client.post("/sms/webhook", json={"from": "+250788777888", "text": "y"})

    assert response.status_code == 200
    body = response.json()
    assert body["status"] == "confirmed"
    assert body["response"] == "Y"


def test_webhook_rejects_unrecognised_reply(client, db_session, facility, nurse):
    patient = _make_patient(db_session, facility, nurse, phone="+250788888999")
    db_session.add(
        AdherenceCheckIn(patient_id=patient.id, sent_date=datetime.now(timezone.utc), status=CheckInStatus.sent)
    )
    db_session.commit()

    response = client.post("/sms/webhook", json={"from": "+250788888999", "text": "maybe"})
    assert response.status_code == 400


def test_webhook_404_for_unknown_number(client):
    response = client.post("/sms/webhook", json={"from": "+250700000000", "text": "Y"})
    assert response.status_code == 404


def test_overdue_checkin_closed_as_no_response(db_session, facility, nurse):
    patient = _make_patient(db_session, facility, nurse)
    checkin = AdherenceCheckIn(
        patient_id=patient.id,
        sent_date=datetime.now(timezone.utc) - timedelta(hours=49),
        status=CheckInStatus.sent,
    )
    db_session.add(checkin)
    db_session.commit()

    closed = close_overdue_checkins(db_session)

    assert len(closed) == 1
    db_session.refresh(checkin)
    assert checkin.status == CheckInStatus.no_response
    assert checkin.consecutive_missed == 1
    assert checkin.worker_notified is False


def test_three_consecutive_no_responses_notifies_worker(db_session, facility, nurse):
    patient = _make_patient(db_session, facility, nurse)
    now = datetime.now(timezone.utc)

    # Two prior weeks already closed as no_response, streak at 2.
    for weeks_ago in (2, 1):
        db_session.add(
            AdherenceCheckIn(
                patient_id=patient.id,
                sent_date=now - timedelta(weeks=weeks_ago, hours=49),
                status=CheckInStatus.no_response,
                consecutive_missed=3 - weeks_ago,
            )
        )
    db_session.commit()

    third = AdherenceCheckIn(
        patient_id=patient.id,
        sent_date=now - timedelta(hours=49),
        status=CheckInStatus.sent,
        consecutive_missed=2,
    )
    db_session.add(third)
    db_session.commit()

    close_stale_adherence_checkins(db_session)

    db_session.refresh(third)
    assert third.consecutive_missed == 3
    assert third.worker_notified is True
