from datetime import datetime, timezone

import pytest

from app.models.enums import Language
from app.sms.gateway import SmsGateway
from app.sms.mock_provider import MockSmsProvider
from app.sms.quiet_hours import is_sendable_now
from app.sms.templates import adherence_checkin, reminder_24h, reminder_48h

LONG_NAME = "Jean Baptiste Nkurunziza Habimana"  
DATE_STR = "31 Dec 2026, 23:59"


@pytest.mark.parametrize("language", [Language.en, Language.rw])
@pytest.mark.parametrize("render", [reminder_48h, reminder_24h])
def test_appointment_reminder_stays_under_160_chars(render, language):
    message = render(LONG_NAME, DATE_STR, language)
    assert len(message) <= 160


@pytest.mark.parametrize("language", [Language.en, Language.rw])
def test_adherence_checkin_stays_under_160_chars(language):
    message = adherence_checkin(LONG_NAME, language)
    assert len(message) <= 160


def test_gateway_refuses_to_send_oversized_message():
    gateway = SmsGateway(MockSmsProvider(), is_sendable_now=lambda: True)
    with pytest.raises(ValueError):
        gateway.send("+250788000000", "x" * 161)


def test_gateway_queues_instead_of_sending_outside_quiet_hours():
    gateway = SmsGateway(MockSmsProvider(), is_sendable_now=lambda: False)
    result = gateway.send("+250788000000", "hello")
    assert result.sent is False
    assert result.status == "queued"


@pytest.mark.parametrize(
    ("hour_utc", "expected"),
    [
        (3, False),  
        (5, True), 
        (10, True),   
        (17, True),  
        (18, False), 
        (22, False), 
    ],
)
def test_is_sendable_now_respects_7am_to_8pm_eat_window(hour_utc, expected):
    now_utc = datetime(2026, 1, 15, hour_utc, 0, tzinfo=timezone.utc)
    assert is_sendable_now(now_utc) is expected
