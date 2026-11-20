# backend/app/models/link_check.py
from datetime import datetime, timezone
from typing import TYPE_CHECKING, Optional
import uuid
from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, String, Uuid
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base import Base

if TYPE_CHECKING:
    from app.models.source_record import SourceRecord


class LinkCheck(Base):
    """Audit log of periodic HTTP health verifications for external job links."""

    __tablename__ = "link_checks"

    source_record_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("source_records.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    http_status: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    response_time_ms: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    final_url: Mapped[Optional[str]] = mapped_column(String(2048), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    failure_reason: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    checked_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    # Relationships
    source_record: Mapped["SourceRecord"] = relationship("SourceRecord", back_populates="link_checks")
