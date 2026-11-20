# backend/app/api/routes/health.py
from typing import Any, Dict
from fastapi import APIRouter, Depends, status
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.dependencies.db import get_db
from app.core.config import settings

router = APIRouter(prefix="/health", tags=["Health"])


@router.get("", status_code=status.HTTP_200_OK)
async def check_health(db: AsyncSession = Depends(get_db)) -> Dict[str, Any]:
    """Check API operational health and database connectivity."""
    db_status = "healthy"
    try:
        await db.execute(text("SELECT 1"))
    except Exception as e:
        db_status = f"unhealthy: {str(e)}"

    return {
        "status": "ok" if "unhealthy" not in db_status else "degraded",
        "service": settings.PROJECT_NAME,
        "environment": settings.ENVIRONMENT,
        "database": db_status,
    }
