# Roadmap vs. Build Spec Reconciliation

## Critical Question Resolution
**Decision: B. FINAL_BUILD_SPEC contains internal sections/subsystems that must be mapped into the locked roadmap.**

The `NEXTPHD_FINAL_BUILD_SPEC.md` uses the word "PHASE" in Section 53 ("BUILD ORDER") to describe granular *technical implementation steps* (e.g., "Phase 2 — OPENALEX PROFESSOR DISCOVERY", "Phase 3 — AI PROFESSOR FIT"). However, `docs/ROADMAP.md` uses "PHASE" to define broad *product capabilities* (e.g., "PHASE 3 — Professor + University Intelligence").

`docs/ROADMAP.md` is the authoritative execution timeline and phase definition. The `NEXTPHD_FINAL_BUILD_SPEC.md` sections must be executed to fulfill the requirements of the Roadmap phases, but they do not overwrite the names, scope, or definitions of the Roadmap phases.

## Reconciliation Matrix

| Locked Roadmap Phase | ROADMAP Definition | Relevant FINAL_BUILD_SPEC Sections | Requirements | Current Implementation | Status |
|---|---|---|---|---|---|
| **Phase 0** | Foundation & Recovery | # 53. PHASE 0 — RECONNAISSANCE | Inspect repo, confirm configs | Done | COMPLETE |
| **Phase 1** | Core Platform | # 54. PHASE 1 (DB + Security), # 61. PHASE 8 (Portal) | Schema, RLS, Auth, Dashboard Shell | Done | COMPLETE |
| **Phase 2** | Opportunity Intelligence | # 58. PHASE 5 (Ingestion), # 59. PHASE 6 (Gmail), # 60. PHASE 7 (Quick Add) | Official sources, deduplication, opportunity storage | Core pipeline built, DB stores opps | CERTIFIED |
| **Phase 3** | Professor + University Intelligence | # 55. PHASE 2 (OpenAlex Discovery), # 57. PHASE 4 (Official University Pages) | Universities, departments, professors, publications, official pages, favourites | Tables built, OpenAlex mapped, `university_monitor.py` built. MISSING: Professor projects, funding evidence, university departments. | NOT CERTIFIED |
| **Phase 4** | Personal Matching Intelligence | # 56. PHASE 3 (AI Professor Fit), # 62. PHASE 9 (Scoring) | Research profile matching, fit breakdown, opportunity fit, explainability | `matcher.py` outputs JSON, but ignores academic degree matching, university/country preferences. | NOT CERTIFIED |
| **Phase 5** | Research Intelligence | # 15. RESEARCH LEAD ENGINE | Research leads, emerging topics, research signals | `run_phase3_4.py` creates leads, DB has `research_signals`. | NOT STARTED |
| **Phase 6** | Application Management | # 24. PIPELINE | Kanban pipeline, tracking statuses | Schema constraints built, no UI workflow | NOT STARTED |
| **Phase 7** | Outreach / Mail Intelligence | # 25. DRAFTS | Draft tracking, responses, reminders | `outreach_drafts` schema built | NOT STARTED |
| **Phase 8** | Academic Portfolio | N/A (General Requirements) | CV, transcripts, SOP tracking | Unknown | NOT STARTED |
| **Phase 9** | Funding + Relocation | # 17. FUNDING CLASSIFICATION | Tracking stipend, visa, healthcare | Basic DB fields present | NOT STARTED |
| **Phase 10** | Automated Intelligence Cycle | # 27, # 28, # 29, # 38, # 63 | Daily workflow, monitoring, digest | None yet | NOT STARTED |
| **Phase 11** | Final Hardening | # 30, # 31, # 46, # 64 | Reliability, rate limiting, final cert | None yet | NOT STARTED |

## Current Implementation Classification

The recent changes made during the incorrect interpretation are classified as follows:
- **`matcher.py` improvements**: Useful shared infrastructure. Correctly belongs to **Phase 4** (Personal Matching Intelligence).
- **`run_phase3_4.py` changes**: Creates research leads. Correctly belongs to **Phase 5** (Research Intelligence). It was executed prematurely.
- **`university_monitor.py`**: Useful shared infrastructure. Correctly belongs to **Phase 2 / Phase 3** (Opportunity/University Intelligence).

## Current Status
1. **Phase 3**: NOT CERTIFIED (The original gap analysis remains valid).
2. **Phase 4**: NOT CERTIFIED (The original gap analysis remains valid).
3. **Phase 5**: NOT READY (Phases 3 and 4 must be certified first).
4. No actual implementation has started for Phase 5 workflows beyond the premature lead creation in the pipeline script.
