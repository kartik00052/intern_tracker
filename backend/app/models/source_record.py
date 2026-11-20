# backend/app/models/source_record.py
from datetime import datetime, timezone
from typing import TYPE_CHECKING, Any, Dict, List, Optional
import uuid
from sqlalchemy import DateTime, ForeignKey, JSON, String, Uuid
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base import Base

if TYPE_CHECKING:
    from app.models.company import Company
    from app.models.internship import Internship
    from app.models.link_check import LinkCheck
    from app.models.raw_snapshot import RawSnapshot


class SourceRecord(Base):
    """Source provenance tracking raw external URLs mapping to canonical internships."""

    __tablename__ = "source_records"

    internship_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("internships.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    company_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("companies.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    raw_snapshot_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("raw_snapshots.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )

    source_adapter: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    source_url: Mapped[str] = mapped_column(String(2048), nullable=False)
    application_url: Mapped[str] = mapped_column(String(2048), nullable=False)
    ats_job_id: Mapped[Optional[str]] = mapped_column(String(255), nullable=True, index=True)

    # Provenance tracking: exact extracted vs heuristic inferred fields
    extracted_fields: Mapped[Dict[str, Any]] = mapped_column(JSON, default=dict, nullable=False)
    inferred_fields: Mapped[Dict[str, Any]] = mapped_column(JSON, default=dict, nullable=False)

    link_status: Mapped[str] = mapped_column(String(50), default="active", nullable=False, index=True)
    discovered_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )
    last_verified_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    # Relationships
    internship: Mapped["Internship"] = relationship("Internship", back_populates="source_records")
    company: Mapped["Company"] = relationship("Company", back_populates="source_records")
    raw_snapshot: Mapped[Optional["RawSnapshot"]] = relationship("RawSnapshot", back_populates="source_records")
    link_checks: Mapped[List["LinkCheck"]] = relationship(
        "LinkCheck",
        back_populates="source_record",
        cascade="all, delete-orphan",
    )
