# backend/app/models/company.py
from typing import TYPE_CHECKING, List, Optional
from sqlalchemy import String
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base import Base

if TYPE_CHECKING:
    from app.models.internship import Internship
    from app.models.source_record import SourceRecord


class Company(Base):
    """Company / Employer model representing tracked organizations."""

    __tablename__ = "companies"

    name: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    slug: Mapped[str] = mapped_column(String(255), unique=True, nullable=False, index=True)
    domain: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    logo_url: Mapped[Optional[str]] = mapped_column(String(1024), nullable=True)
    careers_url: Mapped[Optional[str]] = mapped_column(String(1024), nullable=True)
    ats_provider: Mapped[Optional[str]] = mapped_column(String(100), nullable=True, index=True)
    ats_identifier: Mapped[Optional[str]] = mapped_column(String(255), nullable=True, index=True)

    # Relationships
    internships: Mapped[List["Internship"]] = relationship(
        "Internship",
        back_populates="company",
        cascade="all, delete-orphan",
    )
    source_records: Mapped[List["SourceRecord"]] = relationship(
        "SourceRecord",
        back_populates="company",
        cascade="all, delete-orphan",
    )
