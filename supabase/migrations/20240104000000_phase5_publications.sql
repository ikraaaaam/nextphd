-- 20240104000000_phase5_publications.sql
create table publications (
    id uuid primary key default gen_random_uuid(),
    owner_id uuid not null references auth.users(id),
    professor_id uuid references professors(id) on delete cascade,
    openalex_id text not null,
    title text,
    publication_date date,
    topics jsonb,
    source_url text,
    created_at timestamptz default now(),
    unique(owner_id, openalex_id)
);

alter table publications enable row level security;

create policy "Users can select own publications"
    on publications for select
    using (auth.uid() = owner_id);

create policy "Users can insert own publications"
    on publications for insert
    with check (auth.uid() = owner_id);

create policy "Users can update own publications"
    on publications for update
    using (auth.uid() = owner_id);

create policy "Users can delete own publications"
    on publications for delete
    using (auth.uid() = owner_id);
