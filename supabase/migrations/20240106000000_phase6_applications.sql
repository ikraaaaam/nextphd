-- 20240106000000_phase6_applications.sql

drop table if exists application_tasks cascade;

create table applications (
    id uuid primary key default gen_random_uuid(),
    owner_id uuid not null references auth.users(id),
    opportunity_id uuid references opportunities(id) on delete set null,
    university_id uuid references universities(id) on delete set null,
    professor_id uuid references professors(id) on delete set null,
    title text not null,
    status text not null default 'INTERESTED',
    deadline date,
    notes text,
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

create table application_tasks (
    id uuid primary key default gen_random_uuid(),
    owner_id uuid not null references auth.users(id),
    application_id uuid not null references applications(id) on delete cascade,
    task_type text,
    task_title text not null,
    due_date date,
    completed boolean default false,
    notes text,
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

create table application_status_history (
    id uuid primary key default gen_random_uuid(),
    owner_id uuid not null references auth.users(id),
    application_id uuid not null references applications(id) on delete cascade,
    old_status text,
    new_status text not null,
    notes text,
    created_at timestamptz default now()
);

-- RLS

alter table applications enable row level security;
create policy "Users can select own applications" on applications for select using (auth.uid() = owner_id);
create policy "Users can insert own applications" on applications for insert with check (auth.uid() = owner_id);
create policy "Users can update own applications" on applications for update using (auth.uid() = owner_id);
create policy "Users can delete own applications" on applications for delete using (auth.uid() = owner_id);

alter table application_tasks enable row level security;
create policy "Users can select own application_tasks" on application_tasks for select using (auth.uid() = owner_id);
create policy "Users can insert own application_tasks" on application_tasks for insert with check (auth.uid() = owner_id);
create policy "Users can update own application_tasks" on application_tasks for update using (auth.uid() = owner_id);
create policy "Users can delete own application_tasks" on application_tasks for delete using (auth.uid() = owner_id);

alter table application_status_history enable row level security;
create policy "Users can select own application_status_history" on application_status_history for select using (auth.uid() = owner_id);
create policy "Users can insert own application_status_history" on application_status_history for insert with check (auth.uid() = owner_id);
create policy "Users can update own application_status_history" on application_status_history for update using (auth.uid() = owner_id);
create policy "Users can delete own application_status_history" on application_status_history for delete using (auth.uid() = owner_id);

-- Trigger for updated_at
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger handle_updated_at before update on applications
  for each row execute procedure set_updated_at();
create trigger handle_updated_at before update on application_tasks
  for each row execute procedure set_updated_at();

-- Trigger to record status history
create or replace function record_application_status_history()
returns trigger as $$
begin
  if (TG_OP = 'INSERT') or (TG_OP = 'UPDATE' and old.status is distinct from new.status) then
    insert into application_status_history (owner_id, application_id, old_status, new_status)
    values (new.owner_id, new.id, case when TG_OP = 'UPDATE' then old.status else null end, new.status);
  end if;
  return new;
end;
$$ language plpgsql security definer;

create trigger trigger_record_application_status_history
  after insert or update of status on applications
  for each row execute procedure record_application_status_history();
