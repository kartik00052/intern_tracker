# backend/tests/conftest.py
from datetime import datetime, timezone
import hashlib
from typing import Any, Dict
import uuid
import pytest

from app.crawler.spiders.base import CompanyTarget, RawJobRecord
import orjson


@pytest.fixture
def mock_company_target() -> CompanyTarget:
    """Fixture providing a mock CompanyTarget descriptor."""
    return CompanyTarget(
        id=uuid.UUID("11111111-1111-1111-1111-111111111111"),
        name="Acme Corp",
        slug="acme-corp",
        ats_identifier="acme",
        careers_url="https://boards.greenhouse.io/acme",
        domain="acme.example.com",
    )


@pytest.fixture
def sample_greenhouse_job_json() -> Dict[str, Any]:
    """Fixture returning sample raw Greenhouse JSON payload for an internship."""
    return {
        "id": 4829102,
        "title": "Software Engineering Intern - Summer 2026",
        "updated_at": "2026-02-15T08:30:00Z",
        "absolute_url": "https://boards.greenhouse.io/acme/jobs/4829102?gh_jid=4829102&utm_source=linkedin",
        "location": {"name": "San Francisco, CA, USA"},
        "departments": [{"id": 101, "name": "Engineering"}],
        "offices": [{"id": 501, "name": "HQ", "location": "San Francisco, CA"}],
        "content": "<p>We are looking for a Software Engineering Intern to join our Core Backend team for Summer 2026. You will build distributed cloud services in Python and Go.</p>",
        "metadata": [],
    }


@pytest.fixture
def sample_greenhouse_senior_job_json() -> Dict[str, Any]:
    """Fixture returning sample raw Greenhouse JSON payload for a non-internship senior role."""
    return {
        "id": 9928120,
        "title": "Senior Staff Backend Engineer",
        "updated_at": "2026-02-10T12:00:00Z",
        "absolute_url": "https://boards.greenhouse.io/acme/jobs/9928120?utm_campaign=hiring",
        "location": {"name": "Remote - US"},
        "departments": [{"id": 101, "name": "Engineering"}],
        "offices": [],
        "content": "<p>Looking for a Senior Staff Engineer with 10+ years of experience leading architecture.</p>",
        "metadata": [],
    }


@pytest.fixture
def mock_raw_internship_record(
    mock_company_target: CompanyTarget,
    sample_greenhouse_job_json: Dict[str, Any],
) -> RawJobRecord:
    """Fixture providing a RawJobRecord instance wrapping the sample Greenhouse internship JSON."""
    raw_payload_bytes = orjson.dumps(sample_greenhouse_job_json)
    payload_str = raw_payload_bytes.decode("utf-8")
    payload_hash = hashlib.sha256(raw_payload_bytes).hexdigest()

    return RawJobRecord(
        source_adapter="greenhouse",
        source_url=sample_greenhouse_job_json["absolute_url"],
        raw_payload=payload_str,
        payload_hash=payload_hash,
        company_id=mock_company_target.id,
        content_type="application/json",
        ats_job_id=str(sample_greenhouse_job_json["id"]),
        crawled_at=datetime.now(timezone.utc),
    )
