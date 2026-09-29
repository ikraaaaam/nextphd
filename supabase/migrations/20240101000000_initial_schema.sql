-- Phase 1: Database + Security Foundation

-- 1. settings
create table settings (
    id uuid primary key default gen_random_uuid(),
    owner_id uuid not null references auth.users(id),
    countries text[] default '{}',
    subjects text[] default '{}',
    keywords text[] default '{}',
    exclude_keywords text[] default '{}',
    min_score int default 60,
    profile_summary text,
    updated_at timestamptz default now(),
    unique(owner_id)
);

-- 2. sources
create table sources (
    id uuid primary key default gen_random_uuid(),
    owner_id uuid not null references auth.users(id),
    name text not null,
    source_type text not null,
    base_url text,
    enabled boolean default true,
    access_method text,
    compliance_status text,
    last_run_at timestamptz,
    last_run_ok boolean,
    items_found_30d int default 0,
    items_shortlisted_30d int default 0,
    items_verified_30d int default 0,
    notes text,
    created_at timestamptz default now()
);

-- 3. universities
create table universities (
    id uuid primary key default gen_random_uuid(),
    owner_id uuid not null references auth.users(id),
    name text not null,
    country text,
    city text,
    openalex_id text,
    website text,
    grad_admissions_url text,
    funding_model text,
    stipend_note text,
    gpa_note text,
    family_note text,
    muslim_env_note text,
    verified boolean default false,
    verified_on date,
    source_url text,
    works_count int,
    cited_by_count int,
    updated_at timestamptz default now(),
    unique(owner_id, name)
);

-- 4. professors
create table professors (
    id uuid primary key default gen_random_uuid(),
    owner_id uuid not null references auth.users(id),
    name text not null,
    university_id uuid references universities(id) on delete cascade,
    openalex_author_id text,
    homepage text,
    email_public text,
    h_index int,
    works_count int,
    cited_by_count int,
    recent_topics text[],
    recent_papers jsonb,
    intl_student_signal text,
    recruiting_signal text default 'none',
    fit_score int,
    fit_breakdown jsonb,
    fit_reason text,
    priority text,
    monitoring_enabled boolean default false,
    updated_at timestamptz default now(),
    unique(owner_id, openalex_author_id)
);

-- 5. opportunities
create table opportunities (
    id uuid primary key default gen_random_uuid(),
    owner_id uuid not null references auth.users(id),
    hash text not null,
    title text,
    university_id uuid references universities(id) on delete cascade,
    professor_id uuid references professors(id) on delete set null,
    country text,
    field text,
    source text,
    source_id uuid references sources(id) on delete set null,
    source_url text,
    official_url text,
    posted_on date,
    deadline date,
    rolling_admission boolean default false,
    funding_text text,
    stipend_amount text,
    tuition_covered boolean,
    funding_class text,
    eligibility text,
    english_req text,
    dependents_note text,
    fit_score int,
    fit_breakdown jsonb,
    fit_reason text,
    verification text default 'UNVERIFIED',
    status text default 'NEW',
    notes text,
    first_seen timestamptz default now(),
    last_seen timestamptz default now(),
    last_changed timestamptz,
    unique(owner_id, hash)
);

-- 6. source_documents
create table source_documents (
    id uuid primary key default gen_random_uuid(),
    owner_id uuid not null references auth.users(id),
    source_id uuid references sources(id) on delete cascade,
    external_url text,
    title text,
    retrieved_at timestamptz default now(),
    published_at timestamptz,
    content_hash text,
    raw_text text,
    content_type text,
    extraction_status text
);

