from datetime import datetime, timedelta, timezone

from app.models import Appointment, Patient
from app.models.enums import AppointmentStatus, Condition, Gender, Language, PatientStatus
from app.scheduler.jobs import flag_missed_appointments, send_appointment_reminders


def _make_patient(db_session, facility, **overrides) -> Patient:
    defaults = dict(
        facility_id=facility.id,
        created_by_id=1,
        full_name="Test Patient",
        age=45,
        gender=Gender.male,
        phone="+250788000111",
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


def test_appointment_more_than_24h_overdue_is_flagged_missed(db_session, facility, nurse):
    patient = _make_patient(db_session, facility, created_by_id=nurse.id)
    overdue = Appointment(
        patient_id=patient.id,
        scheduled_date=datetime.now(timezone.utc) - timedelta(hours=30),
        recurrence_days=30,
    )
    db_session.add(overdue)
    db_session.commit()

    flagged = flag_missed_appointments(db_session)

    assert len(flagged) == 1
    db_session.refresh(overdue)
    assert overdue.status == AppointmentStatus.missed


def test_appointment_within_24h_grace_period_is_not_flagged(db_session, facility, nurse):
    patient = _make_patient(db_session, facility, created_by_id=nurse.id)
    recent = Appointment(
        patient_id=patient.id,
        scheduled_date=datetime.now(timezone.utc) - timedelta(hours=5),
        recurrence_days=30,
    )
    db_session.add(recent)
    db_session.commit()

    flag_missed_appointments(db_session)

    db_session.refresh(recent)
    assert recent.status == AppointmentStatus.upcoming


def test_48h_reminder_sent_once_within_window(db_session, facility, nurse, gateway):
    patient = _make_patient(db_session, facility, created_by_id=nurse.id, phone="+250788222333")
    appointment = Appointment(
        patient_id=patient.id,
        scheduled_date=datetime.now(timezone.utc) + timedelta(hours=40),
        recurrence_days=30,
    )
    db_session.add(appointment)
    db_session.commit()

    send_appointment_reminders(db_session, gateway)

    db_session.refresh(appointment)
    assert appointment.reminder_48h_sent is True
    assert appointment.reminder_24h_sent is False
    assert len(gateway._provider.sent_messages) == 1
    assert gateway._provider.sent_messages[0]["to"] == "+250788222333"

    # Running the sweep again shouldn't send a second 48h reminder.
    send_appointment_reminders(db_session, gateway)
    assert len(gateway._provider.sent_messages) == 1


def test_24h_reminder_sent_when_within_window(db_session, facility, nurse, gateway):
    patient = _make_patient(db_session, facility, created_by_id=nurse.id, phone="+250788333444")
    appointment = Appointment(
        patient_id=patient.id,
        scheduled_date=datetime.now(timezone.utc) + timedelta(hours=10),
        recurrence_days=30,
        reminder_48h_sent=True,  # already handled in an earlier sweep
    )
    db_session.add(appointment)
    db_session.commit()

    send_appointment_reminders(db_session, gateway)

    db_session.refresh(appointment)
    assert appointment.reminder_24h_sent is True
    assert len(gateway._provider.sent_messages) == 1


def test_reminders_skip_deactivated_patients(db_session, facility, nurse, gateway):
    patient = _make_patient(
        db_session, facility, created_by_id=nurse.id, status=PatientStatus.deactivated
    )
    appointment = Appointment(
        patient_id=patient.id,
        scheduled_date=datetime.now(timezone.utc) + timedelta(hours=10),
        recurrence_days=30,
    )
    db_session.add(appointment)
    db_session.commit()

    send_appointment_reminders(db_session, gateway)

    assert gateway._provider.sent_messages == []
