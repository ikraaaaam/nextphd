# NEXTPHD Security Foundation (Phase 1)

This project heavily leverages Supabase for both Identity and Database protection.

## Row Level Security (RLS)
The database enforces explicit RLS. Because this is a personal system, all operational data tables strictly check that data modifications and views are isolated to the authenticated user.

Example policy pattern used across all tables:
```sql
create policy "View own <table_name>" on <table_name> for select using (auth.uid() = owner_id);
create policy "Insert own <table_name>" on <table_name> for insert with check (auth.uid() = owner_id);
```

## Supported Constraints
- Specific verification checks prevent unknown verification states.
- Status checks enforce correct pipeline flows (`NEW`, `VERIFY`, `APPLIED`, etc).
- Unique combinations (e.g. `owner_id` + `hash` for opportunities) prevent deduplication logic failures.

## Secrets Management
- `.env` files are fully excluded via `.gitignore`.
- `.env.example` provides placeholders for `SUPABASE_SERVICE_KEY`, `ANTHROPIC_API_KEY`, etc.
- No frontend keys exist that can expose internal workflows.
