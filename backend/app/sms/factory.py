from functools import lru_cache

from app.sms.gateway import SmsGateway
from app.sms.mock_provider import MockSmsProvider


@lru_cache
def get_sms_gateway() -> SmsGateway:
    return SmsGateway(MockSmsProvider())
