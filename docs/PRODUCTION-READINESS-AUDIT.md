# NEXTPHD Production Readiness Audit

**Date:** 2026-10-06

## 1. What Already Works
- **Database Schema:** Fully modeled and tested (95/95 passing) through `supabase/migrations`.
- **Security Foundation:** Row Level Security (RLS) policies are correctly configured in SQL to isolate data by `owner_id = auth.uid()`.
- **Intelligence Cycle Pipeline:** The core Python modules (`database.py`, `intelligence_cycle.py`, etc.) properly execute the 3-segment logic (Discovery, Verification, Digest).
- **Idempotency & Deduplication:** The pipeline safely handles partial failures, limits retries, and avoids re-processing existing unchanged records.
- **Frontend Dashboard:** A basic Next.js UI is built (`portal/src/app/page.tsx`) to display the data, including matches, deadlines, and the daily digest.

## 2. What Is Local-Only (Test Bypasses)
- **Pipeline Hardcoded Auth:** `pipeline/database.py` and `pipeline/intelligence_cycle.py` currently hardcode `TEST_OWNER_ID = "11111111-1111-1111-1111-111111111111"`. The pipeline forces all data to belong to this one test user.
- **Frontend Data Fetching:** `portal/src/app/page.tsx` uses a simple `fetch` with the `NEXT_PUBLIC_SUPABASE_ANON_KEY`. Since there is no actual logged-in user passing a JWT, `auth.uid()` evaluates to null in the database. Real RLS will block all reads.
- **Database Instance:** Currently relies entirely on `npx supabase start` for a local Docker container.
- **Dummy Scheduler:** `pipeline/scheduler.py` uses a `DummyScheduler` that runs once and exits, only checking if the current minute matches the user's config.

## 3. What Is Missing for Production
- **Real User Authentication:** The Next.js frontend has no login/logout flow and no `@supabase/supabase-js` or `@supabase/ssr` installed to handle secure sessions.
- **Dynamic User Iteration in Pipeline:** The backend pipeline must be modified to query all active users (from `settings` or `profiles`) and execute the intelligence cycle for each of them, rather than a single hardcoded ID.
- **Production Supabase Project:** Needs to be created, and migrations must be pushed to it.
- **GitHub Actions Workflows:** Need `.github/workflows/` files to replace the local `DummyScheduler` and execute the pipeline on a real cron schedule.

## 4. Exact Deployment Dependencies
- **Frontend:** Next.js (currently 16.3.8). Needs `@supabase/supabase-js` and potentially `@supabase/ssr` for auth.
- **Backend/Pipeline:** Python 3.11 with `supabase`, `requests`, `beautifulsoup4`, `feedparser`, `pydantic`.
- **Database:** Supabase Free Tier.
- **CI/CD:** GitHub Actions (Free).

## 5. Exact Environment Variables Required
**Frontend (Vercel or equivalent):**
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

**Backend (GitHub Actions):**
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY` (Required for the pipeline to insert data and bypass RLS to run cycles for all users)

## 6. Real Authentication Status
**NO.** The current Next.js application does not have real authentication. It lacks login pages, session management, and JWT passing. It relies on the local Supabase instance's permissive setup or broken data reads.

## 7. Remote Scheduler Execution
**YES, BUT NEEDS ADAPTATION.** `scheduler.py` in its current form is useless for remote execution. However, GitHub Actions can easily run the pipeline. We will need to adapt the entry point (`intelligence_cycle.py` or a new `run_all.py`) to query all users and execute the cycle for them, triggered by a GitHub Actions `schedule` (cron).

## 8. Can Pipeline Run from GitHub Actions?
**YES.** The Python pipeline is fully decoupled from the frontend. It can run in any environment with Python and the required `requirements.txt` installed, provided it has the `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`.

## 9. Blockers to Immediate Deployment
1. **Hardcoded Test User:** Must be removed from `database.py` and `intelligence_cycle.py`.
2. **Missing Frontend Auth:** Must implement Supabase Auth in Next.js so users can log in and view their isolated data securely.
3. **Pipeline Multi-User Support:** The pipeline must dynamically fetch all users who need a cycle run, rather than defaulting to the test user.
