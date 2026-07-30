from sqlalchemy.orm import Session

from app.models import AuditLog


def record(
    db: Session,
    *,
    entity_type: str,
    entity_id: int,
    action: str,
    changed_by_id: int | None,
    before: dict | None = None,
    after: dict | None = None,
) -> None:
    """Append-only audit trail. before/after are plain dicts rather than
    ORM objects so this doesn't need to know about any model's shape."""
    db.add(
        AuditLog(
            entity_type=entity_type,
            entity_id=entity_id,
            action=action,
            changed_by_id=changed_by_id,
            before=before,
            after=after,
        )
    )
