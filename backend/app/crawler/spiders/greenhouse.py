# backend/app/crawler/spiders/greenhouse.py
from datetime import datetime, timezone
import hashlib
from typing import Any, AsyncGenerator, Dict, List, Optional
import httpx
try:
    from selectolax.lexbor import LexborHTMLParser as HTMLParser
except ImportError:
    from selectolax.parser import HTMLParser  # type: ignore[no-redef]
from tenacity import retry, retry_if_exception_type, stop_after_attempt, wait_exponential

from app.core.config import settings
from app.crawler.spiders.base import BaseSourceAdapter, CompanyTarget, ExtractedJob, RawJobRecord
import orjson


class GreenhouseAdapter(BaseSourceAdapter):
    """Source adapter for companies hosting job boards on Greenhouse."""

    ats_name: str = "greenhouse"
    API_BASE_URL: str = "https://boards-api.greenhouse.io/v1/boards/{board_token}/jobs?content=true"

    def __init__(self, client: Optional[httpx.AsyncClient] = None) -> None:
        self._client = client

    async def _get_client(self) -> httpx.AsyncClient:
        if self._client is None or self._client.is_closed:
            self._client = httpx.AsyncClient(
                headers={"User-Agent": settings.CRAWLER_USER_AGENT},
                timeout=settings.CRAWLER_REQUEST_TIMEOUT_SECONDS,
                follow_redirects=True,
            )
        return self._client

    @retry(
        reraise=True,
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=1.5, min=2.0, max=10.0),
        retry=retry_if_exception_type((httpx.RequestError, httpx.HTTPStatusError)),
    )
    async def _fetch_board_data(self, client: httpx.AsyncClient, url: str) -> Dict[str, Any]:
        """Fetch Greenhouse board JSON with resilient retry backoff."""
        response = await client.get(url)
        response.raise_for_status()
        return orjson.loads(response.content)

    async def fetch_jobs(self, target: CompanyTarget) -> AsyncGenerator[RawJobRecord, None]:
        """Fetch all listings for the given Greenhouse board token."""
        board_token = target.ats_identifier or target.slug
        url = self.API_BASE_URL.format(board_token=board_token)
        client = await self._get_client()

        try:
            data = await self._fetch_board_data(client, url)
        except Exception:
            return

        jobs_list: List[Dict[str, Any]] = data.get("jobs", [])
        for job_dict in jobs_list:
            job_payload_bytes = orjson.dumps(job_dict)
            payload_str = job_payload_bytes.decode("utf-8")
            payload_hash = hashlib.sha256(job_payload_bytes).hexdigest()
            ats_job_id = str(job_dict.get("id")) if job_dict.get("id") is not None else None

            yield RawJobRecord(
                source_adapter=self.ats_name,
                source_url=job_dict.get("absolute_url") or url,
                raw_payload=payload_str,
                payload_hash=payload_hash,
                company_id=target.id,
                content_type="application/json",
                ats_job_id=ats_job_id,
                crawled_at=datetime.now(timezone.utc),
            )

    def parse_job(self, raw_record: RawJobRecord) -> ExtractedJob:
        """Parse raw Greenhouse JSON job payload into an ExtractedJob."""
        data: Dict[str, Any] = orjson.loads(raw_record.raw_payload)

        title = (data.get("title") or "").strip()
        ats_job_id = str(data.get("id")) if data.get("id") is not None else raw_record.ats_job_id
        application_url = data.get("absolute_url") or raw_record.source_url

        # Location extraction
        location_obj = data.get("location") or {}
        location_name = location_obj.get("name") if isinstance(location_obj, dict) else str(location_obj)
        location_str = (location_name or "").strip() or None

        # Department extraction
        departments = data.get("departments") or []
        department_name: Optional[str] = None
        if departments and isinstance(departments, list):
            department_name = departments[0].get("name")

        # HTML content & clean text extraction via selectolax
        content_html = data.get("content") or ""
        content_text = ""
        if content_html:
            parser = HTMLParser(content_html)
            content_text = parser.text(separator=" ", strip=True)

        # Detect remote status
        is_remote = False
        remote_type = "on_site"
        combined_text = f"{title} {location_str or ''}".lower()
        if "remote" in combined_text or "anywhere" in combined_text:
            is_remote = True
            remote_type = "fully_remote"
        elif "hybrid" in combined_text:
            is_remote = True
            remote_type = "hybrid"

        extracted_fields = {
            "title": title,
            "ats_job_id": ats_job_id,
            "location": location_str,
            "department": department_name,
            "updated_at": data.get("updated_at"),
            "data_compliance": data.get("data_compliance"),
        }

        inferred_fields = {
            "is_remote": is_remote,
            "remote_type": remote_type,
        }

        return ExtractedJob(
            source_adapter=self.ats_name,
            company_id=raw_record.company_id,
            title=title,
            application_url=application_url,
            source_url=raw_record.source_url,
            ats_job_id=ats_job_id,
            department=department_name,
            location=location_str,
            is_remote=is_remote,
            remote_type=remote_type,
            # Compensation strictly None unless structured field exists
            stipend_currency=None,
            stipend_amount=None,
            stipend_interval=None,
            min_stipend=None,
            max_stipend=None,
            start_date=None,
            end_date=None,
            duration_weeks=None,
            deadline=None,
            experience_level="Internship / Entry",
            description_html=content_html or None,
            description_text=content_text or None,
            extracted_fields=extracted_fields,
            inferred_fields=inferred_fields,
        )

    async def close(self) -> None:
        """Close the underlying HTTP client session."""
        if self._client and not self._client.is_closed:
            await self._client.aclose()
