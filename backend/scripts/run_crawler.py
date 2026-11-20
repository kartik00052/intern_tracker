# backend/scripts/run_crawler.py
import argparse
import asyncio
import sys
import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.crawler.pipelines.normalization import EntityNormalizer
from app.crawler.spiders.base import CompanyTarget
from app.crawler.spiders.greenhouse import GreenhouseAdapter
from app.db.session import async_session_factory
from app.models.company import Company
from app.models.crawl_run import CrawlRun
from app.models.raw_snapshot import RawSnapshot
from app.repositories.internship_repo import InternshipRepository


async def run_greenhouse_crawler(company_name: str, board_token: str) -> None:
    """Execute a standalone crawl run against a Greenhouse job board."""
    slug = board_token.lower()
    print(f"[*] Starting Greenhouse crawl for company '{company_name}' (board token: '{board_token}')...")

    async with async_session_factory() as session:
        # 1. Fetch or create Company record
        stmt = select(Company).where(Company.slug == slug)
        res = await session.execute(stmt)
        company = res.scalar_one_or_none()

        if not company:
            company = Company(
                id=uuid.uuid4(),
                name=company_name,
                slug=slug,
                ats_provider="greenhouse",
                ats_identifier=board_token,
                careers_url=f"https://boards.greenhouse.io/{board_token}",
            )
            session.add(company)
            await session.commit()
            print(f"[+] Created target company entry in database with ID: {company.id}")

        # 2. Initialize CrawlRun audit entry
        crawl_run = CrawlRun(
            adapter_name="greenhouse",
            status="running",
        )
        session.add(crawl_run)
        await session.commit()

        # 3. Initialize adapter and pipelines
        adapter = GreenhouseAdapter()
        normalizer = EntityNormalizer()
        repo = InternshipRepository(session)

        target = CompanyTarget(
            id=company.id,
            name=company.name,
            slug=company.slug,
            ats_identifier=board_token,
            careers_url=company.careers_url,
        )

        discovered = 0
        extracted = 0
        ingested = 0
        errors = 0

        try:
            async for raw_record in adapter.fetch_jobs(target):
                discovered += 1

                # Save raw snapshot
                snapshot = RawSnapshot(
                    crawl_run_id=crawl_run.id,
                    source_url=raw_record.source_url,
                    content_type=raw_record.content_type,
                    raw_payload=raw_record.raw_payload,
                    payload_hash=raw_record.payload_hash,
                )
                session.add(snapshot)
                await session.flush()

                # Parse job
                extracted_job = adapter.parse_job(raw_record)
                extracted += 1

                # Classify and normalize
                normalized_payload = normalizer.process(
                    extracted_job,
                    raw_snapshot_id=snapshot.id,
                )

                if normalized_payload is None:
                    # Filtered out (not an internship role)
                    continue

                # Upsert canonical internship
                await repo.upsert(normalized_payload)
                ingested += 1
                print(f"[+] Ingested verified internship: {normalized_payload.normalized_title} ({normalized_payload.location or 'Remote'})")

            # Finalize crawl run
            crawl_run.status = "completed"
            crawl_run.items_discovered = discovered
            crawl_run.items_extracted = extracted
            crawl_run.items_ingested = ingested
            crawl_run.errors_count = errors
            await session.commit()

            print("\n================== CRAWL SUMMARY ==================")
            print(f" Discovered Listings : {discovered}")
            print(f" Extracted Jobs      : {extracted}")
            print(f" Ingested Internships: {ingested}")
            print(f" Non-internships     : {extracted - ingested}")
            print(f" Status              : COMPLETED")
            print("===================================================\n")

        except Exception as e:
            await session.rollback()
            crawl_run.status = "failed"
            crawl_run.error_log = str(e)
            crawl_run.errors_count = errors + 1
            await session.commit()
            print(f"[!] Crawl failed with error: {e}", file=sys.stderr)
            raise
        finally:
            await adapter.close()


def main() -> None:
    parser = argparse.ArgumentParser(description="Run ATS crawler against a target board.")
    parser.add_argument("--adapter", default="greenhouse", choices=["greenhouse"], help="ATS adapter name")
    parser.add_argument("--company-name", default="Figma", help="Target company name")
    parser.add_argument("--board-token", default="figma", help="ATS board identifier/token")
    args = parser.parse_args()

    asyncio.run(run_greenhouse_crawler(args.company_name, args.board_token))


if __name__ == "__main__":
    main()
