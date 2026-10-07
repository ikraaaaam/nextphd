begin;
select plan(15);

-- Mock users
insert into auth.users (id, email) values ('c0000000-0000-0000-0000-000000000000', 'test@test.com') on conflict do nothing;
insert into auth.users (id, email) values ('c0000000-0000-0000-0000-000000000001', 'other@test.com') on conflict do nothing;

set local role authenticated;
set local "request.jwt.claim.sub" to 'c0000000-0000-0000-0000-000000000000';

-- Create parent records
insert into universities (id, owner_id, name, country) values ('b0000000-0000-0000-0000-000000000000', 'c0000000-0000-0000-0000-000000000000', 'App Uni', 'USA');
insert into professors (id, owner_id, university_id, name) values ('d0000000-0000-0000-0000-000000000000', 'c0000000-0000-0000-0000-000000000000', 'b0000000-0000-0000-0000-000000000000', 'App Prof');
insert into opportunities (id, owner_id, title, university_id, professor_id, hash) values ('e0000000-0000-0000-0000-000000000000', 'c0000000-0000-0000-0000-000000000000', 'App Opp', 'b0000000-0000-0000-0000-000000000000', 'd0000000-0000-0000-0000-000000000000', 'testhash999');

-- 1. Test funding_intelligence
insert into funding_intelligence (id, owner_id, opportunity_id, funding_status, stipend_amount, stipend_currency, source_url)
values ('10000000-0000-0000-0000-000000000000', 'c0000000-0000-0000-0000-000000000000', 'e0000000-0000-0000-0000-000000000000', 'STIPEND_STATED', 30000, 'USD', 'http://example.com/funding');

select results_eq(
    'select funding_status, stipend_amount::int from funding_intelligence where id = ''10000000-0000-0000-0000-000000000000''',
    $$values ('STIPEND_STATED'::text, 30000)$$,
    'Funding intelligence record should be created with correct details'
);

-- 2. Test visa_intelligence
insert into visa_intelligence (id, owner_id, country, visa_category, source_url)
values ('20000000-0000-0000-0000-000000000000', 'c0000000-0000-0000-0000-000000000000', 'USA', 'F1', 'http://example.com/visa');

select results_eq(
    'select visa_category from visa_intelligence where id = ''20000000-0000-0000-0000-000000000000''',
    $$values ('F1'::text)$$,
    'Visa intelligence record should be created'
);

-- 3. Test living_costs
insert into living_costs (id, owner_id, country, cost_category, estimate_amount, currency, period)
values ('30000000-0000-0000-0000-000000000000', 'c0000000-0000-0000-0000-000000000000', 'USA', 'TOTAL_ESTIMATE', 2000, 'USD', 'MONTHLY');

select results_eq(
    'select estimate_amount::int, period from living_costs where id = ''30000000-0000-0000-0000-000000000000''',
    $$values (2000, 'MONTHLY'::text)$$,
    'Living cost record should be created'
);

-- 4. Test healthcare_intelligence
insert into healthcare_intelligence (id, owner_id, university_id, university_provided)
values ('40000000-0000-0000-0000-000000000000', 'c0000000-0000-0000-0000-000000000000', 'b0000000-0000-0000-0000-000000000000', true);

select results_eq(
    'select university_provided from healthcare_intelligence where id = ''40000000-0000-0000-0000-000000000000''',
    $$values (true)$$,
    'Healthcare intelligence record should be created'
);

-- 5. Test default status logic (unverified)
select results_eq(
    'select verification_status from funding_intelligence where id = ''10000000-0000-0000-0000-000000000000''',
    $$values ('UNVERIFIED'::text)$$,
    'Default verification status should be UNVERIFIED'
);

-- 6. Test RLS isolation (Switch user)
set local "request.jwt.claim.sub" to 'c0000000-0000-0000-0000-000000000001';

select is_empty('select id from funding_intelligence where id = ''10000000-0000-0000-0000-000000000000''', 'User 2 should not see User 1 funding');
select is_empty('select id from visa_intelligence where id = ''20000000-0000-0000-0000-000000000000''', 'User 2 should not see User 1 visa info');
select is_empty('select id from living_costs where id = ''30000000-0000-0000-0000-000000000000''', 'User 2 should not see User 1 living costs');
select is_empty('select id from healthcare_intelligence where id = ''40000000-0000-0000-0000-000000000000''', 'User 2 should not see User 1 healthcare info');

-- Attempt unauthorized insert
prepare test_insert_funding as insert into funding_intelligence (owner_id) values ('c0000000-0000-0000-0000-000000000000');
select throws_ok('test_insert_funding', 'new row violates row-level security policy for table "funding_intelligence"', 'User 2 cannot insert for User 1');

prepare test_insert_visa as insert into visa_intelligence (owner_id) values ('c0000000-0000-0000-0000-000000000000');
select throws_ok('test_insert_visa', 'new row violates row-level security policy for table "visa_intelligence"', 'User 2 cannot insert for User 1');

prepare test_insert_living as insert into living_costs (owner_id, country, cost_category, estimate_amount, currency, period) values ('c0000000-0000-0000-0000-000000000000', 'USA', 'RENT', 1000, 'USD', 'MONTHLY');
select throws_ok('test_insert_living', 'new row violates row-level security policy for table "living_costs"', 'User 2 cannot insert for User 1');

prepare test_insert_health as insert into healthcare_intelligence (owner_id) values ('c0000000-0000-0000-0000-000000000000');
select throws_ok('test_insert_health', 'new row violates row-level security policy for table "healthcare_intelligence"', 'User 2 cannot insert for User 1');

-- 7. Test Cascade Delete
set local "request.jwt.claim.sub" to 'c0000000-0000-0000-0000-000000000000';

delete from opportunities where id = 'e0000000-0000-0000-0000-000000000000';
select is_empty('select id from funding_intelligence where id = ''10000000-0000-0000-0000-000000000000''', 'Funding cascade deletes with opportunity');

delete from universities where id = 'b0000000-0000-0000-0000-000000000000';
select is_empty('select id from healthcare_intelligence where id = ''40000000-0000-0000-0000-000000000000''', 'Healthcare cascade deletes with university');

select * from finish();
rollback;
