# backend/tests/crawler/test_greenhouse.py
from decimal import Decimal
import pytest

from app.crawler.pipelines.normalization import EntityNormalizer
from app.crawler.spiders.base import RawJobRecord
from app.crawler.spiders.greenhouse import GreenhouseAdapter


def test_greenhouse_adapter_parsing(mock_raw_internship_record: RawJobRecord) -> None:
    """Test Greenhouse adapter parsing of raw JSON payload into ExtractedJob."""
    adapter = GreenhouseAdapter()
    extracted = adapter.parse_job(mock_raw_internship_record)

    assert extracted.source_adapter == "greenhouse"
    assert extracted.title == "Software Engineering Intern - Summer 2026"
    assert extracted.ats_job_id == "4829102"
    assert extracted.department == "Engineering"
    assert extracted.location == "San Francisco, CA, USA"
    assert extracted.is_remote is False
    assert extracted.description_html is not None
    assert "distributed cloud services" in (extracted.description_text or "")

    # Zero-hallucination verification: Missing compensation must remain None
    assert extracted.stipend_amount is None
    assert extracted.stipend_currency is None
    assert extracted.deadline is None
    assert extracted.duration_weeks is None


def test_normalization_and_url_cleaning(mock_raw_internship_record: RawJobRecord) -> None:
    """Test full normalization pipeline including URL sanitization and location parsing."""
    adapter = GreenhouseAdapter()
    normalizer = EntityNormalizer()

    extracted = adapter.parse_job(mock_raw_internship_record)
    normalized = normalizer.process(extracted)

    assert normalized is not None
    assert normalized.normalized_title == "Software Engineering Intern - Summer 2026"
    assert normalized.role_category == "Software Engineering"

    # Verify canonical URL strips tracking parameters (gh_jid, utm_source)
    assert "utm_source" not in normalized.canonical_application_url
    assert "gh_jid" not in normalized.canonical_application_url
    assert normalized.canonical_application_url == "https://boards.greenhouse.io/acme/jobs/4829102"

    # Verify location parsing
    assert normalized.city == "San Francisco"
    assert normalized.state == "CA"
    assert normalized.country == "United States"

    # Verify content hash calculation
    assert normalized.content_hash is not None
    assert len(normalized.content_hash) == 64

    # Verify zero-hallucination rule
    assert normalized.stipend_amount is None
    assert normalized.deadline is None


def test_normalizer_discards_non_internship(
    mock_company_target,
    sample_greenhouse_senior_job_json,
) -> None:
    """Test that senior non-internship roles are discarded by the normalizer."""
    import hashlib
    import orjson

    raw_bytes = orjson.dumps(sample_greenhouse_senior_job_json)
    raw_record = RawJobRecord(
        source_adapter="greenhouse",
        source_url=sample_greenhouse_senior_job_json["absolute_url"],
        raw_payload=raw_bytes.decode("utf-8"),
        payload_hash=hashlib.sha256(raw_bytes).hexdigest(),
        company_id=mock_company_target.id,
        ats_job_id=str(sample_greenhouse_senior_job_json["id"]),
    )

    adapter = GreenhouseAdapter()
    normalizer = EntityNormalizer()

    extracted = adapter.parse_job(raw_record)
    normalized = normalizer.process(extracted)

    assert normalized is None, "Normalizer should reject non-internship senior role"