-- 7. research_leads
create table research_leads (
    id uuid primary key default gen_random_uuid(),
    owner_id uuid not null references auth.users(id),
    professor_id uuid references professors(id) on delete cascade,
    university_id uuid references universities(id) on delete cascade,
    lead_type text,
    title text,
    description text,
    evidence jsonb,
    fit_score int,
    fit_breakdown jsonb,
    status text default 'NEW',
    monitoring_enabled boolean default false,
    last_checked_at timestamptz,
    last_signal_at timestamptz,
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

-- 8. research_signals
create table research_signals (
    id uuid primary key default gen_random_uuid(),
    owner_id uuid not null references auth.users(id),
    professor_id uuid references professors(id) on delete cascade,
    university_id uuid references universities(id) on delete cascade,
    source_id uuid references sources(id) on delete set null,
    signal_type text,
    title text,
    summary text,
    source_url text,
    signal_date date,
    relevance_score int,
    processed boolean default false,
    created_at timestamptz default now()
);

-- 9. digests
create table digests (
    id uuid primary key default gen_random_uuid(),
    owner_id uuid not null references auth.users(id),
    day date not null,
    summary_md text,
    stats jsonb,
    created_at timestamptz default now(),
    unique(owner_id, day)
);

-- 10. outreach_drafts
create table outreach_drafts (
    id uuid primary key default gen_random_uuid(),
    owner_id uuid not null references auth.users(id),
    professor_id uuid references professors(id) on delete cascade,
    subject text,
    body text,
    status text default 'DRAFT',
    created_at timestamptz default now()
);

-- 11. application_tasks
create table application_tasks (
    id uuid primary key default gen_random_uuid(),
    owner_id uuid not null references auth.users(id),
    opportunity_id uuid references opportunities(id) on delete cascade,
    task_type text,
    task_title text,
    due_date date,
    completed boolean default false,
    notes text,
    created_at timestamptz default now()
);

-- 12. run_log
create table run_log (
    id serial primary key,
    owner_id uuid not null references auth.users(id),
    job text,
    ok boolean,
    detail text,
    items_found int default 0,
    items_new int default 0,
    items_changed int default 0,
    ran_at timestamptz default now()
);

-- Constraints based on specific document guidance
alter table opportunities add constraint check_opportunity_status check (status in ('NEW', 'SAVED', 'VERIFY', 'CONTACTED', 'RESPONSE_RECEIVED', 'APPLICATION_PREPARING', 'APPLIED', 'INTERVIEW', 'OFFER', 'REJECTED', 'IGNORED'));
alter table opportunities add constraint check_opportunity_verification check (verification in ('UNVERIFIED', 'NEEDS_VERIFICATION', 'VERIFIED_OFFICIAL', 'EXPIRED', 'CLOSED'));

-- Indexes
create index idx_opportunities_hash on opportunities(hash);
create index idx_opportunities_status on opportunities(status);
create index idx_professors_uni on professors(university_id);
create index idx_research_leads_prof on research_leads(professor_id);

-- Enable RLS
alter table settings enable row level security;
alter table sources enable row level security;
alter table universities enable row level security;
alter table professors enable row level security;
alter table opportunities enable row level security;
alter table source_documents enable row level security;
alter table research_leads enable row level security;
alter table research_signals enable row level security;
alter table digests enable row level security;
alter table outreach_drafts enable row level security;
alter table application_tasks enable row level security;
alter table run_log enable row level security;

-- Create basic RLS policies for owner
do $$
declare
    t text;
begin
    for t in 
        select unnest(array[
            'settings', 'sources', 'universities', 'professors', 
            'opportunities', 'source_documents', 'research_leads', 
            'research_signals', 'digests', 'outreach_drafts', 
            'application_tasks', 'run_log'
        ])
    loop
        execute format('create policy "View own %I" on %I for select using (auth.uid() = owner_id)', t, t);
        execute format('create policy "Insert own %I" on %I for insert with check (auth.uid() = owner_id)', t, t);
        execute format('create policy "Update own %I" on %I for update using (auth.uid() = owner_id)', t, t);
        execute format('create policy "Delete own %I" on %I for delete using (auth.uid() = owner_id)', t, t);
    end loop;
end;
$$;
