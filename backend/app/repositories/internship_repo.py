# backend/app/repositories/internship_repo.py
from datetime import datetime, timezone
import math
from typing import List, Optional, Tuple
import uuid

from sqlalchemy import func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.company import Company
from app.models.internship import Internship
from app.models.source_record import SourceRecord
from app.schemas.internship import (
    InternshipCreate,
    InternshipSearchParams,
    PaginatedInternshipsResponse,
)


class InternshipRepository:
    """Repository handling database access, filtering, and persistence for internships."""

    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def get_by_id(self, internship_id: uuid.UUID) -> Optional[Internship]:
        """Fetch an internship by its UUID with eager-loaded relations."""
        stmt = (
            select(Internship)
            .options(
                selectinload(Internship.company),
                selectinload(Internship.source_records),
            )
            .where(Internship.id == internship_id)
        )
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()

    async def get_by_canonical_url(self, url: str) -> Optional[Internship]:
        """Look up canonical internship by normalized application URL."""
        stmt = (
            select(Internship)
            .options(
                selectinload(Internship.company),
                selectinload(Internship.source_records),
            )
            .where(Internship.canonical_application_url == url)
        )
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()

    async def get_by_ats_job_id(self, company_id: uuid.UUID, ats_job_id: str) -> Optional[Internship]:
        """Look up canonical internship via an existing source record ATS ID."""
        stmt = (
            select(Internship)
            .join(SourceRecord, SourceRecord.internship_id == Internship.id)
            .options(
                selectinload(Internship.company),
                selectinload(Internship.source_records),
            )
            .where(
                SourceRecord.company_id == company_id,
                SourceRecord.ats_job_id == ats_job_id,
            )
        )
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()

    async def upsert(self, data: InternshipCreate) -> Internship:
        """Upsert a canonical internship and attach/update its source record provenance."""
        now = datetime.now(timezone.utc)
        internship: Optional[Internship] = None

        # 1. Try matching by exact ATS job ID if present
        if data.ats_job_id:
            internship = await self.get_by_ats_job_id(data.company_id, data.ats_job_id)

        # 2. Fall back to matching by canonical application URL
        if not internship:
            internship = await self.get_by_canonical_url(data.canonical_application_url)

        # 3. Fall back to matching by content hash if present
        if not internship and data.content_hash:
            stmt = select(Internship).where(
                Internship.company_id == data.company_id,
                Internship.content_hash == data.content_hash,
            )
            res = await self.session.execute(stmt)
            internship = res.scalar_one_or_none()

        if internship:
            # Update existing record metadata
            internship.last_verified_at = now
            internship.status = "active"
            if data.description_markdown and not internship.description_markdown:
                internship.description_markdown = data.description_markdown
            if data.requirements_summary and not internship.requirements_summary:
                internship.requirements_summary = data.requirements_summary
            if data.stipend_amount is not None:
                internship.stipend_amount = data.stipend_amount
                internship.stipend_currency = data.stipend_currency
                internship.stipend_interval = data.stipend_interval
        else:
            # Create new canonical record
            internship = Internship(
                company_id=data.company_id,
                title=data.title,
                normalized_title=data.normalized_title,
                role_category=data.role_category,
                department=data.department,
                location=data.location,
                city=data.city,
                state=data.state,
                country=data.country,
                is_remote=data.is_remote,
                remote_type=data.remote_type,
                stipend_currency=data.stipend_currency,
                stipend_amount=data.stipend_amount,
                stipend_interval=data.stipend_interval,
                min_stipend=data.min_stipend,
                max_stipend=data.max_stipend,
                start_date=data.start_date,
                end_date=data.end_date,
                duration_weeks=data.duration_weeks,
                deadline=data.deadline,
                experience_level=data.experience_level,
                requirements_summary=data.requirements_summary,
                description_markdown=data.description_markdown,
                content_hash=data.content_hash,
                canonical_application_url=data.canonical_application_url,
                status=data.status,
                discovered_at=now,
                last_verified_at=now,
            )
            self.session.add(internship)
            await self.session.flush()

        # Manage SourceRecord provenance
        stmt_sr = select(SourceRecord).where(
            SourceRecord.internship_id == internship.id,
            SourceRecord.source_url == data.source_url,
        )
        res_sr = await self.session.execute(stmt_sr)
        source_rec = res_sr.scalar_one_or_none()

        if source_rec:
            source_rec.last_verified_at = now
            source_rec.link_status = "active"
            source_rec.application_url = data.canonical_application_url
            if data.raw_snapshot_id:
                source_rec.raw_snapshot_id = data.raw_snapshot_id
        else:
            source_rec = SourceRecord(
                internship_id=internship.id,
                company_id=data.company_id,
                raw_snapshot_id=data.raw_snapshot_id,
                source_adapter=data.source_adapter,
                source_url=data.source_url,
                application_url=data.canonical_application_url,
                ats_job_id=data.ats_job_id,
                extracted_fields=data.extracted_fields,
                inferred_fields=data.inferred_fields,
                link_status="active",
                discovered_at=now,
                last_verified_at=now,
            )
            self.session.add(source_rec)

        await self.session.flush()
        return internship

    async def search(self, params: InternshipSearchParams) -> PaginatedInternshipsResponse:
        """Search and paginate canonical internships with structured filters."""
        stmt = (
            select(Internship)
            .join(Company, Company.id == Internship.company_id)
            .options(
                selectinload(Internship.company),
                selectinload(Internship.source_records),
            )
        )

        filters = []

        if params.status and params.status != "all":
            filters.append(Internship.status == params.status)

        if params.q:
            query_term = f"%{params.q.strip()}%"
            filters.append(
                or_(
                    Internship.title.ilike(query_term),
                    Internship.department.ilike(query_term),
                    Company.name.ilike(query_term),
                )
            )

        if params.location:
            loc_term = f"%{params.location.strip()}%"
            filters.append(
                or_(
                    Internship.location.ilike(loc_term),
                    Internship.city.ilike(loc_term),
                    Internship.state.ilike(loc_term),
                )
            )

        if params.remote is not None:
            filters.append(Internship.is_remote == params.remote)

        if params.country:
            filters.append(Internship.country.ilike(params.country.strip()))

        if params.stipend is True:
            filters.append(
                or_(
                    Internship.stipend_amount.is_not(None),
                    Internship.min_stipend.is_not(None),
                )
            )

        if params.role_category:
            filters.append(Internship.role_category.ilike(f"%{params.role_category.strip()}%"))

        if params.posted_after:
            filters.append(Internship.discovered_at >= params.posted_after)

        if filters:
            stmt = stmt.where(*filters)

        # Count total matches
        count_stmt = (
            select(func.count(Internship.id))
            .join(Company, Company.id == Internship.company_id)
        )
        if filters:
            count_stmt = count_stmt.where(*filters)

        total_res = await self.session.execute(count_stmt)
        total = total_res.scalar_one()

        # Order and pagination
        offset = (params.page - 1) * params.page_size
        stmt = stmt.order_by(Internship.discovered_at.desc()).offset(offset).limit(params.page_size)

        result = await self.session.execute(stmt)
        items = list(result.scalars().all())

        total_pages = math.ceil(total / params.page_size) if total > 0 else 0

        return PaginatedInternshipsResponse(
            items=items,  # type: ignore[arg-type]
            total=total,
            page=params.page,
            page_size=params.page_size,
            total_pages=total_pages,
        )
