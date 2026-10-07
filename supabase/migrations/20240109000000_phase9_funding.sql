-- 20240109000000_phase9_funding.sql

-- 1. funding_intelligence
create table funding_intelligence (
    id uuid primary key default gen_random_uuid(),
    owner_id uuid not null references auth.users(id),
    opportunity_id uuid references opportunities(id) on delete cascade,
    university_id uuid references universities(id) on delete cascade,
    country text,
    
    funding_status text not null default 'UNKNOWN', -- EXPLICITLY_FUNDED, STIPEND_STATED, TUITION_WAIVER_STATED, SALARY_STATED, FUNDING_AVAILABLE_UNCLEAR, FUNDING_NOT_STATED, UNKNOWN
    
    stipend_amount numeric,
    stipend_currency text,
    salary_amount numeric,
    salary_currency text,
    tuition_waiver_status text default 'UNKNOWN', -- FULL, PARTIAL, NONE, UNKNOWN
    tuition_coverage_details text,
    assistantship_type text, -- GTA, GRA, NONE, UNKNOWN
    grants_fellowships text,
    funding_source text,
    funding_duration_months int,
    is_recurring boolean,
    notes text,
    
    source_url text,
    source_type text,
    source_title text,
    retrieved_at timestamptz default now(),
    last_verified_at timestamptz default now(),
    verification_status text default 'UNVERIFIED', -- VERIFIED, UNVERIFIED, NEEDS_VERIFICATION, EXPIRED
    evidence_snippet text,

    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

-- 2. visa_intelligence
create table visa_intelligence (
    id uuid primary key default gen_random_uuid(),
    owner_id uuid not null references auth.users(id),
    country text,
    university_id uuid references universities(id) on delete cascade,
    opportunity_id uuid references opportunities(id) on delete cascade,
    
    visa_category text,
    student_visa_info text,
    application_requirements text,
    processing_time_estimate text,
    work_permission_info text,
    
    dependent_visa_availability text,
    dependent_restrictions text,
    family_healthcare_info text,
    
    source_url text,
    source_type text,
    source_title text,
    retrieved_at timestamptz default now(),
    last_verified_at timestamptz default now(),
    verification_status text default 'UNVERIFIED',
    evidence_snippet text,

    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

-- 3. living_costs
create table living_costs (
    id uuid primary key default gen_random_uuid(),
    owner_id uuid not null references auth.users(id),
    country text not null,
    city text,
    university_id uuid references universities(id) on delete cascade,
    
    cost_category text not null, -- RENT, GROCERIES, TRANSPORT, UTILITIES, TOTAL_ESTIMATE
    estimate_amount numeric not null,
    currency text not null,
    period text not null, -- MONTHLY, YEARLY
    
    source_url text,
    source_type text,
    source_title text,
    retrieved_at timestamptz default now(),
    last_verified_at timestamptz default now(),
    verification_status text default 'UNVERIFIED',
    evidence_snippet text,
    notes text,

    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

-- 4. healthcare_intelligence
create table healthcare_intelligence (
    id uuid primary key default gen_random_uuid(),
    owner_id uuid not null references auth.users(id),
    country text,
    university_id uuid references universities(id) on delete cascade,
    opportunity_id uuid references opportunities(id) on delete cascade,
    
    healthcare_requirement text,
    insurance_requirement text,
    insurance_availability text,
    university_provided boolean,
    student_healthcare_info text,
    
    source_url text,
    source_type text,
    source_title text,
    retrieved_at timestamptz default now(),
    last_verified_at timestamptz default now(),
    verification_status text default 'UNVERIFIED',
    evidence_snippet text,
    notes text,

    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

-- Triggers for updated_at
create trigger handle_updated_at before update on funding_intelligence
  for each row execute procedure set_updated_at();
create trigger handle_updated_at before update on visa_intelligence
  for each row execute procedure set_updated_at();
create trigger handle_updated_at before update on living_costs
  for each row execute procedure set_updated_at();
create trigger handle_updated_at before update on healthcare_intelligence
  for each row execute procedure set_updated_at();

-- RLS
alter table funding_intelligence enable row level security;
alter table visa_intelligence enable row level security;
alter table living_costs enable row level security;
alter table healthcare_intelligence enable row level security;

create policy "Users can select own funding_intelligence" on funding_intelligence for select using (auth.uid() = owner_id);
create policy "Users can insert own funding_intelligence" on funding_intelligence for insert with check (auth.uid() = owner_id);
create policy "Users can update own funding_intelligence" on funding_intelligence for update using (auth.uid() = owner_id);
create policy "Users can delete own funding_intelligence" on funding_intelligence for delete using (auth.uid() = owner_id);

create policy "Users can select own visa_intelligence" on visa_intelligence for select using (auth.uid() = owner_id);
create policy "Users can insert own visa_intelligence" on visa_intelligence for insert with check (auth.uid() = owner_id);
create policy "Users can update own visa_intelligence" on visa_intelligence for update using (auth.uid() = owner_id);
create policy "Users can delete own visa_intelligence" on visa_intelligence for delete using (auth.uid() = owner_id);

create policy "Users can select own living_costs" on living_costs for select using (auth.uid() = owner_id);
create policy "Users can insert own living_costs" on living_costs for insert with check (auth.uid() = owner_id);
create policy "Users can update own living_costs" on living_costs for update using (auth.uid() = owner_id);
create policy "Users can delete own living_costs" on living_costs for delete using (auth.uid() = owner_id);

create policy "Users can select own healthcare_intelligence" on healthcare_intelligence for select using (auth.uid() = owner_id);
create policy "Users can insert own healthcare_intelligence" on healthcare_intelligence for insert with check (auth.uid() = owner_id);
create policy "Users can update own healthcare_intelligence" on healthcare_intelligence for update using (auth.uid() = owner_id);
create policy "Users can delete own healthcare_intelligence" on healthcare_intelligence for delete using (auth.uid() = owner_id);
