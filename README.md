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
1. Go to project root:
   ```bash
   cd elimu-hms
   ```
2. Copy environment variables if needed:
   - `.env` is included for local bootstrap.
   - Use `.env.example` as reference for production.

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

## Seed the database
In another terminal:
```bash
docker-compose exec backend python seed.py
```

This seeds:
- 220 students (Kenyan names, Form 1-4, East/West/North streams)
- 25 staff
- Term 1/2/3 grades across KCSE subjects
- Budget records
- Inventory records

## Auth
- Login endpoint: `POST /auth/login`
- Default seeded login example:
  - username: `TSC001`
  - password: `TSC001`
- Use returned Bearer token for all `/api/*` endpoints.

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
