# Heza Frontend

Dashboard for health workers (nurses, facility admins) to register patients,
track appointments, follow up on missed visits, and check adherence
check-in history. Talks to the FastAPI backend in `../backend`.

TanStack Start, React 19, TypeScript, Tailwind v4, shadcn/ui.

## Development

```sh
npm install
cp .env.example .env   
npm run dev
```

Backend needs to be running (see `../backend/README.md`) and reachable at
`VITE_API_URL` (defaults to `http://localhost:8000`).

## Production build

```sh
npm run build
npm run start  
```

`VITE_API_URL` gets baked into the build at build time - set it before
running `build`, not after.

## Demo logins

Seeded by `../backend/scripts/seed.py`:

| Username        | Role           | Password    |
|-----------------|----------------|-------------|
| nurse.uwase     | nurse          | Heza2026!   |
| admin.mugisha   | facility_admin | Heza2026!   |

## Structure

- `src/routes/` - file-based routes: `login`, `reset-password`, `index`
  (dashboard), `patients/index`, `patients/$patientId`, `missed`, `messages`,
  `reports`
- `src/lib/api.ts` - typed fetch client for the backend
- `src/lib/auth-context.tsx` - auth state, token storage, idle timeout
- `src/lib/i18n.ts` - EN/RW string dictionary
- `src/components/ui/` - shadcn/ui primitives
- `src/components/layout/AppShell.tsx` - sidebar shell for logged-in pages

## Known scope limits

- No worker self-signup/management screen - accounts are provisioned via
  the backend's seed script.
- The admin password-reset action takes a worker ID directly since the
  backend has no worker-listing endpoint.
- SMS is simulated (mock provider) - see the Message Log page and
  `../backend/README.md` for why.
