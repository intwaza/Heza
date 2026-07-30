from datetime import datetime
from zoneinfo import ZoneInfo

from app.config import get_settings

settings = get_settings()
_kigali = ZoneInfo(settings.sms_timezone)


def is_sendable_now(now_utc: datetime | None = None) -> bool:
    """No SMS to patients outside 7am-8pm East Africa Time. Rwanda doesn't
    observe DST so it's really just a flat UTC+2 offset, but using zoneinfo
    instead of hardcoding that felt safer."""
    now_utc = now_utc or datetime.now(ZoneInfo("UTC"))
    local_hour = now_utc.astimezone(_kigali).hour
    return settings.sms_quiet_hours_end <= local_hour < settings.sms_quiet_hours_start
