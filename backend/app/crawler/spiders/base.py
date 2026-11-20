# backend/app/crawler/spiders/base.py
from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from datetime import date, datetime, timezone
from decimal import Decimal
from typing import Any, AsyncGenerator, Dict, Optional
import uuid


@dataclass
class CompanyTarget:
    """Target company descriptor for crawler adapters."""

    id: uuid.UUID
    name: str
    slug: str
    careers_url: Optional[str] = None
    ats_identifier: Optional[str] = None  # e.g., greenhouse board token
    domain: Optional[str] = None


@dataclass
class RawJobRecord:
    """Unprocessed crawl payload snapshot captured from the source endpoint."""

    source_adapter: str
    source_url: str
    raw_payload: str
    payload_hash: str
    company_id: uuid.UUID
    content_type: str = "application/json"
    ats_job_id: Optional[str] = None
    crawled_at: datetime = field(default_factory=lambda: datetime.now(timezone.utc))


@dataclass
class ExtractedJob:
    """Strongly-typed, extracted job attributes before normalization."""

    source_adapter: str
    company_id: uuid.UUID
    title: str
    application_url: str
    source_url: str
    ats_job_id: Optional[str] = None
    department: Optional[str] = None
    location: Optional[str] = None
    is_remote: bool = False
    remote_type: Optional[str] = None

    # Compensation (Zero-hallucination: strictly None unless explicitly reported by ATS)
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
    description_html: Optional[str] = None
    description_text: Optional[str] = None

    extracted_fields: Dict[str, Any] = field(default_factory=dict)
    inferred_fields: Dict[str, Any] = field(default_factory=dict)


class BaseSourceAdapter(ABC):
    """Abstract Base Class for all Applicant Tracking System (ATS) source adapters."""

    ats_name: str

    @abstractmethod
    async def fetch_jobs(self, target: CompanyTarget) -> AsyncGenerator[RawJobRecord, None]:
        """Fetch raw job records from the target ATS endpoint."""
        pass

    @abstractmethod
    def parse_job(self, raw_record: RawJobRecord) -> ExtractedJob:
        """Parse a single raw record into an ExtractedJob structure."""
        pass
