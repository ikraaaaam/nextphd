begin;
select plan(11);

-- Mock user
insert into auth.users (id, email) values ('c0000000-0000-0000-0000-000000000000', 'test@test.com') on conflict do nothing;
insert into auth.users (id, email) values ('c0000000-0000-0000-0000-000000000001', 'other@test.com') on conflict do nothing;

-- Create parent records
insert into universities (id, owner_id, name, country) values ('b0000000-0000-0000-0000-000000000000', 'c0000000-0000-0000-0000-000000000000', 'App Uni', 'USA');
insert into professors (id, owner_id, university_id, name) values ('d0000000-0000-0000-0000-000000000000', 'c0000000-0000-0000-0000-000000000000', 'b0000000-0000-0000-0000-000000000000', 'App Prof');
insert into opportunities (id, owner_id, title, university_id, professor_id, hash) values ('e0000000-0000-0000-0000-000000000000', 'c0000000-0000-0000-0000-000000000000', 'App Opp', 'b0000000-0000-0000-0000-000000000000', 'd0000000-0000-0000-0000-000000000000', 'testhash123');
insert into applications (id, owner_id, title, opportunity_id, university_id, professor_id, deadline) values ('a0000000-0000-0000-0000-000000000000', 'c0000000-0000-0000-0000-000000000000', 'My Application', 'e0000000-0000-0000-0000-000000000000', 'b0000000-0000-0000-0000-000000000000', 'd0000000-0000-0000-0000-000000000000', '2026-12-31');

set local role authenticated;
set local "request.jwt.claim.sub" to 'c0000000-0000-0000-0000-000000000000';

-- 1. Test outreach_contacts creation
insert into outreach_contacts (id, owner_id, professor_id, opportunity_id, application_id, status)
values ('90000000-0000-0000-0000-000000000000', 'c0000000-0000-0000-0000-000000000000', 'd0000000-0000-0000-0000-000000000000', 'e0000000-0000-0000-0000-000000000000', 'a0000000-0000-0000-0000-000000000000', 'TO_CONTACT');

select results_eq(
    'select status from outreach_contacts where id = ''90000000-0000-0000-0000-000000000000''',
    $$values ('TO_CONTACT'::text)$$,
    'Outreach contact should be created with linkages'
);

-- 2. Test contact_history
insert into contact_history (id, owner_id, outreach_contact_id, direction, summary)
values ('80000000-0000-0000-0000-000000000000', 'c0000000-0000-0000-0000-000000000000', '90000000-0000-0000-0000-000000000000', 'OUTBOUND', 'Sent initial email');

select results_eq(
    'select direction, summary from contact_history where id = ''80000000-0000-0000-0000-000000000000''',
    $$values ('OUTBOUND'::text, 'Sent initial email'::text)$$,
    'Contact history should be recorded'
);

-- 3. Test outreach_drafts updates
insert into outreach_drafts (id, owner_id, professor_id, outreach_contact_id, subject)
values ('70000000-0000-0000-0000-000000000000', 'c0000000-0000-0000-0000-000000000000', 'd0000000-0000-0000-0000-000000000000', '90000000-0000-0000-0000-000000000000', 'PhD Inquiry');

select results_eq(
    'select subject, status from outreach_drafts where id = ''70000000-0000-0000-0000-000000000000''',
    $$values ('PhD Inquiry'::text, 'DRAFT'::text)$$,
    'Outreach draft should be linked and default to DRAFT'
);

-- 4. Test analytics view
update outreach_contacts set status = 'RESPONDED', first_contact_at = now() - interval '2 days', last_contact_at = now() where id = '90000000-0000-0000-0000-000000000000';

select results_eq(
    'select total_contacts, responded_contacts, avg_response_days > 0 from outreach_analytics where owner_id = ''c0000000-0000-0000-0000-000000000000''',
    $$values (1::bigint, 1::bigint, true)$$,
    'Analytics view should aggregate response data accurately'
);

-- 5. Test isolation
set local "request.jwt.claim.sub" to 'c0000000-0000-0000-0000-000000000001';

select is_empty(
    'select id from outreach_contacts where id = ''90000000-0000-0000-0000-000000000000''',
    'User 2 should not see User 1 outreach contacts'
);
select is_empty(
    'select id from contact_history',
    'User 2 should not see User 1 history'
);
select is_empty(
    'select id from outreach_drafts where id = ''70000000-0000-0000-0000-000000000000''',
    'User 2 should not see User 1 drafts'
);

-- 6. Test delete cascade
set local "request.jwt.claim.sub" to 'c0000000-0000-0000-0000-000000000000';
delete from outreach_contacts where id = '90000000-0000-0000-0000-000000000000';

select is_empty(
    'select id from contact_history where id = ''80000000-0000-0000-0000-000000000000''',
    'History should cascade delete'
);
select is_empty(
    'select id from outreach_drafts where outreach_contact_id = ''90000000-0000-0000-0000-000000000000''',
    'Draft should have outreach_contact_id set to null (cascade test)'
);

-- Wait, the constraint on outreach_drafts is 'on delete set null'. So it should not be empty, but outreach_contact_id should be null.
select results_eq(
    'select outreach_contact_id from outreach_drafts where id = ''70000000-0000-0000-0000-000000000000''',
    $$values (null::uuid)$$,
    'Draft outreach_contact_id should be set null on delete'
);

delete from professors where id = 'd0000000-0000-0000-0000-000000000000';
select is_empty(
    'select id from outreach_drafts where id = ''70000000-0000-0000-0000-000000000000''',
    'Draft should cascade delete with professor'
);

select * from finish();
rollback;
