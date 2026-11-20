# backend/app/main.py
from contextlib import asynccontextmanager
from typing import AsyncGenerator
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes.health import router as health_router
from app.api.routes.internships import router as internships_router
from app.core.config import settings
from app.db.base import Base
from app.db.session import engine


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    """Application lifespan context manager for startup and shutdown routines."""
    # Create tables automatically if using SQLite in development/testing mode
    if "sqlite" in settings.DATABASE_URL:
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
    yield
    await engine.dispose()


def create_application() -> FastAPI:
    """Application factory configuring middleware and routing."""
    app = FastAPI(
        title=settings.PROJECT_NAME,
        version="0.1.0",
        description="High-throughput, ethical internship discovery and aggregation platform API.",
        openapi_url=f"{settings.API_V1_STR}/openapi.json",
        docs_url=f"{settings.API_V1_STR}/docs",
        redoc_url=f"{settings.API_V1_STR}/redoc",
        lifespan=lifespan,
    )

    # Configure CORS for Vite development server
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.CORS_ORIGINS,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Register API Routers
    app.include_router(health_router, prefix=settings.API_V1_STR)
    app.include_router(internships_router, prefix=settings.API_V1_STR)

    return app


app = create_application()
