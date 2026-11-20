# backend/app/models/raw_snapshot.py
from datetime import datetime, timezone
from typing import TYPE_CHECKING, List, Optional
import uuid
from sqlalchemy import DateTime, ForeignKey, String, Text, Uuid
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base import Base

if TYPE_CHECKING:
    from app.models.crawl_run import CrawlRun
    from app.models.source_record import SourceRecord


class RawSnapshot(Base):
    """Immutable raw crawl payload snapshot stored before normalization."""

    __tablename__ = "raw_snapshots"

    crawl_run_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("crawl_runs.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    source_url: Mapped[str] = mapped_column(String(2048), nullable=False)
    content_type: Mapped[str] = mapped_column(String(100), default="application/json", nullable=False)
    raw_payload: Mapped[str] = mapped_column(Text, nullable=False)
    payload_hash: Mapped[str] = mapped_column(String(64), nullable=False, index=True)
    crawled_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )
    storage_path: Mapped[Optional[str]] = mapped_column(String(1024), nullable=True)

    # Relationships
    crawl_run: Mapped[Optional["CrawlRun"]] = relationship(
        "CrawlRun",
        back_populates="raw_snapshots",
    )
    source_records: Mapped[List["SourceRecord"]] = relationship(
        "SourceRecord",
        back_populates="raw_snapshot",
    )
