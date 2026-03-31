import os

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from database import Base, engine
from models import budget, grade, inventory, staff, student  # noqa: F401
from routers import auth, budget as budget_router, grades, inventory as inventory_router, staff as staff_router, students

load_dotenv()

app = FastAPI(title="Elimu HMS API", version="1.0.0")

origins = [o.strip() for o in os.getenv("BACKEND_CORS_ORIGINS", "http://localhost:3000").split(",")]
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
    return JSONResponse(status_code=500, content={"error": f"Internal server error: {str(exc)}"})


@app.on_event("startup")
def on_startup():
    Base.metadata.create_all(bind=engine)


@app.get("/health")
def health():
    return {"status": "ok"}


app.include_router(auth.router)
app.include_router(students.router, prefix="/api")
app.include_router(staff_router.router, prefix="/api")
app.include_router(grades.router, prefix="/api")
app.include_router(budget_router.router, prefix="/api")
app.include_router(inventory_router.router, prefix="/api")
