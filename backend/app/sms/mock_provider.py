import itertools
import logging
from datetime import datetime, timezone

from app.sms.gateway import SmsProvider

logger = logging.getLogger("heza.sms.mock")

_id_counter = itertools.count(1)


class MockSmsProvider(SmsProvider):
    """Default provider for local dev, demos and tests. Doesn't hit any
    network, it just logs the message and keeps an in-memory record so
    tests (and the /sms/log endpoint) can see what would have been sent."""

    def __init__(self) -> None:
        self.sent_messages: list[dict] = []

    def dispatch(self, to: str, message: str) -> str:
        message_id = f"mock-{next(_id_counter)}"
        self.sent_messages.append(
            {"id": message_id, "to": to, "message": message, "sent_at": datetime.now(timezone.utc)}
        )
        logger.info("MOCK SMS to %s: %s", to, message)
        return message_id
