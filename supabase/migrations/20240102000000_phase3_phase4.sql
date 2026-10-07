-- Phase 3 & 4: University, Professor Intelligence and User Profile

-- 1. Add fields to universities
alter table universities 
add column is_favourite boolean default false;

-- 2. Add fields to professors
alter table professors 
add column department text,
add column is_favourite boolean default false;

-- 3. Create research_groups
create table research_groups (
    id uuid primary key default gen_random_uuid(),
    owner_id uuid not null references auth.users(id),
    name text not null,
    university_id uuid references universities(id) on delete cascade,
    website text,
    is_favourite boolean default false,
    notes text,
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

-- 4. Enable RLS on research_groups
alter table research_groups enable row level security;
create policy "View own research_groups" on research_groups for select using (auth.uid() = owner_id);
create policy "Insert own research_groups" on research_groups for insert with check (auth.uid() = owner_id);
create policy "Update own research_groups" on research_groups for update using (auth.uid() = owner_id);
create policy "Delete own research_groups" on research_groups for delete using (auth.uid() = owner_id);

-- 5. Add fields to settings for Phase 4 (Profile)
alter table settings
add column academic_background jsonb default '{}'::jsonb,
add column research_background jsonb default '{}'::jsonb,
add column technical_skills jsonb default '{}'::jsonb,
add column preferences jsonb default '{}'::jsonb;
