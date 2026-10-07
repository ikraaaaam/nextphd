begin;
create extension if not exists pgtap;

select plan(15);

-- 1. Check if all required core tables exist
select has_table('settings');
select has_table('sources');
select has_table('universities');
select has_table('professors');
select has_table('opportunities');
select has_table('source_documents');
select has_table('research_leads');
select has_table('research_signals');
select has_table('digests');
select has_table('outreach_drafts');
select has_table('application_tasks');
select has_table('run_log');
select has_table('departments');
select has_table('professor_projects');
select has_table('professor_funding');

select * from finish();
rollback;
