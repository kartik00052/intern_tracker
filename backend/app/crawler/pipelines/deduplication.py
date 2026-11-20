# backend/app/crawler/pipelines/deduplication.py
from typing import Optional, Sequence
from rapidfuzz import fuzz

from app.models.internship import Internship
from app.schemas.internship import InternshipCreate


class DeduplicationPipeline:
    """Multi-vector deduplication engine using exact keys and RapidFuzz composite scoring."""

    SCORE_THRESHOLD = 85.0

    @classmethod
    def calculate_match_score(cls, candidate: InternshipCreate, existing: Internship) -> float:
        """Calculate weighted composite similarity score between candidate and existing internship."""
        # 1. Company check: Must be identical company
        if str(candidate.company_id) != str(existing.company_id):
            return 0.0

        # Weights:
        # Title similarity: 50%
        # Location / Remote similarity: 30%
        # Department similarity: 20%
        title_score = fuzz.token_sort_ratio(
            candidate.normalized_title.lower(),
            existing.normalized_title.lower(),
        )

        loc_score = 100.0 if candidate.is_remote and existing.is_remote else 0.0
        if not loc_score and candidate.city and existing.city:
            loc_score = fuzz.ratio(candidate.city.lower(), existing.city.lower())
        elif not loc_score and candidate.location and existing.location:
            loc_score = fuzz.ratio(candidate.location.lower(), existing.location.lower())

        dept_score = 0.0
        if candidate.department and existing.department:
            dept_score = fuzz.ratio(candidate.department.lower(), existing.department.lower())
        elif not candidate.department and not existing.department:
            dept_score = 100.0

        composite_score = (0.50 * title_score) + (0.30 * loc_score) + (0.20 * dept_score)
        return composite_score

    @classmethod
    def find_best_match(
        cls,
        candidate: InternshipCreate,
        existing_pool: Sequence[Internship],
    ) -> Optional[Internship]:
        """Find the matching existing canonical internship or None if candidate is unique."""
        best_candidate: Optional[Internship] = None
        best_score = 0.0

        for existing in existing_pool:
            # 1. Exact ATS job ID match
            if candidate.ats_job_id and any(
                sr.ats_job_id == candidate.ats_job_id for sr in existing.source_records
            ):
                return existing

            # 2. Exact canonical application URL match
            if candidate.canonical_application_url == existing.canonical_application_url:
                return existing

            # 3. Exact content hash match
            if candidate.content_hash and candidate.content_hash == existing.content_hash:
                return existing

            # 4. Fuzzy RapidFuzz scoring
            score = cls.calculate_match_score(candidate, existing)
            if score > best_score and score >= cls.SCORE_THRESHOLD:
                best_score = score
                best_candidate = existing

        return best_candidate
