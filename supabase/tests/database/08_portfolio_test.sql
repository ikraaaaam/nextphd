begin;
select plan(13);

-- Mock user
insert into auth.users (id, email) values ('c0000000-0000-0000-0000-000000000000', 'test@test.com') on conflict do nothing;
insert into auth.users (id, email) values ('c0000000-0000-0000-0000-000000000001', 'other@test.com') on conflict do nothing;

set local role authenticated;
set local "request.jwt.claim.sub" to 'c0000000-0000-0000-0000-000000000000';

-- 1. Test portfolio_documents creation and versioning
insert into portfolio_documents (id, owner_id, category, title, version)
values ('10000000-0000-0000-0000-000000000000', 'c0000000-0000-0000-0000-000000000000', 'CV', 'My CV v1', 1);
insert into portfolio_documents (id, owner_id, category, title, version)
values ('20000000-0000-0000-0000-000000000000', 'c0000000-0000-0000-0000-000000000000', 'CV', 'My CV v2', 2);

select results_eq(
    'select count(*)::int from portfolio_documents where category = ''CV''',
    $$values (2)$$,
    'Multiple document versions should be preserved'
);

-- 2. Test publications modification (is_user_portfolio and null openalex_id)
insert into publications (id, owner_id, title, is_user_portfolio, work_type, openalex_id)
values ('30000000-0000-0000-0000-000000000000', 'c0000000-0000-0000-0000-000000000000', 'My Unpublished Manuscript', true, 'MANUSCRIPT', null);

select results_eq(
    'select title, work_type from publications where id = ''30000000-0000-0000-0000-000000000000''',
    $$values ('My Unpublished Manuscript'::text, 'MANUSCRIPT'::text)$$,
    'Unpublished manuscript can be stored without openalex_id'
);

-- 3. Test recommendation_letters
insert into recommendation_letters (id, owner_id, recommender_name, status)
values ('40000000-0000-0000-0000-000000000000', 'c0000000-0000-0000-0000-000000000000', 'Prof. Smith', 'REQUESTED');

select results_eq(
    'select recommender_name, status from recommendation_letters where id = ''40000000-0000-0000-0000-000000000000''',
    $$values ('Prof. Smith'::text, 'REQUESTED'::text)$$,
    'Recommendation letter can be tracked'
);

-- 4. Test language_tests
insert into language_tests (id, owner_id, test_type, total_score, sub_scores, report_file_id)
values ('50000000-0000-0000-0000-000000000000', 'c0000000-0000-0000-0000-000000000000', 'IELTS', '8.0', '{"reading": 8.5, "listening": 8.0}'::jsonb, '10000000-0000-0000-0000-000000000000');

select results_eq(
    'select test_type, total_score from language_tests where id = ''50000000-0000-0000-0000-000000000000''',
    $$values ('IELTS'::text, '8.0'::text)$$,
    'Language test with score and subscores can be tracked'
);

select results_eq(
    'select report_file_id from language_tests where id = ''50000000-0000-0000-0000-000000000000''',
    $$values ('10000000-0000-0000-0000-000000000000'::uuid)$$,
    'Language test links correctly to portfolio document'
);

-- 5. Test portfolio_links
insert into portfolio_links (id, owner_id, platform, url)
values ('60000000-0000-0000-0000-000000000000', 'c0000000-0000-0000-0000-000000000000', 'GITHUB', 'https://github.com/user');

select results_eq(
    'select platform, url from portfolio_links where id = ''60000000-0000-0000-0000-000000000000''',
    $$values ('GITHUB'::text, 'https://github.com/user'::text)$$,
    'Portfolio link can be tracked'
);

-- 6. Test application task checklist linking
insert into universities (id, owner_id, name, country) values ('b0000000-0000-0000-0000-000000000000', 'c0000000-0000-0000-0000-000000000000', 'App Uni', 'USA');
insert into applications (id, owner_id, title, university_id) values ('a0000000-0000-0000-0000-000000000000', 'c0000000-0000-0000-0000-000000000000', 'My App', 'b0000000-0000-0000-0000-000000000000');
insert into application_tasks (id, owner_id, application_id, task_title, portfolio_document_id)
values ('70000000-0000-0000-0000-000000000000', 'c0000000-0000-0000-0000-000000000000', 'a0000000-0000-0000-0000-000000000000', 'Upload CV', '20000000-0000-0000-0000-000000000000');

select results_eq(
    'select portfolio_document_id from application_tasks where id = ''70000000-0000-0000-0000-000000000000''',
    $$values ('20000000-0000-0000-0000-000000000000'::uuid)$$,
    'Application task successfully links to a portfolio document'
);

-- 7. Test RLS isolation
set local "request.jwt.claim.sub" to 'c0000000-0000-0000-0000-000000000001';

select is_empty(
    'select id from portfolio_documents where owner_id = ''c0000000-0000-0000-0000-000000000000''',
    'User 2 should not see User 1 portfolio documents'
);
select is_empty(
    'select id from publications where id = ''30000000-0000-0000-0000-000000000000''',
    'User 2 should not see User 1 publications'
);
select is_empty(
    'select id from recommendation_letters where id = ''40000000-0000-0000-0000-000000000000''',
    'User 2 should not see User 1 recommendation letters'
);
select is_empty(
    'select id from language_tests where id = ''50000000-0000-0000-0000-000000000000''',
    'User 2 should not see User 1 language tests'
);
select is_empty(
    'select id from portfolio_links where id = ''60000000-0000-0000-0000-000000000000''',
    'User 2 should not see User 1 portfolio links'
);

-- 8. Test delete cascade / set null
set local "request.jwt.claim.sub" to 'c0000000-0000-0000-0000-000000000000';
delete from portfolio_documents where id = '20000000-0000-0000-0000-000000000000';

select results_eq(
    'select portfolio_document_id from application_tasks where id = ''70000000-0000-0000-0000-000000000000''',
    $$values (null::uuid)$$,
    'Application task document link should be set null on document deletion'
);

select * from finish();
rollback;
