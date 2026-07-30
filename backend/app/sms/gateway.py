from abc import ABC, abstractmethod
from collections.abc import Callable
from dataclasses import dataclass

from app.sms.quiet_hours import is_sendable_now


@dataclass
class SendResult:
    sent: bool
    status: str 
    provider_message_id: str | None = None


class SmsProvider(ABC):
    """What an actual gateway (Africa's Talking, Beem Africa, ...) has to
    implement. Quiet-hours enforcement lives one level up in SmsGateway so
    every provider gets it for free instead of re-implementing it."""

    @abstractmethod
    def dispatch(self, to: str, message: str) -> str:
        """Send `message` to `to` and return a provider message id."""


class SmsGateway:
    def __init__(self, provider: SmsProvider, is_sendable_now: Callable[[], bool] = is_sendable_now):
        self._provider = provider
        self._is_sendable_now = is_sendable_now

    def send(self, to: str, message: str) -> SendResult:
        if len(message) > 160:
            raise ValueError(f"SMS body exceeds 160 characters ({len(message)}): {message!r}")

        if not self._is_sendable_now():
            return SendResult(sent=False, status="queued")

        message_id = self._provider.dispatch(to, message)
        return SendResult(sent=True, status="sent", provider_message_id=message_id)

    def message_log(self) -> list[dict]:
        """Demo/testing helper: messages the provider recorded, most recent
        first. Empty for any provider that doesn't track a history (only
        MockSmsProvider does)."""
        return list(reversed(getattr(self._provider, "sent_messages", [])))
