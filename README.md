# Task Manager

A minimalist daily task manager with a Fastify REST API backend and Vue 3 frontend. Tasks are stored as daily JSON files — one file per day, no database required.

## Repository Structure

```
task-manager/
  backend/       ← Fastify REST API (Node.js 18)
  frontend/      ← Vue 3 + Vite SPA
  data/          ← Daily JSON task files (git-ignored)
  dev.sh         ← Start both backend and frontend
  .github/
    workflows/
      ci.yml     ← GitHub Actions (backend + frontend tests in parallel)
```

## Quick Start

```bash
# Install dependencies
cd backend && npm install && cd ../frontend && npm install && cd ..

# Start both servers
./dev.sh
```

- Frontend: [http://localhost:5173](http://localhost:5173)
- Backend API: [http://localhost:3000](http://localhost:3000)

## Features

- Create, update, and delete daily tasks
- Fields: title, description, urgency (`low` / `medium` / `high`), status (`pending` / `done`)
- Tasks sorted by urgency (high → medium → low)
- Urgency-colored card borders
- Light / dark theme with `localStorage` persistence
- Max 20 tasks per day

## Stack

| Layer | Technology |
|---|---|
| Backend | Node.js 18, Fastify, `@fastify/helmet`, `@fastify/cors` |
| Storage | JSON files (`data/YYYY-MM-DD.json`) |
| Frontend | Vue 3, Vite 5, Pinia, Tailwind CSS v3 |
| Testing | `node --test` (backend), Vitest + Vue Test Utils (frontend) |
| CI | GitHub Actions — parallel backend and frontend jobs |

## Documentation

- [Backend README](backend/README.md) — API reference, env vars, data schema
- [Frontend README](frontend/README.md) — project structure, scripts, test coverage

## Development

```bash
./dev.sh                    # start both (Ctrl+C stops both cleanly)
```

Environment variables (all optional):

| Variable | Default | Description |
|---|---|---|
| `PORT` | `3000` | Backend port |
| `CORS_ORIGIN` | `http://localhost:5173` | Allowed CORS origin |
| `DATA_DIR` | `./data` | Task storage directory |

## Testing

```bash
# Backend (76 tests)
cd backend && npm test

# Frontend (60 tests)
cd frontend && npm test
```

## CI

GitHub Actions runs on every push and pull request to `main`:
- `test-backend` — installs and runs backend tests
- `test-frontend` — installs and runs frontend tests

Both jobs run in parallel.
