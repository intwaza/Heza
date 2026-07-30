import os

# Must happen before anything under app/ is imported, since get_settings()
# is lru_cached on first call.
os.environ["RUN_SCHEDULER"] = "false"

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

from app.config import get_settings
from app.core.security import create_access_token, hash_password
from app.database import Base, get_db
from app.main import app
from app.models import Facility, HealthWorker
from app.models.enums import Language, WorkerRole
from app.sms.gateway import SmsGateway
from app.sms.mock_provider import MockSmsProvider

settings = get_settings()
_base_url, _default_db = settings.database_url.rsplit("/", 1)
TEST_DATABASE_URL = f"{_base_url}/heza_test"


def _ensure_test_database_exists() -> None:
    admin_engine = create_engine(f"{_base_url}/postgres", isolation_level="AUTOCOMMIT")
    with admin_engine.connect() as conn:
        exists = conn.execute(
            text("SELECT 1 FROM pg_database WHERE datname = :name"), {"name": "heza_test"}
        ).first()
        if not exists:
            conn.execute(text('CREATE DATABASE "heza_test"'))
    admin_engine.dispose()


@pytest.fixture(scope="session")
def engine():
    _ensure_test_database_exists()
    test_engine = create_engine(TEST_DATABASE_URL)
    Base.metadata.create_all(test_engine)
    yield test_engine
    Base.metadata.drop_all(test_engine)
    test_engine.dispose()


@pytest.fixture()
def db_session(engine):
    """Each test runs inside a transaction that's rolled back afterwards, so
    tests never see each other's data even though they share one database."""
    connection = engine.connect()
    transaction = connection.begin()
    TestingSession = sessionmaker(bind=connection)
    session = TestingSession()

    yield session

    session.close()
    transaction.rollback()
    connection.close()


@pytest.fixture()
def client(db_session):
    def override_get_db():
        yield db_session

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()


@pytest.fixture()
def facility(db_session):
    facility = Facility(name="Test Health Center", district="Kigali", level=1)
    db_session.add(facility)
    db_session.commit()
    db_session.refresh(facility)
    return facility


@pytest.fixture()
def other_facility(db_session):
    facility = Facility(name="Other Health Center", district="Musanze", level=1)
    db_session.add(facility)
    db_session.commit()
    db_session.refresh(facility)
    return facility


@pytest.fixture()
def make_worker(db_session, facility):
    def _make(
        username: str = "nurse1",
        role: WorkerRole = WorkerRole.nurse,
        password: str = "Password123!",
        facility_id: int | None = None,
    ) -> HealthWorker:
        worker = HealthWorker(
            facility_id=facility_id or facility.id,
            full_name=f"Test Worker ({username})",
            username=username,
            hashed_password=hash_password(password),
            role=role,
            preferred_language=Language.en,
        )
        db_session.add(worker)
        db_session.commit()
        db_session.refresh(worker)
        return worker

    return _make


@pytest.fixture()
def nurse(make_worker):
    return make_worker()


@pytest.fixture()
def facility_admin(make_worker):
    return make_worker(username="admin1", role=WorkerRole.facility_admin)


def auth_header(worker: HealthWorker) -> dict[str, str]:
    token = create_access_token(worker.id, worker.facility_id, worker.role.value)
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture()
def nurse_headers(nurse):
    return auth_header(nurse)


@pytest.fixture()
def admin_headers(facility_admin):
    return auth_header(facility_admin)


@pytest.fixture()
def gateway():
    """A gateway that always treats "now" as within sending hours, so tests
    don't flake depending on what time of day they happen to run."""
    return SmsGateway(MockSmsProvider(), is_sendable_now=lambda: True)
