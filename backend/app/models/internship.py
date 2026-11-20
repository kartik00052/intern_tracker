# backend/app/models/internship.py
from datetime import date, datetime, timezone
from decimal import Decimal
from typing import TYPE_CHECKING, List, Optional
import uuid
from sqlalchemy import (
    Boolean,
    Date,
    DateTime,
    ForeignKey,
    Integer,
    Numeric,
    String,
    Text,
    Uuid,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base import Base

if TYPE_CHECKING:
    from app.models.company import Company
    from app.models.source_record import SourceRecord


class Internship(Base):
    """Canonical Internship entity representing a unique verified opportunity."""

    __tablename__ = "internships"

    company_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("companies.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    title: Mapped[str] = mapped_column(String(500), nullable=False, index=True)
    normalized_title: Mapped[str] = mapped_column(String(500), nullable=False, index=True)
    role_category: Mapped[Optional[str]] = mapped_column(String(150), nullable=True, index=True)
    department: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)

    # Location attributes
    location: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    city: Mapped[Optional[str]] = mapped_column(String(255), nullable=True, index=True)
    state: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    country: Mapped[Optional[str]] = mapped_column(String(100), nullable=True, index=True)
    is_remote: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False, index=True)
    remote_type: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)  # fully_remote, hybrid, on_site

    # Compensation (Zero-hallucination: explicitly None if not stated)
    stipend_currency: Mapped[Optional[str]] = mapped_column(String(10), nullable=True)
    stipend_amount: Mapped[Optional[Decimal]] = mapped_column(Numeric(12, 2), nullable=True)
    stipend_interval: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)  # hourly, monthly, lump_sum
    min_stipend: Mapped[Optional[Decimal]] = mapped_column(Numeric(12, 2), nullable=True)
    max_stipend: Mapped[Optional[Decimal]] = mapped_column(Numeric(12, 2), nullable=True)

    # Dates and duration
    start_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    end_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    duration_weeks: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    deadline: Mapped[Optional[date]] = mapped_column(Date, nullable=True)

    # Requirements and content
    experience_level: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    requirements_summary: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    description_markdown: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # Deduplication and identity keys
    content_hash: Mapped[Optional[str]] = mapped_column(String(64), nullable=True, index=True)
    canonical_application_url: Mapped[str] = mapped_column(
        String(2048),
        nullable=False,
        unique=True,
        index=True,
    )

    # Verification state
    status: Mapped[str] = mapped_column(String(50), default="active", nullable=False, index=True)
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
    company: Mapped["Company"] = relationship("Company", back_populates="internships")
    source_records: Mapped[List["SourceRecord"]] = relationship(
        "SourceRecord",
        back_populates="internship",
        cascade="all, delete-orphan",
    )
