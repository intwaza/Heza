# Heza

A chronic disease follow-up and adherence support system for public health
centers in Rwanda. Health workers register patients with hypertension, type 2
diabetes, or HIV, and Heza handles the SMS side of things in between clinic
visits: appointment reminders, missed-visit flags, and weekly medication
check-ins.

Belyse Intwaza, African Leadership University.

- **Live demo:** _add your deployed URL here before submitting_
- **SRS document:** _add a link to the SRS PDF/Doc here before submitting_
- **Demo video:** _add your recording link here before submitting_

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

## Troubleshooting

- **`docker compose up -d db` won't start / port in use** - something else
  is already on 5433. Stop it, or change the port in
  `backend/docker-compose.yml` and `backend/.env`.
- **`npm install` complains about "Unsupported engine"** - Node's too old,
  see Prerequisites.
- **CORS errors in the browser console** - `CORS_ORIGINS` in `backend/.env`
  needs to list whatever origin the frontend is actually running on.
- **"Could not reach the server" on login** - backend isn't running, or
  `VITE_API_URL` in `frontend/.env` points somewhere wrong.

## Deploying

Both halves need an actual public URL, not just `localhost`. Any host that
gives you Node + Python + Postgres works fine (Render, Railway, Fly.io, a
VPS...). Things that'll trip you up if you skip them:

- Point the backend's `DATABASE_URL` at whatever Postgres the host gives you,
  then run `alembic upgrade head` + `python -m scripts.seed` against it once.
- Set a real `JWT_SECRET_KEY` - the default is a placeholder.
- Update `CORS_ORIGINS` to the frontend's actual deployed URL. Forgetting
  this is the #1 way the deployed app looks "broken" when it's really just
  CORS.
- Frontend: `npm install && npm run build`, then `npm run start`. Set
  `VITE_API_URL` to the deployed backend's URL **before** running `build` -
  it's baked in at build time, not read at runtime, so changing it after
  means rebuilding.

## Requirements reference

Implements FR1-FR6 and the non-functional requirements from the project SRS
(linked at the top). `backend/README.md` and `frontend/README.md` go into
what's implemented vs. simplified for a student pilot build, and why.
