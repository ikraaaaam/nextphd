-- Phase 3 Remediation: Departments, Projects, Funding

-- 1. Departments Table
create table departments (
    id uuid primary key default gen_random_uuid(),
    owner_id uuid not null references auth.users(id),
    university_id uuid not null references universities(id) on delete cascade,
    name text not null,
    website text,
    notes text,
    updated_at timestamptz default now(),
    unique(owner_id, university_id, name)
);
alter table departments enable row level security;
create policy "View own departments" on departments for select using (auth.uid() = owner_id);
create policy "Insert own departments" on departments for insert with check (auth.uid() = owner_id);
create policy "Update own departments" on departments for update using (auth.uid() = owner_id);
create policy "Delete own departments" on departments for delete using (auth.uid() = owner_id);

-- Update professors to link to department
alter table professors add column department_id uuid references departments(id) on delete set null;
-- opportunities might also belong to a department
alter table opportunities add column department_id uuid references departments(id) on delete set null;

-- 2. Professor Projects
create table professor_projects (
    id uuid primary key default gen_random_uuid(),
    owner_id uuid not null references auth.users(id),
    professor_id uuid not null references professors(id) on delete cascade,
    title text not null,
    description text,
    url text,
    is_active boolean default true,
    start_date date,
    end_date date,
    evidence_source text,
    updated_at timestamptz default now(),
    unique(owner_id, professor_id, title)
);
alter table professor_projects enable row level security;
create policy "View own professor_projects" on professor_projects for select using (auth.uid() = owner_id);
create policy "Insert own professor_projects" on professor_projects for insert with check (auth.uid() = owner_id);
create policy "Update own professor_projects" on professor_projects for update using (auth.uid() = owner_id);
create policy "Delete own professor_projects" on professor_projects for delete using (auth.uid() = owner_id);

-- 3. Professor Funding Evidence
create table professor_funding (
    id uuid primary key default gen_random_uuid(),
    owner_id uuid not null references auth.users(id),
    professor_id uuid not null references professors(id) on delete cascade,
    funding_org text not null,
    grant_name text,
    amount text,
    year_awarded int,
    evidence_url text,
    status text default 'ACTIVE',
    updated_at timestamptz default now()
);
alter table professor_funding enable row level security;
create policy "View own professor_funding" on professor_funding for select using (auth.uid() = owner_id);
create policy "Insert own professor_funding" on professor_funding for insert with check (auth.uid() = owner_id);
create policy "Update own professor_funding" on professor_funding for update using (auth.uid() = owner_id);
create policy "Delete own professor_funding" on professor_funding for delete using (auth.uid() = owner_id);

-- Phase 4 Remediation: Degree Compatibility
-- Settings jsonb update for academic_profile, preferred_universities, preferred_countries
-- This can be handled implicitly via JSONB updates on settings, but let's formalize opportunity requirements natively where helpful, or just rely on JSON extraction in python.
