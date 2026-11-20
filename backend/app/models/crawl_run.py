# backend/app/models/crawl_run.py
from datetime import datetime, timezone
from typing import TYPE_CHECKING, List, Optional
import uuid
from sqlalchemy import DateTime, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base import Base

if TYPE_CHECKING:
    from app.models.raw_snapshot import RawSnapshot


class CrawlRun(Base):
    """Execution audit tracking each crawl execution and telemetry."""

    __tablename__ = "crawl_runs"

    adapter_name: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    status: Mapped[str] = mapped_column(String(50), nullable=False, default="running", index=True)
    items_discovered: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    items_extracted: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    items_ingested: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    errors_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    error_log: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    started_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )
    completed_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )

    # Relationships
    raw_snapshots: Mapped[List["RawSnapshot"]] = relationship(
        "RawSnapshot",
        back_populates="crawl_run",
        cascade="all, delete-orphan",
    )
