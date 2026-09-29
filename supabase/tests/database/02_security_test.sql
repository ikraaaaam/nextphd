begin;
select plan(5);

-- 1. Check if RLS is enabled
select tests.rls_enabled('public', 'opportunities');

-- 2. Verify constraints
select has_index('public', 'opportunities', 'idx_opportunities_hash', 'idx_opportunities_hash exists');
select has_index('public', 'opportunities', 'idx_opportunities_status', 'idx_opportunities_status exists');

-- 3. Mock user and test data access
-- We assume owner_id logic works. Since it's pgTAP, we can switch role to a user.
-- For now just checking policies exist.
select policies_are('public', 'opportunities', array[
    'View own opportunities',
    'Insert own opportunities',
    'Update own opportunities',
    'Delete own opportunities'
]);

select policies_are('public', 'professors', array[
    'View own professors',
    'Insert own professors',
    'Update own professors',
    'Delete own professors'
]);

select * from finish();
rollback;
