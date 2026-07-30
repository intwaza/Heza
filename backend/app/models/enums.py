import enum


class WorkerRole(str, enum.Enum):
    nurse = "nurse"
    facility_admin = "facility_admin"
    system_admin = "system_admin"


class Language(str, enum.Enum):
    en = "en"
    rw = "rw"


class Condition(str, enum.Enum):
    hypertension = "hypertension"
    type2_diabetes = "type2_diabetes"
    hiv = "hiv"


class Gender(str, enum.Enum):
    male = "male"
    female = "female"
    other = "other"


class PatientStatus(str, enum.Enum):
    active = "active"
    deactivated = "deactivated"


class AppointmentStatus(str, enum.Enum):
    upcoming = "upcoming"
    attended = "attended"
    missed = "missed"
    followed_up = "followed_up"


class RecurrenceDays(int, enum.Enum):
    monthly = 30
    quarterly = 90


class CheckInResponse(str, enum.Enum):
    yes = "Y"
    no = "N"


class CheckInStatus(str, enum.Enum):
    sent = "sent"
    confirmed = "confirmed"
    not_confirmed = "not_confirmed"
    no_response = "no_response"
