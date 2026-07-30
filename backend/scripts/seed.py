"""Creates a demo facility and two health worker logins so you can log in
and try the API without hand-writing SQL first. Safe to run more than once -
it checks for existing rows before inserting anything.

Usage: ./.venv/bin/python -m scripts.seed
"""

from app.core.security import hash_password
from app.database import SessionLocal
from app.models import Facility, HealthWorker
from app.models.enums import Language, WorkerRole

DEMO_WORKERS = [
    {
        "username": "nurse.uwase",
        "full_name": "Uwase Diane",
        "role": WorkerRole.nurse,
        "password": "Heza2026!",
    },
    {
        "username": "admin.mugisha",
        "full_name": "Mugisha Eric",
        "role": WorkerRole.facility_admin,
        "password": "Heza2026!",
    },
]


def run() -> None:
    db = SessionLocal()
    try:
        facility = db.query(Facility).filter(Facility.name == "Kabusunzu Health Center").first()
        if facility is None:
            facility = Facility(name="Kabusunzu Health Center", district="Nyarugenge", level=1)
            db.add(facility)
            db.flush()
            print(f"Created facility '{facility.name}' (id={facility.id})")
        else:
            print(f"Facility '{facility.name}' already exists (id={facility.id})")

        for worker_data in DEMO_WORKERS:
            existing = db.query(HealthWorker).filter(HealthWorker.username == worker_data["username"]).first()
            if existing is not None:
                print(f"Health worker '{worker_data['username']}' already exists, skipping")
                continue

            worker = HealthWorker(
                facility_id=facility.id,
                full_name=worker_data["full_name"],
                username=worker_data["username"],
                hashed_password=hash_password(worker_data["password"]),
                role=worker_data["role"],
                preferred_language=Language.en,
            )
            db.add(worker)
            print(f"Created health worker '{worker.username}' ({worker.role.value})")

        db.commit()
        print("\nLogin with: username=nurse.uwase or admin.mugisha, password=Heza2026!")
    finally:
        db.close()


if __name__ == "__main__":
    run()
