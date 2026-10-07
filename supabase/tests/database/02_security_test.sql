begin;
create extension if not exists pgtap;

select plan(23);

-- 1. Verify RLS is enabled on all tables
select results_eq('select rowsecurity from pg_tables where schemaname = ''public'' and tablename = ''settings''', array[true], 'settings should have RLS');
select results_eq('select rowsecurity from pg_tables where schemaname = ''public'' and tablename = ''sources''', array[true], 'sources should have RLS');
select results_eq('select rowsecurity from pg_tables where schemaname = ''public'' and tablename = ''universities''', array[true], 'universities should have RLS');
select results_eq('select rowsecurity from pg_tables where schemaname = ''public'' and tablename = ''professors''', array[true], 'professors should have RLS');
select results_eq('select rowsecurity from pg_tables where schemaname = ''public'' and tablename = ''opportunities''', array[true], 'opportunities should have RLS');
select results_eq('select rowsecurity from pg_tables where schemaname = ''public'' and tablename = ''source_documents''', array[true], 'source_documents should have RLS');
select results_eq('select rowsecurity from pg_tables where schemaname = ''public'' and tablename = ''research_leads''', array[true], 'research_leads should have RLS');
select results_eq('select rowsecurity from pg_tables where schemaname = ''public'' and tablename = ''research_signals''', array[true], 'research_signals should have RLS');
select results_eq('select rowsecurity from pg_tables where schemaname = ''public'' and tablename = ''digests''', array[true], 'digests should have RLS');
select results_eq('select rowsecurity from pg_tables where schemaname = ''public'' and tablename = ''outreach_drafts''', array[true], 'outreach_drafts should have RLS');
select results_eq('select rowsecurity from pg_tables where schemaname = ''public'' and tablename = ''application_tasks''', array[true], 'application_tasks should have RLS');
select results_eq('select rowsecurity from pg_tables where schemaname = ''public'' and tablename = ''run_log''', array[true], 'run_log should have RLS');
select results_eq('select rowsecurity from pg_tables where schemaname = ''public'' and tablename = ''departments''', array[true], 'departments should have RLS');
select results_eq('select rowsecurity from pg_tables where schemaname = ''public'' and tablename = ''professor_projects''', array[true], 'professor_projects should have RLS');
select results_eq('select rowsecurity from pg_tables where schemaname = ''public'' and tablename = ''professor_funding''', array[true], 'professor_funding should have RLS');

-- 2. Set up test users
insert into auth.users (id, aud, role, email) values 
('22222222-2222-2222-2222-222222222222', 'authenticated', 'authenticated', 'user_a@test.local'),
('33333333-3333-3333-3333-333333333333', 'authenticated', 'authenticated', 'user_b@test.local');

-- 3. Behavioral Testing: User A
set local role authenticated;
set local request.jwt.claims = '{"sub": "22222222-2222-2222-2222-222222222222", "role": "authenticated"}';

-- User A creates a record
insert into public.universities (id, owner_id, name) values ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '22222222-2222-2222-2222-222222222222', 'University A');

-- User A can select it
select results_eq(
    'select name from public.universities where owner_id = ''22222222-2222-2222-2222-222222222222''',
    array['University A'],
    'User A can view their own record'
);

-- User A can update it
update public.universities set country = 'USA' where owner_id = '22222222-2222-2222-2222-222222222222';
select results_eq(
    'select country from public.universities where owner_id = ''22222222-2222-2222-2222-222222222222''',
    array['USA'],
    'User A can update their own record'
);

-- 4. Behavioral Testing: User B
set local request.jwt.claims = '{"sub": "33333333-3333-3333-3333-333333333333", "role": "authenticated"}';

-- User B creates a record
insert into public.universities (id, owner_id, name) values ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '33333333-3333-3333-3333-333333333333', 'University B');

-- User B cannot read User A's record
select is_empty(
    'select * from public.universities where owner_id = ''22222222-2222-2222-2222-222222222222''',
    'User B cannot read User A records'
);

-- User B cannot update User A's record (should affect 0 rows)
update public.universities set country = 'UK' where owner_id = '22222222-2222-2222-2222-222222222222';

-- User B cannot delete User A's record
delete from public.universities where owner_id = '22222222-2222-2222-2222-222222222222';

-- Switch back to A to verify B did not mutate A's records
set local request.jwt.claims = '{"sub": "22222222-2222-2222-2222-222222222222", "role": "authenticated"}';
select results_eq(
    'select country from public.universities where id = ''aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa''',
    array['USA'],
    'User B update did not affect User A record'
);
select results_eq(
    'select name from public.universities where id = ''aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa''',
    array['University A'],
    'User B delete did not affect User A record'
);

-- User A cannot insert a record for User B
prepare insert_as_b as insert into public.universities (id, owner_id, name) values (gen_random_uuid(), '33333333-3333-3333-3333-333333333333', 'Spoof');
select throws_ok(
    'insert_as_b',
    'new row violates row-level security policy for table "universities"',
    'User A cannot insert record spoofing User B owner_id'
);

-- 5. Behavioral Testing: Anonymous User
set local role anon;
set local request.jwt.claims = '{"role": "anon"}';

select is_empty(
    'select * from public.universities',
    'Anonymous user cannot read any records'
);

prepare anon_insert as insert into public.universities (id, owner_id, name) values (gen_random_uuid(), '22222222-2222-2222-2222-222222222222', 'Anon');
select throws_ok(
    'anon_insert',
    'new row violates row-level security policy for table "universities"',
    'Anonymous user cannot insert records'
);

select * from finish();
rollback;
