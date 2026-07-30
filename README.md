# Heza

A chronic disease follow-up and adherence support system for public health
centers in Rwanda. Health workers register patients with hypertension, type 2
diabetes, or HIV, and Heza handles the SMS side of things in between clinic
visits: appointment reminders, missed-visit flags, and weekly medication
check-ins.

Belyse Intwaza, African Leadership University.

- **Live demo:** https://heza-frontend.onrender.com/reports
- **SRS document:** https://docs.google.com/document/d/1aOyb3cp9SRSXMPkVkBRRMNS5J3Hw-SoJX7rukrNvt1U/edit?tab=t.0
- **Demo video:** https://youtu.be/MnJ5oxLWH_k

## Structure

```
backend/    FastAPI + PostgreSQL API
frontend/   Web dashboard (TanStack Start + React)
```

## Prerequisites

- Python 3.11+
- Node.js 22+ (older versions fail in confusing ways - use
  [nvm](https://github.com/nvm-sh/nvm) if you need to upgrade: `nvm install 22`)
- Docker Desktop, or a local Postgres 14+ if you don't want to use Docker
- git

## Setup

Run these in two terminals - backend in one, frontend in the other, both
stay running.

### 1. Clone

```bash
git clone <this-repo-url> heza
cd heza
```

### 2. Backend

```bash
cd backend
python3 -m venv .venv
./.venv/bin/pip install -r requirements.txt

cp .env.example .env

docker compose up -d db          # Postgres on port 5433
./.venv/bin/alembic upgrade head  # wait a few seconds for Postgres to start first
./.venv/bin/python -m scripts.seed

./.venv/bin/uvicorn app.main:app --reload
```

Check it worked: [http://127.0.0.1:8000/health](http://127.0.0.1:8000/health)
should say `{"status":"ok"}`. API docs at
[http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs).

### 3. Frontend

```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

Open whatever URL it prints (usually [http://localhost:8080](http://localhost:8080)).

### 4. Log in

| Username        | Password    | Role           |
|-----------------|-------------|----------------|
| `nurse.uwase`   | `Heza2026!` | nurse          |
| `admin.mugisha` | `Heza2026!` | facility_admin |

Also shown on the login screen itself.

### 5. Poke around

- Register a patient - shows up under **Upcoming**.
- Open it, hit **Mark attended** - moves to **Attended**, next appointment
  gets scheduled automatically.
- Log in as `admin.mugisha` instead to see the **Reports** page (nurses
  don't get this one in the nav).


