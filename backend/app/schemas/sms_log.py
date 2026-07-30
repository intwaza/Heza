from datetime import datetime

from pydantic import BaseModel


class SmsLogEntry(BaseModel):
    id: str
    to: str
    message: str
    sent_at: datetime
