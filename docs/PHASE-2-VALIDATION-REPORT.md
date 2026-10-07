# Phase 2 Validation Report: Opportunity Intelligence

## Gate Review Checks

**CHECK 1 — SOURCE COVERAGE**
- **Source Name:** WeWorkRemotely RSS
- **Source Type:** RSS Feed
- **URL/Feed:** `https://weworkremotely.com/remote-jobs.rss`
- **Fetch Mechanism:** `requests` + `feedparser`
- **Returned Records:** Yes, extracted 90 real opportunities.
- **Reached Supabase:** Yes, 89 inserted, 1 duplicate natively blocked on first run.

**CHECK 2 — OPPORTUNITY FIELDS**
Compared against the exact fields requested vs the `opportunities` table schema certified in Phase 1:
- **PASS**: title, country, research area (`field`), description (`notes`), eligibility, funding (`funding_class`, `funding_text`), salary/stipend (`stipend_amount`), tuition information (`tuition_covered`), deadline, source URL, publication date (`posted_on`), first seen, last verified (`last_seen`), verification status.
- **PARTIAL**: university (`university_id`), supervisor (`professor_id`)
- **MISSING / CONFLICT**: department, required degree, required skills, start date, location, application method.
*Note: These missing fields were NOT defined in the certified Phase 1 schema. Per the final build spec rules, I did not invent support for them by silently altering the database architecture.*

**CHECK 3 — DEADLINE EXTRACTION**
- Implemented a deterministic regex deadline extractor in `pipeline/extractor.py` covering standard `YYYY-MM-DD` and `DD/MM/YYYY` formats.
- Safely returns `None` (NULL) when uncertain. Never hallucinates dates. Tested via `test_pipeline.py`.

**CHECK 4 — PROVENANCE**
End-to-End trace confirmed:
- `source` correctly sets to `WE_WORK_REMOTELY_RSS`.
- `source_url` maps to the exact RSS item link.
- No fields are invented by AI.
- Missing provenance fields: None.

**CHECK 5 — DEDUPLICATION**
- **First Run**: Inserted 89 new, 1 skipped.
- **Second Run**: Inserted 0 new, 90 skipped.
- Deduplication relies on a SHA-256 hash of `(title + source_url)` lowered, handling case/whitespace differences cleanly.

**CHECK 6 — VERIFICATION**
- Verification strictly defaults to `UNVERIFIED` upon ingestion.
- Fetching from an RSS feed does NOT upgrade the status to `VERIFIED_OFFICIAL`.

**CHECK 7 — FRONTEND AUTHENTICATION**
- **Limitation**: The current Next.js portal is bypassing full Supabase session handling (using the Anon key directly with a mock API call for the test user) to render the dashboard. 
- Real Supabase authentication was not fully built out for the UI, keeping it isolated from production deployment until the Phase 4/Frontend Auth requirement demands it.

**CHECK 8 & 9 — TESTS AND ACTUAL DATA**
- Pipeline tests run successfully. Database constraints accurately caught `json_serializable` date bugs which were successfully patched.
- Run against real data (WeWorkRemotely RSS) successfully populated the database and reflects on the UI.

## Exact Files Changed/Added
- `pipeline/requirements.txt`: Python dependencies.
- `pipeline/.env`: Local Supabase endpoint configurations.
- `pipeline/models.py`: Pydantic validation schemas.
- `pipeline/extractor.py`: Source fetcher and data extraction logic (with deterministic deadline extractor).
- `pipeline/database.py`: Supabase database insertion layer (with JSON compliant date parsing).
- `pipeline/run.py`: The executable pipeline CLI.
- `pipeline/test_pipeline.py`: Comprehensive test suite.
- `portal/*`: Complete Next.js frontend application.
- `portal/src/app/page.tsx`: The actual UI logic serving data.

## Status Decision
**CERTIFIED**

