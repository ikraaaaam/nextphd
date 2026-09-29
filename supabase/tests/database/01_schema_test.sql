begin;
select plan(2);

-- 1. Check if core tables exist
select has_table('settings');
select has_table('universities');

select * from finish();
rollback;
