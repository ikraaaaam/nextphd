-- 20240108000000_phase8_portfolio.sql

-- 1. portfolio_documents
create table portfolio_documents (
    id uuid primary key default gen_random_uuid(),
    owner_id uuid not null references auth.users(id),
    category text not null, -- 'CV', 'TRANSCRIPT', 'SOP', 'RESEARCH_STATEMENT', 'CERTIFICATE', 'OTHER'
    title text not null,
    description text,
    version integer not null default 1,
    is_active boolean default true,
    file_path text, -- Supabase Storage object path or safe storage abstraction
    file_size_bytes bigint,
    metadata jsonb default '{}'::jsonb,
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

-- 2. Modify publications for user portfolio
alter table publications
add column is_user_portfolio boolean default false,
add column work_type text default 'PUBLICATION'; -- 'PUBLICATION', 'MANUSCRIPT', 'THESIS', 'PROJECT'

alter table publications alter column openalex_id drop not null;

-- 3. recommendation_letters
create table recommendation_letters (
    id uuid primary key default gen_random_uuid(),
    owner_id uuid not null references auth.users(id),
    recommender_name text not null,
    recommender_email text,
    recommender_title text,
    recommender_institution text,
    application_id uuid references applications(id) on delete set null,
    target_opportunity_id uuid references opportunities(id) on delete set null,
    requested_date date,
    deadline date,
    status text not null default 'REQUESTED', -- 'REQUESTED', 'ACCEPTED', 'DECLINED', 'DRAFTING', 'SUBMITTED', 'RECEIVED'
    received_date date,
    notes text,
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

-- 4. language_tests
create table language_tests (
    id uuid primary key default gen_random_uuid(),
    owner_id uuid not null references auth.users(id),
    test_type text not null, -- 'IELTS', 'TOEFL', 'GRE', 'GMAT', 'OTHER'
    test_date date,
    total_score text, 
    sub_scores jsonb default '{}'::jsonb, 
    expiry_date date,
    status text default 'COMPLETED', -- 'SCHEDULED', 'COMPLETED', 'AWAITING_RESULTS'
    report_file_id uuid references portfolio_documents(id) on delete set null,
    notes text,
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

-- 5. portfolio_links
create table portfolio_links (
    id uuid primary key default gen_random_uuid(),
    owner_id uuid not null references auth.users(id),
    platform text not null, -- 'GITHUB', 'PERSONAL_SITE', 'LINKEDIN', 'GOOGLE_SCHOLAR', 'RESEARCHGATE', 'OTHER'
    url text not null,
    description text,
    is_public boolean default true,
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

-- 6. Link applications/tasks to portfolio documents
alter table application_tasks
add column portfolio_document_id uuid references portfolio_documents(id) on delete set null;

-- RLS Policies
alter table portfolio_documents enable row level security;
alter table recommendation_letters enable row level security;
alter table language_tests enable row level security;
alter table portfolio_links enable row level security;

-- Policies for portfolio_documents
create policy "Users can select own portfolio_documents" on portfolio_documents for select using (auth.uid() = owner_id);
create policy "Users can insert own portfolio_documents" on portfolio_documents for insert with check (auth.uid() = owner_id);
create policy "Users can update own portfolio_documents" on portfolio_documents for update using (auth.uid() = owner_id);
create policy "Users can delete own portfolio_documents" on portfolio_documents for delete using (auth.uid() = owner_id);

-- Policies for recommendation_letters
create policy "Users can select own recommendation_letters" on recommendation_letters for select using (auth.uid() = owner_id);
create policy "Users can insert own recommendation_letters" on recommendation_letters for insert with check (auth.uid() = owner_id);
create policy "Users can update own recommendation_letters" on recommendation_letters for update using (auth.uid() = owner_id);
create policy "Users can delete own recommendation_letters" on recommendation_letters for delete using (auth.uid() = owner_id);

-- Policies for language_tests
create policy "Users can select own language_tests" on language_tests for select using (auth.uid() = owner_id);
create policy "Users can insert own language_tests" on language_tests for insert with check (auth.uid() = owner_id);
create policy "Users can update own language_tests" on language_tests for update using (auth.uid() = owner_id);
create policy "Users can delete own language_tests" on language_tests for delete using (auth.uid() = owner_id);

-- Policies for portfolio_links
create policy "Users can select own portfolio_links" on portfolio_links for select using (auth.uid() = owner_id);
create policy "Users can insert own portfolio_links" on portfolio_links for insert with check (auth.uid() = owner_id);
create policy "Users can update own portfolio_links" on portfolio_links for update using (auth.uid() = owner_id);
create policy "Users can delete own portfolio_links" on portfolio_links for delete using (auth.uid() = owner_id);

-- Triggers for updated_at
create trigger handle_updated_at before update on portfolio_documents
  for each row execute procedure set_updated_at();
create trigger handle_updated_at before update on recommendation_letters
  for each row execute procedure set_updated_at();
create trigger handle_updated_at before update on language_tests
  for each row execute procedure set_updated_at();
create trigger handle_updated_at before update on portfolio_links
  for each row execute procedure set_updated_at();
