import logging
import os
import time

import env_loader  # noqa: F401 — loads project root .env before other local imports

from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from database import Base, engine
from models import budget, fees, grade, inventory, staff, student  # noqa: F401
from routers import auth, budget as budget_router, fees as fees_router, grades, inventory as inventory_router, staff as staff_router, students
from security import DEV_JWT_SECRET_PLACEHOLDER

logging.basicConfig(
    level=logging.INFO,
    format="%(levelname)s [%(name)s] %(message)s",
)
logger = logging.getLogger("elimu")

app = FastAPI(title="Elimu HMS API", version="1.0.0")


@app.middleware("http")
async def log_requests(request: Request, call_next):
    """So you always see traffic in the terminal (even if uvicorn access log is easy to miss)."""
    start = time.perf_counter()
    path = request.url.path
    logger.info("→ %s %s", request.method, path)
    try:
        response = await call_next(request)
    except Exception:
        logger.exception("✗ %s %s", request.method, path)
        raise
    ms = (time.perf_counter() - start) * 1000
    logger.info("← %s %s %s (%.0f ms)", request.method, path, response.status_code, ms)
    return response

_default_cors = (
    "http://localhost:5173,http://127.0.0.1:5173,"
    "http://localhost:3000,http://127.0.0.1:3000"
)
origins = [
    o.strip()
    for o in os.getenv("BACKEND_CORS_ORIGINS", _default_cors).split(",")
    if o.strip()
]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(HTTPException)
async def http_exception_handler(_: Request, exc: HTTPException):
    return JSONResponse(status_code=exc.status_code, content={"error": exc.detail})


@app.exception_handler(Exception)
async def generic_exception_handler(_: Request, exc: Exception):
    logger.exception("Unhandled error")
    return JSONResponse(status_code=500, content={"error": "Internal server error"})


def _env_flag(name: str, default: bool) -> bool:
    raw = os.getenv(name)
    if raw is None:
        return default
    return raw.strip().lower() in ("1", "true", "yes")


def _validate_production_config():
    if os.getenv("ENVIRONMENT", "").strip().lower() != "production":
        return
    secret = os.getenv("JWT_SECRET_KEY", "").strip()
    if not secret or secret == DEV_JWT_SECRET_PLACEHOLDER:
        raise RuntimeError(
            "JWT_SECRET_KEY must be set to a strong non-default value when ENVIRONMENT=production"
        )


@app.on_event("startup")
def on_startup():
    _validate_production_config()
    if _env_flag("DATABASE_AUTO_CREATE", True):
        Base.metadata.create_all(bind=engine)
    logger.info(
        "API ready — try GET /health or open /docs. If you see no lines when using the UI, "
        "the browser is not reaching this process (check Vite proxy and port 8000)."
    )


@app.get("/health")
def health():
    return {"status": "ok"}


app.include_router(auth.router)
app.include_router(students.router, prefix="/api")
app.include_router(staff_router.router, prefix="/api")
app.include_router(grades.router, prefix="/api")
app.include_router(budget_router.router, prefix="/api")
app.include_router(inventory_router.router, prefix="/api")
app.include_router(fees_router.router, prefix="/api")
