begin;
select plan(11);

-- Mock user
insert into auth.users (id, email) values ('c0000000-0000-0000-0000-000000000000', 'test@test.com') on conflict do nothing;
insert into auth.users (id, email) values ('c0000000-0000-0000-0000-000000000001', 'other@test.com') on conflict do nothing;

-- Create parent records
insert into universities (id, owner_id, name, country) values ('b0000000-0000-0000-0000-000000000000', 'c0000000-0000-0000-0000-000000000000', 'App Uni', 'USA');
insert into professors (id, owner_id, university_id, name) values ('d0000000-0000-0000-0000-000000000000', 'c0000000-0000-0000-0000-000000000000', 'b0000000-0000-0000-0000-000000000000', 'App Prof');
insert into opportunities (id, owner_id, title, university_id, professor_id, hash) values ('e0000000-0000-0000-0000-000000000000', 'c0000000-0000-0000-0000-000000000000', 'App Opp', 'b0000000-0000-0000-0000-000000000000', 'd0000000-0000-0000-0000-000000000000', 'testhash123');

set local role authenticated;
set local "request.jwt.claim.sub" to 'c0000000-0000-0000-0000-000000000000';

-- 1. Test creation and linkages
insert into applications (id, owner_id, title, opportunity_id, university_id, professor_id, deadline) 
values ('a0000000-0000-0000-0000-000000000000', 'c0000000-0000-0000-0000-000000000000', 'My Application', 'e0000000-0000-0000-0000-000000000000', 'b0000000-0000-0000-0000-000000000000', 'd0000000-0000-0000-0000-000000000000', '2026-12-31');

select results_eq(
    'select title, status, deadline from applications where id = ''a0000000-0000-0000-0000-000000000000''',
    $$values ('My Application', 'INTERESTED', '2026-12-31'::date)$$,
    'Application should be created with linkages and default status'
);

-- 2. Test status history trigger (INSERT)
select results_eq(
    'select old_status, new_status from application_status_history where application_id = ''a0000000-0000-0000-0000-000000000000'' and old_status is null',
    $$values (null::text, 'INTERESTED'::text)$$,
    'Insert should trigger history record'
);

-- 3. Test status transitions (UPDATE)
update applications set status = 'PREPARING' where id = 'a0000000-0000-0000-0000-000000000000';

select results_eq(
    'select status from applications where id = ''a0000000-0000-0000-0000-000000000000''',
    $$values ('PREPARING'::text)$$,
    'Status should transition to PREPARING'
);

select results_eq(
    'select old_status, new_status from application_status_history where application_id = ''a0000000-0000-0000-0000-000000000000'' and old_status = ''INTERESTED''',
    $$values ('INTERESTED'::text, 'PREPARING'::text)$$,
    'Update should trigger history record for PREPARING'
);

-- 4. Test tasks/checklists
insert into application_tasks (id, owner_id, application_id, task_type, task_title, due_date)
values ('90000000-0000-0000-0000-000000000000', 'c0000000-0000-0000-0000-000000000000', 'a0000000-0000-0000-0000-000000000000', 'DOCUMENT', 'Submit CV', '2026-12-01');

select results_eq(
    'select task_title, completed from application_tasks where id = ''90000000-0000-0000-0000-000000000000''',
    $$values ('Submit CV', false)$$,
    'Task should be created'
);

-- 5. Test multi-user isolation
set local "request.jwt.claim.sub" to 'c0000000-0000-0000-0000-000000000001';

select is_empty(
    'select id from applications where id = ''a0000000-0000-0000-0000-000000000000''',
    'User 2 should not see User 1 applications'
);
select is_empty(
    'select id from application_tasks',
    'User 2 should not see User 1 tasks'
);
select is_empty(
    'select id from application_status_history',
    'User 2 should not see User 1 history'
);

-- User 2 trying to update User 1's application should affect 0 rows
update applications set status = 'APPLIED' where id = 'a0000000-0000-0000-0000-000000000000';
set local "request.jwt.claim.sub" to 'c0000000-0000-0000-0000-000000000000';
select results_eq(
    'select status from applications where id = ''a0000000-0000-0000-0000-000000000000''',
    $$values ('PREPARING'::text)$$,
    'User 2 update attempt should be blocked'
);

-- 6. Test delete cascade
delete from applications where id = 'a0000000-0000-0000-0000-000000000000';

select is_empty(
    'select id from application_tasks where id = ''90000000-0000-0000-0000-000000000000''',
    'Tasks should cascade delete'
);
select is_empty(
    'select id from application_status_history where application_id = ''a0000000-0000-0000-0000-000000000000''',
    'History should cascade delete'
);

select * from finish();
rollback;
