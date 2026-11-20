# backend/app/schemas/internship.py
from datetime import date, datetime
from decimal import Decimal
from typing import Any, Dict, List, Optional
import uuid
from pydantic import BaseModel, ConfigDict, Field, HttpUrl


class CompanyRead(BaseModel):
    """Schema for nested company details."""

    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    name: str
    slug: str
    domain: Optional[str] = None
    logo_url: Optional[str] = None
    careers_url: Optional[str] = None
    ats_provider: Optional[str] = None


class SourceRecordRead(BaseModel):
    """Schema for source record provenance attached to an internship."""

    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    source_adapter: str
    source_url: str
    application_url: str
    ats_job_id: Optional[str] = None
    link_status: str
    discovered_at: datetime
    last_verified_at: datetime
    extracted_fields: Dict[str, Any] = Field(default_factory=dict)
    inferred_fields: Dict[str, Any] = Field(default_factory=dict)


class InternshipBase(BaseModel):
    """Common fields for Internship representations."""

    title: str
    normalized_title: str
    role_category: Optional[str] = None
    department: Optional[str] = None
    location: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    country: Optional[str] = None
    is_remote: bool = False
    remote_type: Optional[str] = None

    # Zero-hallucination rule: default None
    stipend_currency: Optional[str] = None
    stipend_amount: Optional[Decimal] = None
    stipend_interval: Optional[str] = None
    min_stipend: Optional[Decimal] = None
    max_stipend: Optional[Decimal] = None

    start_date: Optional[date] = None
    end_date: Optional[date] = None
    duration_weeks: Optional[int] = None
    deadline: Optional[date] = None

    experience_level: Optional[str] = None
    requirements_summary: Optional[str] = None
    description_markdown: Optional[str] = None
    canonical_application_url: str
    status: str = "active"


class InternshipCreate(InternshipBase):
    """Schema for creating or upserting an internship."""

    company_id: uuid.UUID
    content_hash: Optional[str] = None
    source_adapter: str
    source_url: str
    ats_job_id: Optional[str] = None
    raw_snapshot_id: Optional[uuid.UUID] = None
    extracted_fields: Dict[str, Any] = Field(default_factory=dict)
    inferred_fields: Dict[str, Any] = Field(default_factory=dict)


class InternshipRead(InternshipBase):
    """Schema for reading a canonical internship with provenance."""

    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    company_id: uuid.UUID
    company: Optional[CompanyRead] = None
    source_records: List[SourceRecordRead] = Field(default_factory=list)
    discovered_at: datetime
    last_verified_at: datetime
    created_at: datetime
    updated_at: datetime


class InternshipSearchParams(BaseModel):
    """Search and filter parameters for listing internships."""

    q: Optional[str] = Field(default=None, description="Keywords for title, department, or company search")
    location: Optional[str] = Field(default=None, description="City, state, or location string")
    remote: Optional[bool] = Field(default=None, description="Filter remote positions only")
    country: Optional[str] = Field(default=None, description="Two-letter or full country name")
    stipend: Optional[bool] = Field(default=None, description="Only show listings with explicit compensation")
    role_category: Optional[str] = Field(default=None, description="Role track (e.g. Engineering, Product)")
    posted_after: Optional[datetime] = Field(default=None, description="Listings discovered after this timestamp")
    status: Optional[str] = Field(default="active", description="Filter by status ('active', 'expired', 'all')")
    page: int = Field(default=1, ge=1, description="Page number starting from 1")
    page_size: int = Field(default=20, ge=1, le=100, description="Items per page (max 100)")


class PaginatedInternshipsResponse(BaseModel):
    """Paginated response wrapper for internship search."""

    items: List[InternshipRead]
    total: int
    page: int
    page_size: int
    total_pages: int
