# Elimu HMS (Kenyan High School Management System)

Production-ready full-stack school management system built with:
- Frontend: React + Vite + TailwindCSS + Recharts
- Backend: FastAPI + SQLAlchemy + Alembic
- Database: PostgreSQL 15 (Docker)
- Cache: Redis 7 (Docker)
- Auth: JWT (`python-jose`)
- Tooling: Docker + docker-compose

## Prerequisites
- Docker Desktop
- Docker Compose (included with modern Docker Desktop)

## Setup
1. Go to project root (this repository folder, e.g. `school-management-system`):
   ```bash
   cd school-management-system
   ```
2. Environment files:
   - Copy **`.env.example`** → **`.env`** in the **`school-management-system`** folder (same folder as `docker-compose.yml`).
   - For the Vite app only, copy **`frontend/.env.example`** → **`frontend/.env`** (sets `VITE_API_BASE_URL` for the API).
   - You do **not** need a separate `.env` inside `backend/` unless you want overrides; the backend loads the root `.env` automatically.

## Run the system
```bash
docker-compose up --build
```

Services:
- Frontend: http://localhost:3000
- Backend: http://localhost:8000
- Backend docs: http://localhost:8000/docs
- pgAdmin: http://localhost:5050
- PostgreSQL: localhost:5432
- Redis: localhost:6379

## Database tables (optional helper)
Creates tables if missing (no demo users or sample data):
```bash
docker-compose exec backend python seed.py
```
Staff accounts are created in the app via **Sign up** (`POST /auth/signup`).

## Auth
- **Sign up:** `POST /auth/signup` — body: `first_name`, `last_name`, `tsc_number` (username). Password is always the TSC number (stored hashed). No email.
- **Sign in:** `POST /auth/login` — body: `tsc_number`, `password` (must be your TSC number), `name` (must match your **first name** or **last name** on file).
- Use the returned Bearer token for all `/api/*` endpoints.
- **Production:** set `ENVIRONMENT=production` and a strong `JWT_SECRET_KEY` (not the dev placeholder). The API refuses to start otherwise.

## Frontend API URL (Docker and remote browsers)
The browser calls the API using `VITE_API_BASE_URL` (see `frontend/src/api/client.js`). It must be the base URL **as seen from the user’s machine**, not a Docker-only hostname.

- Same PC as Docker: `http://localhost:8000` is fine.
- Phone or another PC on the network: use `http://<your-computer-LAN-IP>:8000` and add the matching frontend origin to `BACKEND_CORS_ORIGINS`.

For a static production build, set `VITE_API_BASE_URL` **before** `npm run build`.

## Backend tests
From the `backend` folder (with dependencies installed):

```bash
python -m pytest
```

## Alembic migrations
Generate a migration:
```bash
docker-compose exec backend alembic revision --autogenerate -m "initial"
```

Apply migration:
```bash
docker-compose exec backend alembic upgrade head
```

## pgAdmin access
- URL: http://localhost:5050
- Credentials come from `.env`:
  - `PGADMIN_DEFAULT_EMAIL`
  - `PGADMIN_DEFAULT_PASSWORD`
- Add server manually in pgAdmin:
  - Host: `db`
  - Port: `5432`
  - Username: `POSTGRES_USER`
  - Password: `POSTGRES_PASSWORD`
