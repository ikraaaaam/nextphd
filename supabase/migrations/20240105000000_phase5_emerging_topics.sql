-- 20240105000000_phase5_emerging_topics.sql
create table emerging_topics (
    id uuid primary key default gen_random_uuid(),
    owner_id uuid not null references auth.users(id),
    topic text not null,
    recent_count int not null,
    baseline_count int not null,
    observation_windows jsonb,
    growth_measure float,
    minimum_evidence_count int,
    supporting_publication_ids text[],
    source_urls text[],
    evidence jsonb,
    detected_at timestamptz default now(),
    created_at timestamptz default now(),
    unique(owner_id, topic)
);

alter table emerging_topics enable row level security;

create policy "Users can select own emerging_topics"
    on emerging_topics for select
    using (auth.uid() = owner_id);

create policy "Users can insert own emerging_topics"
    on emerging_topics for insert
    with check (auth.uid() = owner_id);

create policy "Users can update own emerging_topics"
    on emerging_topics for update
    using (auth.uid() = owner_id);

create policy "Users can delete own emerging_topics"
    on emerging_topics for delete
    using (auth.uid() = owner_id);
