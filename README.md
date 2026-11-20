# NEXTPHD

A personal PhD Research & Opportunity Intelligence System.

It continuously collects, organises, verifies, enriches and prioritises PhD opportunities, research leads and signals, professor and university information, deadlines, funding and application tasks — built for high recall, high precision and source traceability, with a target daily workflow of 5–10 minutes.

## Layout

- `portal/` — Next.js + Supabase web portal (the main way to use the system). Run it with `npm run dev`.
- `pipeline/` — Python intelligence cycle: OpenAlex connector, research engine, matching, scheduling and tests.
- `supabase/` — Database schema, migrations, seed data and tests.
- `docs/` — Project context, product requirements, architecture and phase reports.

See `docs/00-PROJECT-CONTEXT.md` for project context and the main product principles.
