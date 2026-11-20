# backend/app/api/routes/__init__.py
from app.api.routes.health import router as health_router
from app.api.routes.internships import router as internships_router

__all__ = ["health_router", "internships_router"]
