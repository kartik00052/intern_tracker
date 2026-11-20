# backend/app/schemas/__init__.py
from app.schemas.internship import (
    CompanyRead,
    InternshipBase,
    InternshipCreate,
    InternshipRead,
    InternshipSearchParams,
    PaginatedInternshipsResponse,
    SourceRecordRead,
)

__all__ = [
    "CompanyRead",
    "InternshipBase",
    "InternshipCreate",
    "InternshipRead",
    "InternshipSearchParams",
    "PaginatedInternshipsResponse",
    "SourceRecordRead",
]
