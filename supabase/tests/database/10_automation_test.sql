begin;
select plan(7);

-- Mock users
insert into auth.users (id, email) values ('c0000000-0000-0000-0000-000000000000', 'test@test.com') on conflict do nothing;
insert into auth.users (id, email) values ('c0000000-0000-0000-0000-000000000001', 'other@test.com') on conflict do nothing;

set local role authenticated;
set local "request.jwt.claim.sub" to 'c0000000-0000-0000-0000-000000000000';

-- 1. Test run_log extension
insert into run_log (owner_id, job, status, segment, source_failures)
values ('c0000000-0000-0000-0000-000000000000', 'morning_discovery', 'PARTIAL', 'MORNING_DISCOVERY', '[{"source": "test", "error": "timeout"}]');

select results_eq(
    'select status, segment from run_log where job = ''morning_discovery'' and owner_id = ''c0000000-0000-0000-0000-000000000000''',
    $$values ('PARTIAL'::text, 'MORNING_DISCOVERY'::text)$$,
    'Run log should store status and segment accurately'
);

select results_eq(
    'select jsonb_array_length(source_failures) from run_log where job = ''morning_discovery'' and owner_id = ''c0000000-0000-0000-0000-000000000000''',
    $$values (1)$$,
    'Run log should store source failures jsonb accurately'
);

-- 2. Test source health updates
insert into sources (id, owner_id, name, source_type, consecutive_failures)
values ('10000000-0000-0000-0000-000000000000', 'c0000000-0000-0000-0000-000000000000', 'Test Source', 'RSS', 3);

select results_eq(
    'select consecutive_failures from sources where id = ''10000000-0000-0000-0000-000000000000''',
    $$values (3)$$,
    'Sources table should track consecutive failures'
);

-- 3. Test RLS
set local "request.jwt.claim.sub" to 'c0000000-0000-0000-0000-000000000001';

select is_empty(
    'select id from run_log where job = ''morning_discovery''',
    'User 2 should not see User 1 run_log'
);

select is_empty(
    'select id from sources where id = ''10000000-0000-0000-0000-000000000000''',
    'User 2 should not see User 1 sources'
);

prepare test_insert_run as insert into run_log (owner_id, job) values ('c0000000-0000-0000-0000-000000000000', 'test');
select throws_ok('test_insert_run', 'new row violates row-level security policy for table "run_log"', 'User 2 cannot insert run_log for User 1');

prepare test_insert_source as insert into sources (owner_id, name, source_type) values ('c0000000-0000-0000-0000-000000000000', 'test', 'RSS');
select throws_ok('test_insert_source', 'new row violates row-level security policy for table "sources"', 'User 2 cannot insert sources for User 1');

select * from finish();
rollback;
