# Phase 5 Validation Report: Research Intelligence

## 1. Specification Review

| Requirement | Implementation | Status | Evidence |
|---|---|---|---|
| Research Leads Engine | Creates leads dynamically based on strict criteria: `fit_score >= 60` or `fit_score >= 40 AND >= 2 signals`. | PASS | `pipeline/research_engine.py` (line 74), `test_research_engine.py` |
| Research Signals | `PUBLICATION_ACTIVITY` created ONLY if $\ge$ 2 publications matching user topics were published in the last 18 months. | PASS | `research_engine.py` (line 39) explicit temporal query (`gte`). |
| Emerging Topics | Implemented deterministic evidence-based `EMERGING_TOPIC_CANDIDATE`. Requires $\ge$ 3 recent publications (last 12 mos) and `recent_count > baseline_count` (12-24 mos). Evaluated against locally ingested OpenAlex scholarly data without LLM hallucination. | PASS | `pipeline/research_engine.py` (line 71), `20240105000000_phase5_emerging_topics.sql`, and `test_research_engine.py` |
| Relevant Publications | `publications` table added. `OpenAlexConnector.fetch_recent_works()` fetches and stores papers with `openalex_id`, dates, and URLs. | PASS | `openalex_connector.py` (line 67), `20240104000000_phase5_publications.sql` |
| Research Activity | Activity signals strictly bounded by real temporal data (`publications.publication_date`, `professor_projects.start_date`/`updated_at`). | PASS | `pipeline/research_engine.py` |
| Research Relationships | Graph completed via direct Foreign Keys and schema matching: `publications` $\leftrightarrow$ `topics` $\leftrightarrow$ `professors` $\leftrightarrow$ `universities` $\leftrightarrow$ `opportunities`. | PASS | Schema migrations, `openalex_connector.py` |
| Provenance/Evidence | `research_signals` explicitly stores `source_url` and `signal_date`. Leads compile this evidence natively into JSON metadata. | PASS | `research_engine.py` signal upsert logic. |
| Deduplication | Natively handles duplicates via `unique(owner_id, openalex_id)` in publications and conditional update checks in `ResearchEngine`. | PASS | `research_engine.py` `_upsert_signal` |

## 2. Gap Remediation Details

- **Research Leads:** A lead is NO LONGER simply created because a professor exists. The `ResearchEngine.evaluate_research_leads()` logic enforces a strict scoring barrier, integrating the certified Phase 4 `DeterministicMatcher`.
- **Research Signals:** `PUBLICATION_ACTIVITY` no longer checks cumulative `works_count`. It executes a `gte` query against the new `publications` table to ensure the activity occurred in the last 18 months and overlaps with the user's topics.
- **Emerging Topics:** Added `emerging_topics` table. Pipeline calculates recent counts (last 12 mos) vs baseline counts (12-24 mos ago) using scholarly data. Detects candidates deterministically when `recent_count >= 3` and `recent_count > baseline_count`, avoiding LLM hallucinations and saving explicitly to `emerging_topics` table.
- **Relevant Publications:** OpenAlex metadata is now explicitly persisted to the database via `pipeline/run_phase5.py`, maintaining stable identifiers (`openalex_id`).

## 3. Test Coverage
- Database: `supabase test db` (38 passing tests - includes Phase 1, Phase 3 remediation schemas, Phase 5 schemas)
- Python Unit Tests: `python -m unittest discover` (25 passing tests including new `test_research_engine.py` cases verifying strict emerging topic candidates and signal creation)
- NextJS Dashboard: `npm run build` compiled successfully without regression.

## 4. Final Status
**CERTIFIED**
All Phase 5 requirements, including the remediation of the Emerging Topics definition, are now successfully implemented with deterministic rules and tests.
