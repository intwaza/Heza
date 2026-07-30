from app.models.enums import Language

_REMINDER_48H = {
    Language.en: "Hello {name}, reminder from Heza: your health center appointment is on {date}. Please attend on time.",
    Language.rw: "Muraho {name}, Heza iraboko ko mufite gahunda yo kwa muganga kuwa {date}. Nimuze ku gihe.",
}

_REMINDER_24H = {
    Language.en: "Hello {name}, reminder: your Heza appointment is tomorrow, {date}. Please don't miss it.",
    Language.rw: "Muraho {name}, gahunda yanyu yo kwa muganga ni ejo, {date}. Ntimuzayibure.",
}

_ADHERENCE_CHECKIN = {
    Language.en: "Hi {name}, have you taken your medication this week? Reply Y for yes or N for no. - Heza",
    Language.rw: "Muraho {name}, waba warafashe imiti yawe iki cyumweru? Subiza Y=yego cyangwa N=oya. - Heza",
}


def reminder_48h(name: str, date_str: str, language: Language) -> str:
    return _REMINDER_48H[language].format(name=name, date=date_str)


def reminder_24h(name: str, date_str: str, language: Language) -> str:
    return _REMINDER_24H[language].format(name=name, date=date_str)


def adherence_checkin(name: str, language: Language) -> str:
    return _ADHERENCE_CHECKIN[language].format(name=name)
