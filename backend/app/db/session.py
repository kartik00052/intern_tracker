# backend/app/db/session.py
from typing import AsyncGenerator
from sqlalchemy.ext.asyncio import (
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)
from app.core.config import settings


def get_async_database_url(url: str) -> str:
    """Normalize standard database URLs to an async-compatible driver."""
    # Convert standard postgresql:// to postgresql+psycopg:// if not already explicit
    if url.startswith("postgresql://"):
        return url.replace("postgresql://", "postgresql+psycopg://", 1)
    if url.startswith("sqlite://"):
        return url.replace("sqlite://", "sqlite+aiosqlite://", 1)
    return url


async_database_url = get_async_database_url(settings.DATABASE_URL)

engine = create_async_engine(
    async_database_url,
    echo=settings.LOG_LEVEL.upper() == "DEBUG",
    future=True,
    pool_pre_ping=True,
)

async_session_factory = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autoflush=False,
)


async def get_db_session() -> AsyncGenerator[AsyncSession, None]:
    """Dependency for obtaining an asynchronous database session."""
    async with async_session_factory() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()
