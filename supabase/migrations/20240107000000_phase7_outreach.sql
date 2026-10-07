-- 20240107000000_phase7_outreach.sql

-- 1. outreach_contacts
create table outreach_contacts (
    id uuid primary key default gen_random_uuid(),
    owner_id uuid not null references auth.users(id),
    professor_id uuid not null references professors(id) on delete cascade,
    opportunity_id uuid references opportunities(id) on delete set null,
    application_id uuid references applications(id) on delete set null,
    status text not null default 'TO_CONTACT', -- TO_CONTACT, CONTACTED, RESPONDED, IGNORED, FOLLOW_UP
    first_contact_at timestamptz,
    last_contact_at timestamptz,
    next_follow_up_at timestamptz,
    notes text,
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

-- 2. Modify existing outreach_drafts
alter table outreach_drafts
add column opportunity_id uuid references opportunities(id) on delete set null,
add column application_id uuid references applications(id) on delete set null,
add column outreach_contact_id uuid references outreach_contacts(id) on delete set null,
add column updated_at timestamptz default now();

-- 3. contact_history
create table contact_history (
    id uuid primary key default gen_random_uuid(),
    owner_id uuid not null references auth.users(id),
    outreach_contact_id uuid not null references outreach_contacts(id) on delete cascade,
    direction text not null default 'OUTBOUND', -- OUTBOUND, INBOUND
    contact_method text not null default 'EMAIL',
    contact_date timestamptz not null default now(),
    subject text,
    summary text,
    response_status text,
    created_at timestamptz default now()
);

-- 4. Analytics view
create or replace view outreach_analytics as
select 
    owner_id,
    count(*) as total_contacts,
    count(*) filter (where status = 'RESPONDED') as responded_contacts,
    count(*) filter (where status = 'IGNORED') as ignored_contacts,
    count(*) filter (where status = 'CONTACTED') as pending_responses,
    avg(extract(epoch from (last_contact_at - first_contact_at))/86400) as avg_response_days
from outreach_contacts
where first_contact_at is not null
group by owner_id;

-- 5. Enable RLS
alter table outreach_contacts enable row level security;
create policy "Users can select own outreach_contacts" on outreach_contacts for select using (auth.uid() = owner_id);
create policy "Users can insert own outreach_contacts" on outreach_contacts for insert with check (auth.uid() = owner_id);
create policy "Users can update own outreach_contacts" on outreach_contacts for update using (auth.uid() = owner_id);
create policy "Users can delete own outreach_contacts" on outreach_contacts for delete using (auth.uid() = owner_id);

alter table contact_history enable row level security;
create policy "Users can select own contact_history" on contact_history for select using (auth.uid() = owner_id);
create policy "Users can insert own contact_history" on contact_history for insert with check (auth.uid() = owner_id);
create policy "Users can update own contact_history" on contact_history for update using (auth.uid() = owner_id);
create policy "Users can delete own contact_history" on contact_history for delete using (auth.uid() = owner_id);

-- trigger for updated_at
create trigger handle_updated_at before update on outreach_contacts
  for each row execute procedure set_updated_at();
create trigger handle_updated_at before update on outreach_drafts
  for each row execute procedure set_updated_at();
