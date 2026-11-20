# backend/app/crawler/pipelines/normalization.py
from datetime import datetime, timezone
import hashlib
import re
from typing import Any, Dict, Optional, Tuple
from urllib.parse import parse_qsl, urlencode, urlparse, urlunparse

import ftfy

from app.crawler.pipelines.classification import ClassificationResult, InternshipClassifier
from app.crawler.spiders.base import ExtractedJob
from app.schemas.internship import InternshipCreate


class EntityNormalizer:
    """Normalizes titles, clean URLs, parse locations, and enforce zero-hallucination integrity."""

    TRACKING_PARAMS = {
        "utm_source",
        "utm_medium",
        "utm_campaign",
        "utm_term",
        "utm_content",
        "gh_jid",
        "gh_src",
        "ref",
        "source",
        "lever-source",
        "fbclid",
        "gclid",
    }

    COUNTRY_CODES = {
        "us": "United States",
        "usa": "United States",
        "united states": "United States",
        "ca": "Canada",
        "canada": "Canada",
        "uk": "United Kingdom",
        "united kingdom": "United Kingdom",
        "gb": "United Kingdom",
        "in": "India",
        "india": "India",
        "de": "Germany",
        "germany": "Germany",
    }

    def __init__(self) -> None:
        self.classifier = InternshipClassifier()

    def normalize_url(self, raw_url: str) -> str:
        """Strip tracking query parameters and fragments to produce a canonical application URL."""
        if not raw_url:
            return ""

        parsed = urlparse(raw_url.strip())
        query_pairs = parse_qsl(parsed.query, keep_blank_values=False)
        filtered_query = [(k, v) for k, v in query_pairs if k.lower() not in self.TRACKING_PARAMS]

        clean_query = urlencode(filtered_query)
        # Rebuild URL without tracking fragments and parameters
        normalized = urlunparse((
            parsed.scheme.lower(),
            parsed.netloc.lower(),
            parsed.path.rstrip("/"),
            "",
            clean_query,
            "",
        ))
        return normalized

    def normalize_title(self, raw_title: str) -> str:
        """Fix Unicode anomalies, remove extraneous job requisition IDs and clean spacing."""
        cleaned = ftfy.fix_text(raw_title)
        # Remove parenthetical job IDs e.g., "(REQ-12345)" or "[#8912]"
        cleaned = re.sub(r"[\(\[\{]\s*(REQ|JOB|#)?[0-9a-zA-Z\-_]+\s*[\)\]\}]", "", cleaned)
        # Normalize whitespace
        cleaned = re.sub(r"\s+", " ", cleaned).strip()
        return cleaned

    def parse_location(self, raw_location: Optional[str]) -> Tuple[Optional[str], Optional[str], Optional[str]]:
        """Extract city, state, country from composite location strings."""
        if not raw_location:
            return (None, None, None)

        text = ftfy.fix_text(raw_location).strip()
        parts = [p.strip() for p in text.split(",") if p.strip()]

        city: Optional[str] = None
        state: Optional[str] = None
        country: Optional[str] = None

        if len(parts) == 1:
            token = parts[0]
            if token.lower() in self.COUNTRY_CODES:
                country = self.COUNTRY_CODES[token.lower()]
            else:
                city = token
        elif len(parts) == 2:
            city = parts[0]
            state_or_country = parts[1]
            if state_or_country.lower() in self.COUNTRY_CODES:
                country = self.COUNTRY_CODES[state_or_country.lower()]
            else:
                state = state_or_country
        elif len(parts) >= 3:
            city = parts[0]
            state = parts[1]
            c_candidate = parts[-1].lower()
            country = self.COUNTRY_CODES.get(c_candidate, parts[-1])

        return (city, state, country)

    def compute_content_hash(self, company_id: str, title: str, description_text: Optional[str]) -> str:
        """Generate SHA-256 fingerprint for deduplication."""
        hasher = hashlib.sha256()
        hasher.update(company_id.encode("utf-8"))
        hasher.update(title.lower().encode("utf-8"))
        if description_text:
            # Use top 1000 characters to tolerate minor footer updates
            hasher.update(description_text[:1000].lower().encode("utf-8"))
        return hasher.hexdigest()

    def process(
        self,
        extracted: ExtractedJob,
        raw_snapshot_id: Optional[Any] = None,
    ) -> Optional[InternshipCreate]:
        """Normalize extracted job into a validated InternshipCreate payload or None if disqualified."""
        clean_title = self.normalize_title(extracted.title)
        classification = self.classifier.classify(clean_title, extracted.description_text)

        if not classification.is_internship:
            return None

        canonical_url = self.normalize_url(extracted.application_url)
        city, state, country = self.parse_location(extracted.location)
        content_hash = self.compute_content_hash(
            str(extracted.company_id),
            clean_title,
            extracted.description_text,
        )

        extracted_fields = dict(extracted.extracted_fields)
        inferred_fields = dict(extracted.inferred_fields)
        inferred_fields["classification_confidence"] = classification.confidence
        inferred_fields["classification_rules"] = classification.matched_rules

        # Zero-hallucination guarantee: Missing stipend/deadline/duration remains strictly None
        return InternshipCreate(
            company_id=extracted.company_id,
            title=extracted.title,
            normalized_title=clean_title,
            role_category=classification.role_category,
            department=extracted.department,
            location=extracted.location,
            city=city,
            state=state,
            country=country,
            is_remote=extracted.is_remote,
            remote_type=extracted.remote_type,
            # Compensation fields strictly None if not explicitly present
            stipend_currency=extracted.stipend_currency,
            stipend_amount=extracted.stipend_amount,
            stipend_interval=extracted.stipend_interval,
            min_stipend=extracted.min_stipend,
            max_stipend=extracted.max_stipend,
            start_date=extracted.start_date,
            end_date=extracted.end_date,
            duration_weeks=extracted.duration_weeks,
            deadline=extracted.deadline,
            experience_level=extracted.experience_level,
            requirements_summary=extracted.requirements_summary,
            description_markdown=extracted.description_text,
            content_hash=content_hash,
            canonical_application_url=canonical_url,
            status="active",
            source_adapter=extracted.source_adapter,
            source_url=extracted.source_url,
            ats_job_id=extracted.ats_job_id,
            raw_snapshot_id=raw_snapshot_id,
            extracted_fields=extracted_fields,
            inferred_fields=inferred_fields,
        )
