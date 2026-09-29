# NEXTPHD Database Model (Phase 1)

The system uses a Supabase PostgreSQL database managed through declarative migrations. It implements a user-owned model where all operational tables include an `owner_id` (referencing `auth.users(id)`) for Row Level Security (RLS).

## 1. settings
Stores user preferences for parsing, tracking, and fit calculation.
- `countries`: text[]
- `subjects`: text[]
- `min_score`: int
- `owner_id`: uuid

## 2. universities
Stores verified institution details.
- `name`: text
- `country`: text
- `funding_model`: text
- `owner_id`: uuid

## 3. professors
Stores details of potential supervisors and research leads.
- `openalex_author_id`: text
- `fit_score`: int
- `monitoring_enabled`: boolean
- `owner_id`: uuid

## 4. opportunities
Core table tracking specific PhD vacancies or admissions opportunities.
- `hash`: unique hash for deduplication
- `title`, `deadline`, `fit_score`, `status`, `verification`
- `owner_id`: uuid

## 5. sources
Tracks data extraction sources.
- `name`: text
- `source_type`: text
- `compliance_status`: text
- `owner_id`: uuid

## 6. source_documents
Raw data ingested from sources.
- `owner_id`: uuid

## 7. research_leads & research_signals
Monitor changes in research domains and track signals (new grants, publications).
- `owner_id`: uuid

## 8. digests
Daily AI-generated summaries.
- `owner_id`: uuid

## 9. outreach_drafts & application_tasks
Tracks manual interactions and progress tracking.
- `owner_id`: uuid

## 10. run_log
Background job execution history.
- `owner_id`: uuid
