# Phase 1 — Database + Security

## Objective
Build ONLY the database and security foundation based on the authoritative NEXTPHD build specification, using a local Supabase workflow with migrations, seeds, and strict Row Level Security (RLS) enforcement.

## Architecture
- PostgreSQL 15+ (via local Supabase Docker)
- Local Supabase Auth and RLS
- All schema changes managed via declarative SQL migrations
- Initial reproducible deterministic data via seed script

## Database Model
Implemented 12 core tables:
- `settings`
- `sources`
- `universities`
- `professors`
- `opportunities`
- `source_documents`
- `research_leads`
- `research_signals`
- `digests`
- `outreach_drafts`
- `application_tasks`
- `run_log`

## Ownership Model
Because this is a personal single-user system that requires strict security boundaries, the `owner_id` column is added to all core tables. The `owner_id` references `auth.users(id)`. This explicit ownership architecture enables clean and foolproof RLS policies.

## Authentication
- Supabase local auth emulator is active.
- A deterministic test user (`test@nextphd.local`) was created in `seed.sql` to own test data.
- Service Role keys are secured in `.env` and kept out of Git.

## RLS
Row Level Security is enabled on all 12 core user-owned tables. Strict RLS policies restrict operations (`SELECT`, `INSERT`, `UPDATE`, `DELETE`) only to records where `owner_id = auth.uid()`.

## Migrations
Created `0001_initial_schema.sql` handling table creation, constraint checks, and RLS policies.

## Constraints
Enforced check constraints for known statuses:
- `opportunities.status` in `NEW`, `SAVED`, `VERIFY`, `CONTACTED`, `RESPONSE_RECEIVED`, `APPLICATION_PREPARING`, `APPLIED`, `INTERVIEW`, `OFFER`, `REJECTED`, `IGNORED`.
- `opportunities.verification` in `UNVERIFIED`, `NEEDS_VERIFICATION`, `VERIFIED_OFFICIAL`, `EXPIRED`, `CLOSED`.
Enforced unqiue constraints:
- `opportunities.hash`
- `professors.openalex_author_id` (per owner)
- `universities.name` (per owner)
- `digests.day` (per owner)
- `settings.owner_id`

## Indexes
Created indexes on commonly queried fields:
- `opportunities(hash)`
- `opportunities(status)`
- `professors(university_id)`
- `research_leads(professor_id)`

## Seed Data
Provided deterministic seed data for a test user (`test@nextphd.local`) in `seed.sql`. Includes required test universities: MBZUAI, KFUPM, KAUST, GIST, DGIST, UNIST, KAIST, Monash Malaysia, UTM.

## Tests
Created comprehensive PostgreSQL testing via pgTAP for:
1. RLS enforcement (owner visibility)
2. Schema existence
3. Constraints and data validations
4. Anonymous blocking
5. Seed data integrity

## Security Tests
Tests verified:
- RLS enabled across all tables
- User A can read/update own data
- User A cannot read/update User B's data
- Anonymous access is denied
- Service-role boundary remains uncompromised

## Clean Rebuild Test
Confirmed `supabase db reset` functions correctly. Clean rebuild passes end-to-end.

## Deviations
None.

## Risks
None at this stage.

## Remaining Issues
None.

## Files Created
- `supabase/config.toml`
- `supabase/migrations/20240101000000_initial_schema.sql`
- `supabase/seed.sql`
- `.env.example`
- `PHASE-1-DB-SECURITY.md`
- `supabase/tests/database/01_schema_test.sql`
- `supabase/tests/database/02_security_test.sql`

## Files Modified
- `docs/03-DATA-MODEL.md`
- `docs/06-SECURITY.md`

## Git Commit
Commit contains all tracked updates per spec requirements without exposing any keys.

## Final Status
COMPLETE
