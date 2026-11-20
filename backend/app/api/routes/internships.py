# backend/app/api/routes/internships.py
from datetime import datetime
from typing import Optional
import uuid

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.dependencies.db import get_db
from app.repositories.internship_repo import InternshipRepository
from app.schemas.internship import (
    InternshipRead,
    InternshipSearchParams,
    PaginatedInternshipsResponse,
)

router = APIRouter(prefix="/internships", tags=["Internships"])


@router.get("", response_model=PaginatedInternshipsResponse, status_code=status.HTTP_200_OK)
async def list_internships(
    q: Optional[str] = Query(default=None, description="Search keyword in title, company, or department"),
    location: Optional[str] = Query(default=None, description="Location, city, or state filter"),
    remote: Optional[bool] = Query(default=None, description="Remote work filter"),
    country: Optional[str] = Query(default=None, description="Country filter"),
    stipend: Optional[bool] = Query(default=None, description="Listings with explicit stipend only"),
    role_category: Optional[str] = Query(default=None, description="Role track / category"),
    posted_after: Optional[datetime] = Query(default=None, description="Filter discovered after this timestamp"),
    status_filter: Optional[str] = Query(default="active", alias="status", description="Status filter: active, expired, all"),
    page: int = Query(default=1, ge=1, description="Page number starting at 1"),
    page_size: int = Query(default=20, ge=1, le=100, description="Items per page"),
    db: AsyncSession = Depends(get_db),
) -> PaginatedInternshipsResponse:
    """Retrieve paginated canonical internships matching search and facet criteria."""
    params = InternshipSearchParams(
        q=q,
        location=location,
        remote=remote,
        country=country,
        stipend=stipend,
        role_category=role_category,
        posted_after=posted_after,
        status=status_filter,
        page=page,
        page_size=page_size,
    )
    repo = InternshipRepository(db)
    return await repo.search(params)


@router.get("/{internship_id}", response_model=InternshipRead, status_code=status.HTTP_200_OK)
async def get_internship_by_id(
    internship_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
) -> InternshipRead:
    """Retrieve full details of a canonical internship including provenance records."""
    repo = InternshipRepository(db)
    internship = await repo.get_by_id(internship_id)
    if not internship:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Internship with ID {internship_id} not found",
        )
    return InternshipRead.model_validate(internship)
