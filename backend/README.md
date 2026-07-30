# Heza Backend

FastAPI backend for Heza - health workers register patients with chronic
conditions (hypertension, type 2 diabetes, HIV) and log their attendance;
the system handles SMS appointment reminders, missed-appointment flagging,
and weekly medication check-ins on its own.

Implements FR1-FR6 from the project SRS. No frontend in this folder - just
the API and background jobs, see `../frontend` for the dashboard.

## Stack

- FastAPI + SQLAlchemy 2.0 + Alembic
- PostgreSQL 15 (via Docker Compose)
- JWT auth (python-jose), bcrypt hashing (passlib)
- APScheduler for the reminder/missed-appointment/check-in jobs
- pytest + FastAPI's TestClient

## Project layout

```
app/
  models/       SQLAlchemy models (Facility, HealthWorker, Patient, Appointment, ...)
  schemas/      Pydantic request/response models
  services/     business logic
  routers/      route definitions, delegate to services/
  sms/          SmsGateway interface + mock provider + EN/RW templates
  scheduler/    APScheduler jobs
  core/         security, auth deps, audit log, bilingual errors
alembic/        migrations
scripts/seed.py demo facility + health worker logins
tests/          pytest suite (49 tests)
```

## Getting started

Requires Python 3.11+ and Docker.

```bash
python3 -m venv .venv
./.venv/bin/pip install -r requirements.txt

cp .env.example .env

docker compose up -d db          # Postgres on localhost:5433
./.venv/bin/alembic upgrade head
./.venv/bin/python -m scripts.seed

./.venv/bin/uvicorn app.main:app --reload
```

Swagger docs at `http://127.0.0.1:8000/docs` - `POST /auth/login` is an
OAuth2 password form, so the "Authorize" button works directly. Seeded
logins:

| username        | password    | role            |
|-----------------|-------------|-----------------|
| `nurse.uwase`   | `Heza2026!` | nurse           |
| `admin.mugisha` | `Heza2026!` | facility_admin  |

(Port 5433 instead of 5432 so it doesn't clash with a Postgres.app or
similar already running locally - change it back in `docker-compose.yml` +
`.env` if you don't need that.)

## Running tests

```bash
./.venv/bin/pytest -v
```

Tests hit a real Postgres (`heza_test`, same Docker container) instead of
mocking the ORM - each one runs in a transaction that gets rolled back
after, so all 49 stay isolated and finish in ~10s. SMS goes through the
mock provider in tests, nothing hits a network.

## What's real vs. simplified

Solo student build, not a production system, so a few things are cut down
on purpose rather than half-implemented:

- **SMS is mocked.** `MockSmsProvider` logs messages and keeps them in
  memory instead of sending real texts (`app/sms/mock_provider.py`,
  `/sms/log` endpoint shows the history). A real Africa's Talking
  integration was actually built and tested against their sandbox - the API
  call succeeded and routed to MTN Rwanda, but delivery failed at the
  carrier level (`DeliveryFailure`) because Rwandan carriers reject SMS from
  an unregistered sender ID, which needs a carrier/regulator approval
  process well outside a student pilot's timeline. Reverted to mock rather
  than ship something that silently doesn't deliver. The gateway sits
  behind an `SmsProvider` interface specifically so swapping in a real
  provider later is a small, contained change.
- **No encryption at rest.** That's a Postgres/disk-level concern (an
  encrypted volume, `pgcrypto`) in a real deployment, not something the API
  itself should be doing.
- **Plain HTTP locally.** TLS termination belongs in front of the app (a
  reverse proxy/load balancer), not baked into uvicorn.
- **No push notifications to health workers.** A missed appointment just
  shows up on `GET /dashboard`'s missed list right away - there's no
  websocket/push channel behind it.
- **`POST /sms/webhook` has no auth.** A real gateway would get validated
  via a shared secret or IP allowlist; left open since there's no real
  gateway account to configure that against.
- **No DHIS2/e-Ubuzima integration** - out of scope for v1.0 per the SRS.

## API overview

Everything except `/auth/login`, `/auth/password-reset/confirm`,
`/sms/webhook`, and `/health` needs a Bearer JWT. Patient/appointment
endpoints are scoped to the caller's facility - a nurse at Facility A gets
a 404 (not 403) for a patient at Facility B, so the response doesn't even
confirm the record exists elsewhere.

| Method | Path                                | Notes |
|--------|--------------------------------------|-------|
| POST   | `/auth/login`                        | OAuth2 password form → JWT (15 min expiry) |
| GET    | `/auth/me`                           | current logged-in health worker |
| POST   | `/auth/password-reset/{worker_id}`   | facility_admin-only, generates a reset token |
| POST   | `/auth/password-reset/confirm`       | `{token, new_password}` |
| POST   | `/patients`                          | register a patient + first appointment |
| GET    | `/patients`                          | list patients at your facility |
| GET    | `/patients/{id}`                     | one patient |
| PATCH  | `/patients/{id}`                     | update phone/condition/language |
| POST   | `/patients/{id}/deactivate`          | soft-delete (transferred/deceased/lost) |
| GET    | `/patients/{id}/history`             | full appointment + adherence history |
| POST   | `/appointments/{id}/attend`          | mark attended, auto-schedules next cycle |
| POST   | `/appointments/{id}/follow-up`       | add a note to a missed appointment |
| GET    | `/dashboard`                         | upcoming / attended / missed, for your facility |
| GET    | `/reports/facility`                  | facility_admin-only attendance report |
| GET    | `/sms/log`                           | mock SMS outbox (demo/proof) |
| POST   | `/sms/webhook`                       | inbound SMS gateway webhook (Y/N replies) |

## Background jobs

Run via APScheduler when the app starts (`RUN_SCHEDULER=true`). Each job
gets its own DB session so one failing doesn't take down the others:

- Hourly - send 48h/24h appointment reminders past their threshold
- Hourly - flag appointments >24h overdue as `missed`
- Every 24h - send weekly adherence check-ins to anyone not checked in the last 7 days
- Every 6h - close out check-ins with no reply after 48h, flag the worker at 3 in a row

Intervals are configurable via `.env` (`MISSED_SWEEP_INTERVAL_SECONDS` etc.)
if you want to test faster instead of waiting an hour.

Anything that would fire outside 7am-8pm EAT just gets skipped and picked
up on the next sweep instead of dropped (`app/sms/quiet_hours.py`).
