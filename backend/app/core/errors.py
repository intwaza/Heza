class AppError(Exception):
    """Business-logic error with an English + Kinyarwanda message. Bubbles
    up to the handler in app.main, which turns it into a JSON response
    instead of a 500."""

    def __init__(self, en: str, rw: str, status_code: int = 400):
        self.en = en
        self.rw = rw
        self.status_code = status_code
        super().__init__(en)


def not_found(entity_en: str, entity_rw: str) -> AppError:
    return AppError(en=f"{entity_en} not found.", rw=f"{entity_rw} ntibonetse.", status_code=404)
