# backend/tests/crawler/test_deduplication.py
from datetime import datetime, timezone
import uuid
import pytest

from app.crawler.pipelines.deduplication import DeduplicationPipeline
from app.models.internship import Internship
from app.models.source_record import SourceRecord
from app.schemas.internship import InternshipCreate


def test_deduplication_exact_ats_id_match() -> None:
    """Validate deduplication matches immediately on identical ATS Job ID."""
    company_id = uuid.uuid4()
    existing = Internship(
        id=uuid.uuid4(),
        company_id=company_id,
        title="Software Intern",
        normalized_title="Software Intern",
        canonical_application_url="https://boards.greenhouse.io/acme/jobs/123",
        status="active",
        discovered_at=datetime.now(timezone.utc),
        last_verified_at=datetime.now(timezone.utc),
    )
    existing.source_records = [
        SourceRecord(
            id=uuid.uuid4(),
            internship_id=existing.id,
            company_id=company_id,
            source_adapter="greenhouse",
            source_url="https://boards.greenhouse.io/acme/jobs/123",
            application_url="https://boards.greenhouse.io/acme/jobs/123",
            ats_job_id="123",
            link_status="active",
        )
    ]

    candidate = InternshipCreate(
        company_id=company_id,
        title="Software Intern (Variant)",
        normalized_title="Software Intern (Variant)",
        canonical_application_url="https://acme.com/careers/jobs/123",
        source_adapter="greenhouse",
        source_url="https://acme.com/careers/jobs/123",
        ats_job_id="123",
    )

    match = DeduplicationPipeline.find_best_match(candidate, [existing])
    assert match is not None
    assert match.id == existing.id


def test_deduplication_fuzzy_similarity() -> None:
    """Validate RapidFuzz fuzzy composite scoring identifies equivalent postings."""
    company_id = uuid.uuid4()
    existing = Internship(
        id=uuid.uuid4(),
        company_id=company_id,
        title="Software Engineering Intern - Summer 2026",
        normalized_title="Software Engineering Intern - Summer 2026",
        location="San Francisco, CA",
        city="San Francisco",
        state="CA",
        department="Engineering",
        canonical_application_url="https://boards.greenhouse.io/acme/jobs/456",
        status="active",
        discovered_at=datetime.now(timezone.utc),
        last_verified_at=datetime.now(timezone.utc),
    )
    existing.source_records = []

    # Similar candidate with slight wording change: "2026 Summer Software Engineer Intern"
    candidate = InternshipCreate(
        company_id=company_id,
        title="2026 Summer Software Engineer Intern",
        normalized_title="2026 Summer Software Engineer Intern",
        location="San Francisco, CA",
        city="San Francisco",
        state="CA",
        department="Engineering",
        canonical_application_url="https://jobs.lever.co/acme/789",
        source_adapter="lever",
        source_url="https://jobs.lever.co/acme/789",
        ats_job_id="789",
    )

    score = DeduplicationPipeline.calculate_match_score(candidate, existing)
    assert score >= DeduplicationPipeline.SCORE_THRESHOLD, f"Expected score >= 85, got {score}"

    match = DeduplicationPipeline.find_best_match(candidate, [existing])
    assert match is not None
    assert match.id == existing.id
