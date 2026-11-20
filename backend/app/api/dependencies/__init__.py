# backend/app/api/dependencies/__init__.py
from app.api.dependencies.db import get_db

__all__ = ["get_db"]
