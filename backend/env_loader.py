"""Load env from project root (school-management-system/.env), then backend/.env overrides."""
from pathlib import Path

from dotenv import load_dotenv

_backend = Path(__file__).resolve().parent
_root = _backend.parent
load_dotenv(_root / ".env")
load_dotenv(_backend / ".env")
