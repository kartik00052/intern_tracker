# Internship Intelligence Engine
> High-throughput, ethical, internet-wide internship discovery and aggregation platform.

[![Python Version](https://img.shields.io/badge/python-3.12-blue.svg)](https://www.python.org/downloads/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115+-009688.svg)](https://fastapi.tiangolo.com)
[![SQLAlchemy](https://img.shields.io/badge/SQLAlchemy-2.0+-red.svg)](https://www.sqlalchemy.org/)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)

---

## 1. Problem Statement
Internship discovery across the internet is highly fragmented, stale, and polluted with low-quality aggregations. Existing job aggregators suffer from:
1. **Stale Listings & Ghost Jobs**: Links remain active on boards weeks after the ATS posting is closed.
2. **Missing Provenance**: Aggregators obscure the origin URL, canonical ATS link, and discovery timestamp.
3. **Data Pollution & Hallucinated Attributes**: Heuristic or LLM-driven parsers invent salaries, deadlines, and requirements.
4. **Duplicate Spam**: The same role cross-posted on LinkedIn, Indeed, and company boards appears multiple times under slightly different titles.

**Internship Intelligence Engine** solves this by operating as an automated, verifiable discovery-to-publish data engine that interacts directly with company ATS endpoints, normalizes and dedupes opportunities deterministically, enforces strict provenance tracking, and continually verifies link health.

---

## 2. Key Features
- **Deterministic Multi-Stage Pipeline**: Strict 6-stage lifecycle: `Discover` → `Crawl` → `Extract` → `Normalize` → `Verify` → `Publish`.
- **ATS-First Ingestion**: Dedicated adapters for primary applicant tracking systems (Greenhouse, Lever, Ashby, SmartRecruiters) and generic semantic extraction.
- **Layered Fallback Extraction**: Official JSON APIs → JSON-LD schema.org → Semantic static HTML (selectolax/lxml) → Headless browser (Playwright) only when JavaScript execution is strictly required.
- **Separation of Concerns**: Canonical `internships` entities are strictly decoupled from `source_records` (provenance URLs) and immutable `raw_snapshots`.
- **Zero-Hallucination Integrity**: Strict rule: if stipend, deadline, or experience criteria are not explicitly present, they remain `null`.
- **Multi-Vector Deduplication**: Exact ATS identifier matching, normalized application URL hashing, content hashing (SHA-256), and fuzzy string matching (RapidFuzz token sort ratio).
- **Proactive Link Health Verification**: Automated head/get checks identifying 404s, redirected listings, and closed application forms.
- **Async API & Search**: FastAPI backend powered by SQLAlchemy 2.0 async-ready query layer with PostgreSQL full-text search and faceted filters.

---

## 3. High-Level Architecture

```mermaid
flowchart TD
    subgraph Discovery ["1. Company & Target Discovery"]
        CD[Company Discovery Engine] --> DB_C[(Companies Registry)]
        ATSD[ATS Fingerprinter] --> DB_C
    end

    subgraph Ingestion ["2. Crawl & Ingestion"]
        DB_C --> CM[Crawler Manager]
        CM --> GH[Greenhouse Adapter]
        CM --> LV[Lever Adapter]
        CM --> AS[Ashby Adapter]
        CM --> GC[Generic Web Adapter]
    end

    subgraph Processing ["3. Extraction & Normalization"]
        GH & LV & AS & GC --> RS[Raw Snapshot Store]
        RS --> EXT[Layered Extractor]
        EXT --> CLS[Rule-Based Classifier]
        CLS -->|Internship Confirmed| NORM[Entity Normalizer]
        CLS -->|Not an Internship| DROP[Discarded]
        NORM --> DEDUP[Deduplication Engine]
    end

    subgraph Persistence ["4. Storage & Verification"]
        DEDUP --> DB_I[(Internships Canonical)]
        DEDUP --> DB_S[(Source Records & Provenance)]
        LC[Link Checker Worker] -->|Verify HTTP Status| DB_S
        LC -->|Update Status| DB_I
    end

    subgraph Delivery ["5. Query & Consumer Layer"]
        DB_I --> API[FastAPI Backend]
        API --> FE[Vite + React + Tailwind Frontend]
    end
```

---

## 4. Tech Stack

| Domain | Technology | Purpose |
| :--- | :--- | :--- |
| **Backend Core** | Python 3.12 | Modern runtime with high-performance typing & asyncio |
| **API Framework** | FastAPI | High-speed async web API with automatic OpenAPI generation |
| **Data Validation** | Pydantic v2 | High-performance schema validation, serialization, settings |
| **ORM & Database** | SQLAlchemy 2.0 + Alembic | Async-ready typed ORM, schema versioning, migration management |
| **Primary Database**| PostgreSQL (Supabase compatible) | Relational persistence, JSONB support, GIN full-text search |
| **HTTP & Networking**| HTTPX + Tenacity | Async HTTP client with backoff retries and connection pooling |
| **HTML / Scraping** | selectolax + lxml + BeautifulSoup4 | Fast Modest-engine HTML parsing and resilient DOM navigation |
| **Headless Fallback**| Playwright | Headless browser for JavaScript-heavy dynamic career sites |
| **Text & Normalization**| ftfy + RapidFuzz + dateparser | Unicode repair, fuzzy string deduplication, date resolution |
| **Task Scheduling** | APScheduler / GitHub Actions | Local scheduled runs and automated cloud workflows |
| **Package Manager** | uv | Ultra-fast Rust-based Python package and virtualenv manager |
| **Frontend** | React + TypeScript + Vite + Tailwind | Modern responsive user dashboard and faceted search interface |

---

## 5. Folder Structure

```text
internship-intelligence/
├── .github/
│   └── workflows/              # GitHub Actions CI and crawl workflows
├── backend/
│   ├── alembic/                # Database migration scripts
│   │   ├── versions/           # Migration versions
│   │   └── env.py              # Alembic environment runner
│   ├── app/
│   │   ├── api/
│   │   │   ├── dependencies/   # FastAPI route dependency injections (DB session, auth)
│   │   │   ├── middleware/     # Request logging, rate limits, CORS middleware
│   │   │   └── routes/         # API endpoint routers (health, internships, companies)
│   │   ├── core/               # Configuration settings and logging setup
│   │   ├── crawler/
│   │   │   ├── discovery/      # Company and ATS detection logic
│   │   │   ├── engine/         # Crawl runner, downloaders, local scheduler
│   │   │   ├── pipelines/      # Classification, extraction, normalization, dedup
│   │   │   └── spiders/        # Source adapters (base, greenhouse, lever, ashby)
│   │   ├── db/                 # Base model declarations and engine sessions
│   │   ├── models/             # SQLAlchemy 2.0 ORM models
│   │   ├── repositories/       # Data access repositories and query builders
│   │   ├── schemas/            # Pydantic v2 request/response schemas
│   │   ├── services/           # Ingestion and verification services
│   │   ├── tasks/              # Scheduled job tasks
│   │   ├── utils/              # Text formatting, URL cleaners, hashing utilities
│   │   └── main.py             # FastAPI entrypoint and application factory
│   ├── data/                   # Seed companies and local testing artifacts
│   ├── scripts/                # Standalone CLI tools and crawler execution scripts
│   ├── tests/                  # Pytest suite (unit, integration, fixtures)
│   ├── alembic.ini             # Alembic configuration
│   ├── pyproject.toml          # uv project dependencies and tool configs
│   └── .env.example            # Backend environment template
├── docker/                     # Dockerfile and compose configurations
├── docs/                       # Architecture diagrams and system documentation
├── frontend/                   # React + TypeScript + Vite frontend client
├── .gitignore
└── README.md
```

---

## 6. Database Schema Overview

The database design strictly decouples canonical opportunities from source links and raw payloads:

1. **`companies`**: Master directory of tracked employers, their primary domains, careers pages, and ATS identifiers.
2. **`internships`**: The single canonical representation of a unique internship opening with normalized titles, structured locations, verified status, and optional compensation.
3. **`source_records`**: Provenance tracking mapping one canonical internship to multiple discovery endpoints, recording ATS job IDs, application URLs, and explicit field provenance.
4. **`raw_snapshots`**: Immutable store of raw API responses or HTML snapshots, supporting auditability, historical diffs, and re-extraction without recrawling.
5. **`crawl_runs`**: Execution log capturing timestamps, status, discovered volume, and error diagnostics per crawl invocation.
6. **`link_checks`**: Verification audit trail tracking HTTP response codes, latency, and redirect targets to detect expired postings.

---

## 7. Source Adapter Design

All ATS and web extractors implement the abstract contract defined in `app/crawler/spiders/base.py`:

```python
class BaseSourceAdapter(ABC):
    ats_name: str

    @abstractmethod
    async def discover_jobs(self, company: CompanyTarget) -> AsyncGenerator[RawJobRecord, None]:
        """Fetch raw listings from the ATS API or web endpoint."""
        pass

    @abstractmethod
    def parse_job(self, raw_record: RawJobRecord) -> ExtractedJob:
        """Extract structured attributes from raw payload."""
        pass
```

### Adapter Lifecycle
1. **Target Evaluation**: Checks robots.txt compliance and rate-limit budgets.
2. **Layered Fetch**: Tries direct public APIs (e.g. `boards-api.greenhouse.io/v1/boards/{board_token}/jobs?content=true`). Falls back to structured HTML or Playwright only when necessary.
3. **Raw Capture**: Preserves full un-parsed payload into `RawJobRecord`.
4. **Field Extraction**: Maps external schemas into `ExtractedJob` using explicit rules. Missing values are left `None`.

---

## 8. Crawl Scheduling Table

| Target Tier | Source Type | Frequency | Concurrency | Retry / Backoff Strategy |
| :--- | :--- | :--- | :--- | :--- |
| **Tier 1 (High Volume)** | Greenhouse, Lever public APIs | Every 6 hours | 5 req/sec per domain | Exponential backoff (2s, 4s, 8s, max 3) |
| **Tier 2 (Medium Volume)**| Ashby, SmartRecruiters APIs | Every 12 hours | 3 req/sec per domain | Exponential backoff (3s, 6s, 12s, max 3)|
| **Tier 3 (Generic Web)** | Static Career Pages (JSON-LD) | Every 24 hours | 1 req/sec per domain | Tenacity linear backoff (5s, max 2) |
| **Tier 4 (JS-Heavy Web)** | Dynamic Career Pages (Playwright) | Every 48 hours | 1 worker at a time | Staggered 10s delay, max 1 retry |
| **Verification Worker** | Active canonical links (`HEAD`) | Daily (24h) | 10 async connections| Status 404/410 flags record unverified |

---

## 9. API Endpoint List

| Method | Endpoint | Description | Query Parameters / Body |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/health` | Service health status and database connectivity | None |
| `GET` | `/api/v1/internships` | Search and filter canonical internships | `q`, `location`, `remote`, `country`, `stipend`, `posted_after`, `page`, `page_size` |
| `GET` | `/api/v1/internships/{id}` | Retrieve specific internship with full provenance | `id` (UUID path parameter) |
| `GET` | `/api/v1/companies` | List tracked companies and their ATS providers | `page`, `page_size`, `ats_provider` |
| `GET` | `/api/v1/companies/{id}` | Retrieve company details and active listings | `id` (UUID path parameter) |

---

## 10. Local Setup (uv + PowerShell)

### Prerequisites
- Python 3.12+
- `uv` installed (`powershell -ExecutionPolicy ByPass -c "irm https://astral.sh/uv/install.ps1 | iex"`)
- Node.js 20+ & npm (for frontend in later phases)
- PostgreSQL database instance (local or Supabase connection string)

### PowerShell Step-by-Step Setup

```powershell
# 1. Clone repository and navigate to backend
cd c:\Users\karti\Downloads\Cipher-coding\internship-intelligence\backend

# 2. Synchronize Python virtual environment and dependencies via uv
uv sync

# 3. Create .env file from template
Copy-Item .env.example .env

# 4. Run database migrations with Alembic
uv run alembic upgrade head

# 5. Run the Greenhouse crawler for a test target
uv run python scripts/run_crawler.py --adapter greenhouse --company-name "Figma" --board-token "figma"

# 6. Start the FastAPI development server
uv run uvicorn app.main:app --reload --host 127.0.0.1 --port 8000

# 7. In another PowerShell terminal, query the API health and internships
Invoke-RestMethod -Uri "http://127.0.0.1:8000/api/v1/health"
Invoke-RestMethod -Uri "http://127.0.0.1:8000/api/v1/internships"
```

---

## 11. Environment Variables

Template provided in `backend/.env.example`:

| Variable | Required | Default / Example | Purpose |
| :--- | :---: | :--- | :--- |
| `ENVIRONMENT` | No | `development` | Runtime environment (`development`, `staging`, `production`) |
| `DATABASE_URL` | Yes | `postgresql+psycopg://postgres:postgres@localhost:5432/internships` | Database connection string with async psycopg3 driver |
| `CRAWLER_USER_AGENT` | Yes | `InternshipIntelBot/1.0 (+https://github.com/internship-intel; contact@example.com)` | Identifying bot user agent identifying the crawler |
| `CRAWLER_REQUEST_TIMEOUT_SECONDS` | No | `20.0` | Timeout per external HTTP request |
| `CRAWLER_MAX_CONCURRENCY` | No | `5` | Maximum concurrent requests per domain adapter |
| `CORS_ORIGINS` | No | `["http://localhost:5173", "http://127.0.0.1:5173"]` | Allowed frontend origins for CORS |
| `LOG_LEVEL` | No | `INFO` | Console log verbosity (`DEBUG`, `INFO`, `WARNING`, `ERROR`) |

---

## 12. Roadmap (12 Phases)

```mermaid
flowchart LR
    P1[Phase 1: Core Engine & Greenhouse] --> P2[Phase 2: Lever & Ashby Adapters]
    P2 --> P3[Phase 3: SmartRecruiters & Generic JSON-LD]
    P3 --> P4[Phase 4: Playwright JS Fallback]
    P4 --> P5[Phase 5: Automated Company Discovery]
    P5 --> P6[Phase 6: Verification & Dead Link Daemon]
    P6 --> P7[Phase 7: PostgreSQL Full-Text & Faceting]
    P7 --> P8[Phase 8: Vite React Dashboard]
    P8 --> P9[Phase 9: ARQ + Redis Distributed Worker]
    P9 --> P10[Phase 10: Email & Webhook Alerts]
    P10 --> P11[Phase 11: Community Contributions & Edits]
    P11 --> P12[Phase 12: Analytics & Market Intelligence]
```

- **Phase 1 (Current)**: Core DB schema, BaseSourceAdapter, Greenhouse API adapter, classification & dedup pipeline, FastAPI backend, test suite.
- **Phase 2**: Lever and Ashby public API adapters; batch ingester.
- **Phase 3**: SmartRecruiters API adapter and schema.org JSON-LD web scraper.
- **Phase 4**: Playwright headless browser fallback for single-page applications (Workday/custom portals).
- **Phase 5**: Automated company discovery engine via domain scraping and ATS fingerprinter.
- **Phase 6**: Link health verification daemon tracking 404s and expired postings.
- **Phase 7**: Advanced PostgreSQL full-text search (tsvector/GIN) with faceted filters.
- **Phase 8**: Production React + TypeScript + Tailwind web interface on Vercel.
- **Phase 9**: Distributed queue scaling via ARQ + Redis workers.
- **Phase 10**: User notification alerts via email and Discord/Slack webhooks.
- **Phase 11**: Community verification, reporting, and contribution tools.
- **Phase 12**: Internship market compensation trends and hiring cycle analytics.

---

## 13. Ethical Crawling Policy
This project prioritizes ethical data access and transparent web citizenship:
1. **Robots.txt Adherence**: All adapters strictly verify and obey `robots.txt` disallow clauses before initiating crawls.
2. **Polite Request Rates**: Defaults to a strict 1–5 requests per second per domain rate limit with randomized jitter.
3. **Honest User-Agent**: Every request sends a distinct `InternshipIntelBot` User-Agent containing repository links and contact emails.
4. **No Auth or Security Bypasses**: The engine never circumvents login paywalls, CAPTCHAs, Cloudflare protections, or private interfaces.
5. **API-First Priority**: Always attempts official public read-only career endpoints before fetching HTML pages.
6. **Takedown & Opt-Out Support**: Employers can submit a simple request to exclude their career listings from aggregation.

---

## 14. Contributing
1. Fork the repository and create your feature branch: `git checkout -b feature/lever-adapter`.
2. Ensure dependencies are synchronized: `uv sync --dev`.
3. Format and lint: `uv run ruff check .` and `uv run ruff format .`.
4. Run tests: `uv run pytest`.
5. Open a Pull Request with a clear description of changes.

---

## 15. License
Distributed under the MIT License. See [LICENSE](LICENSE) for details.
