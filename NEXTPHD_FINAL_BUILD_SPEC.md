# NEXTPHD — PERSONAL PhD RESEARCH & OPPORTUNITY INTELLIGENCE SYSTEM
## Final Build Specification & Roadmap — V2

**Status:** FINAL BUILD SPECIFICATION  
**Target:** Antigravity IDE / autonomous implementation  
**Owner:** Single user, personal PhD search system  
**Primary objective:** Build a portal that continuously collects, verifies, enriches, prioritizes, and tracks PhD opportunities and research leads relevant to the user's profile.

---

# 0. PRODUCT VISION

This is **not** a generic PhD job aggregator.

It is a personal **PhD Research & Opportunity Intelligence System**.

The system should reduce the user's daily search burden by continuously monitoring multiple legitimate information channels and presenting only useful, personalized information in one portal.

The user should be able to open the portal once per day and answer:

1. What new PhD opportunities appeared?
2. Which ones fit my research/profile?
3. Which deadlines are approaching?
4. Which opportunities have verified official information?
5. Which professors/labs are strong research leads even when no vacancy is advertised?
6. What changed since yesterday?
7. What should I investigate or act on next?

The system must prioritize **coverage + accuracy + provenance + personalization**, not raw volume.

---

# 1. NON-NEGOTIABLE PRINCIPLES

## 1.1 Portal-first

The portal is the user's primary consumption interface.

Do NOT flood the user's personal inbox with opportunity notifications.

Email may be used internally as an ingestion mechanism through a dedicated mailbox, but the user should consume the resulting information from the portal.

The portal is the source of truth for the user's workflow state.

---

## 1.2 No LinkedIn/Facebook scraping

Do NOT scrape LinkedIn or Facebook.

Do NOT automate browser login to LinkedIn/Facebook.

Do NOT build an unofficial crawler for their authenticated pages.

Do NOT bypass robots.txt, rate limits, authentication, CAPTCHAs, or platform restrictions.

LinkedIn/Facebook signals may enter the system through:

- legitimate alert emails;
- official/public APIs where available and permitted;
- manual Quick Add;
- information that is independently available from official/public sources.

The system must never promise 100% LinkedIn coverage.

The goal is **maximum practical PhD opportunity coverage**, not 100% coverage of a particular social platform.

---

## 1.3 Source provenance is mandatory

Every factual opportunity field should retain its source.

Important fields must be traceable to:

- source URL;
- source type;
- source title/name;
- retrieval timestamp;
- publication/post date when available;
- verification state.

The LLM must never become the factual source of truth.

The LLM extracts and interprets source content; it does not invent missing facts.

If information is absent:

```text
null
```

or:

```text
UNKNOWN
```

Never guess.

---

## 1.4 Official-source verification

The system must distinguish between:

- an opportunity discovered somewhere;
- an opportunity verified on an official university/lab page.

Recommended states:

```text
UNVERIFIED
NEEDS_VERIFICATION
VERIFIED_OFFICIAL
EXPIRED
CLOSED
```

A social post or aggregator listing must not automatically be treated as an official confirmed vacancy.

---

## 1.5 Human remains the final decision-maker

The system may:

- collect;
- extract;
- compare;
- score for relevance;
- identify missing information;
- highlight deadlines;
- draft outreach.

The system must NOT:

- automatically apply;
- automatically contact professors;
- automatically send emails;
- fabricate qualifications;
- fabricate funding;
- fabricate eligibility;
- claim an opportunity is funded when the source does not establish funding.

All outreach remains draft-only.

---

# 2. USER PROFILE — INITIAL PERSONALIZATION

The system should support a persistent master profile.

Initial known profile:

- EEE undergraduate background;
- biomedical-focused Master's;
- research assistant experience;
- data science / ML experience;
- publication experience;
- EEG / biomedical signal processing experience;
- wearable sensing / physiological data exposure;
- AI/ML/DL interests;
- medical imaging research interest;
- interest in biomedical AI;
- interest in signal processing;
- interest in healthcare AI;
- interest in ML applied to biomedical systems.

The exact profile must be editable from Settings.

Do not hard-code personal facts into Python source code.

Store the editable profile in Supabase.

---

# 3. RESEARCH INTEREST MODEL

The system must support a hierarchy rather than one flat keyword list.

Example:

```text
Biomedical AI
├── Biomedical Signal Processing
│   ├── EEG
│   ├── ECG
│   ├── EMG
│   ├── physiological signals
│   └── wearable sensing
│
├── AI for Healthcare
│   ├── medical imaging
│   ├── diagnostic AI
│   ├── healthcare ML
│   └── clinical AI
│
├── Machine Learning
│   ├── deep learning
│   ├── representation learning
│   ├── continual learning
│   ├── federated learning
│   └── knowledge distillation
│
└── Intelligent Biomedical Systems
    ├── edge AI
    ├── embedded AI
    └── human-machine interaction
```

The user can:

- add interests;
- remove interests;
- set primary interests;
- set secondary interests;
- define excluded areas.

---

# 4. COUNTRY MODEL

Initial target countries/regions:

- Saudi Arabia
- UAE
- Qatar
- USA
- Canada
- Australia
- Hong Kong
- Japan
- Singapore
- South Korea
- Germany
- Netherlands
- Switzerland
- Denmark
- Sweden
- Norway
- Finland
- Austria
- Ireland

The architecture must allow additional countries later.

Country information must be treated as a research dataset, not as permanent assumptions.

Each country record may contain:

```text
country
currency
typical_funding_note
typical_stipend_note
cost_estimate
family_cost_estimate
spouse_study_rule
spouse_work_rule
child_school_note
muslim_environment_note
visa_note
policy_risk_note
source_url
verified_on
verification_status
```

All country-specific claims begin as:

```text
UNVERIFIED
```

until supported by a reliable source.

Do not make country-level claims from memory.

---

# 5. CORE SYSTEM CONCEPTS

The system has four major intelligence objects.

## 5.1 Opportunities

A concrete advertised PhD/research position or admissions opportunity.

Example:

> PhD Position — EEG-based Cognitive Workload — University X

---

## 5.2 Research Leads

A professor/lab with strong research alignment even if there is no advertised vacancy.

Example:

> Professor X  
> 5 relevant papers in last 18 months  
> Active EEG/ML research  
> Recent funding signal  
> No current vacancy detected

The system should allow:

```text
MONITOR
```

for such leads.

---

## 5.3 Research Signals

Events that may indicate future opportunities:

- new relevant publication;
- new grant/funding announcement;
- new lab page;
- professor joining a university;
- lab expansion;
- new PhD student recruitment;
- new research project;
- new official vacancy page;
- relevant conference/project announcement.

Research signals do not automatically become opportunities.

---

## 5.4 Actions

Things the user may need to do:

- verify opportunity;
- save;
- contact professor;
- prepare SOP;
- request LOR;
- submit application;
- follow up;
- monitor professor;
- research funding;
- check dependent rules.

---

# 6. SOURCE STRATEGY

The system should use multiple independent source classes.

## 6.1 Official university sources

Highest verification value.

Examples:

- university PhD admissions pages;
- graduate school pages;
- department vacancy pages;
- official job portals;
- laboratory pages;
- professor pages.

Use these for verification and change detection.

---

## 6.2 PhD/job aggregators

Potential sources:

- FindAPhD;
- jobs.ac.uk;
- EURAXESS;
- Academic Positions;
- relevant national research/job portals;
- university-specific job portals.

Before implementing an automated source:

1. inspect robots.txt;
2. inspect terms;
3. determine whether RSS/API exists;
4. prefer official RSS/API over scraping;
5. implement only compliant access.

If no compliant automated access exists, support:

- email alert ingestion;
- manual Quick Add.

---

## 6.3 Scholarly APIs

Use:

- OpenAlex;
- Semantic Scholar where API access is available;
- arXiv;
- other legitimate scholarly APIs where useful.

These are primarily for:

- professor discovery;
- recent research;
- topic matching;
- research-lead generation;
- publication recency;
- research signal detection.

They are NOT themselves proof of an open PhD position.

---

## 6.4 Google Alerts

Use alerts for queries such as:

```text
"PhD" EEG
"PhD position" "EEG"
"PhD student" "biomedical signal processing"
"PhD position" "medical imaging"
"funded PhD" "machine learning" healthcare
"PhD student" "wearable sensing"
```

Google Alert email/RSS behavior must be verified during implementation.

---

## 6.5 Mailing lists

Potential sources:

- IEEE EMBS;
- BCI-related communities;
- EEG/EEGLAB communities;
- computational neuroscience communities;
- relevant research society job boards;
- department mailing lists.

Use a dedicated Gmail ingestion mailbox.

---

## 6.6 LinkedIn

Supported ingestion channels:

### A. LinkedIn Job Alerts

Configure relevant job alerts and ingest the alert emails into the dedicated Gmail.

### B. LinkedIn alert emails

Where LinkedIn provides legitimate email notifications for configured searches/activity.

### C. Manual Quick Add

User pastes:

- LinkedIn URL;
- post text;
- job text;
- professor announcement.

The system extracts and stores the information.

### D. Independent source discovery

If the same opportunity appears on:

- official university page;
- official lab page;
- job board;
- public research announcement;

the system can ingest that independent source.

### Explicit limitation

The system does NOT claim:

```text
ALL LINKEDIN POSTS
ALL LINKEDIN JOBS
ALL LINKEDIN PROFESSOR ACTIVITY
```

It claims:

```text
LINKEDIN ALERT COVERAGE + MANUAL CAPTURE + INDEPENDENT SOURCE COVERAGE
```

---

## 6.7 Facebook

No scraping.

Use:

- email notifications where legitimately available;
- mailing-list notifications;
- manual Quick Add;
- independently published official sources.

---

# 7. SOURCE REGISTRY

Create a `sources` table.

Suggested fields:

```sql
create table sources (
    id uuid primary key default gen_random_uuid(),
    name text not null,
    source_type text not null,
    base_url text,
    enabled boolean default true,
    access_method text,
    compliance_status text,
    last_run_at timestamptz,
    last_run_ok boolean,
    items_found_30d int default 0,
    items_shortlisted_30d int default 0,
    items_verified_30d int default 0,
    notes text,
    created_at timestamptz default now()
);
```

Possible `source_type`:

```text
OFFICIAL_UNIVERSITY
OFFICIAL_LAB
JOB_BOARD
SCHOLARLY_API
RSS
EMAIL_ALERT
LINKEDIN_ALERT
FACEBOOK_ALERT
GOOGLE_ALERT
MAILING_LIST
MANUAL
```

Possible `compliance_status`:

```text
VERIFIED
NEEDS_REVIEW
DISABLED
```

Frontend must provide a Sources page.

---

# 8. DATABASE MODEL

Use Supabase Postgres.

## 8.1 settings

```sql
create table settings (
    id int primary key default 1,
    countries text[] default '{}',
    subjects text[] default '{}',
    keywords text[] default '{}',
    exclude_keywords text[] default '{}',
    min_score int default 60,
    profile_summary text,
    updated_at timestamptz default now()
);
```

---

## 8.2 universities

```sql
create table universities (
    id uuid primary key default gen_random_uuid(),
    name text unique not null,
    country text,
    city text,
    openalex_id text,
    website text,
    grad_admissions_url text,
    funding_model text,
    stipend_note text,
    gpa_note text,
    family_note text,
    muslim_env_note text,
    verified boolean default false,
    verified_on date,
    source_url text,
    works_count int,
    cited_by_count int,
    updated_at timestamptz default now()
);
```

---

## 8.3 professors

```sql
create table professors (
    id uuid primary key default gen_random_uuid(),
    name text not null,
    university_id uuid references universities(id),
    openalex_author_id text unique,
    homepage text,
    email_public text,
    h_index int,
    works_count int,
    cited_by_count int,
    recent_topics text[],
    recent_papers jsonb,
    intl_student_signal text,
    recruiting_signal text default 'none',
    fit_score int,
    fit_breakdown jsonb,
    fit_reason text,
    priority text,
    monitoring_enabled boolean default false,
    updated_at timestamptz default now()
);
```

---

## 8.4 opportunities

```sql
create table opportunities (
    id uuid primary key default gen_random_uuid(),
    hash text unique not null,
    title text,
    university_id uuid references universities(id),
    professor_id uuid references professors(id),
    country text,
    field text,
    source text,
    source_id uuid references sources(id),
    source_url text,
    official_url text,
    posted_on date,
    deadline date,
    rolling_admission boolean default false,
    funding_text text,
    stipend_amount text,
    tuition_covered boolean,
    funding_class text,
    eligibility text,
    english_req text,
    dependents_note text,
    fit_score int,
    fit_breakdown jsonb,
    fit_reason text,
    verification text default 'UNVERIFIED',
    status text default 'NEW',
    notes text,
    first_seen timestamptz default now(),
    last_seen timestamptz default now(),
    last_changed timestamptz
);
```

---

## 8.5 source_documents

Store normalized/raw source references.

```sql
create table source_documents (
    id uuid primary key default gen_random_uuid(),
    source_id uuid references sources(id),
    external_url text,
    title text,
    retrieved_at timestamptz default now(),
    published_at timestamptz,
    content_hash text,
    raw_text text,
    content_type text,
    extraction_status text
);
```

For privacy/cost reasons, do not unnecessarily retain full email bodies forever. Define retention rules.

---

## 8.6 research_leads

```sql
create table research_leads (
    id uuid primary key default gen_random_uuid(),
    professor_id uuid references professors(id),
    university_id uuid references universities(id),
    lead_type text,
    title text,
    description text,
    evidence jsonb,
    fit_score int,
    fit_breakdown jsonb,
    status text default 'NEW',
    monitoring_enabled boolean default false,
    last_checked_at timestamptz,
    last_signal_at timestamptz,
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);
```

Possible lead types:

```text
RESEARCH_MATCH
FUNDING_SIGNAL
LAB_EXPANSION
RECRUITMENT_SIGNAL
RECENT_PUBLICATION
POTENTIAL_SUPERVISOR
```

---

## 8.7 research_signals

```sql
create table research_signals (
    id uuid primary key default gen_random_uuid(),
    professor_id uuid references professors(id),
    university_id uuid references universities(id),
    source_id uuid references sources(id),
    signal_type text,
    title text,
    summary text,
    source_url text,
    signal_date date,
    relevance_score int,
    processed boolean default false,
    created_at timestamptz default now()
);
```

---

## 8.8 digests

```sql
create table digests (
    id uuid primary key default gen_random_uuid(),
    day date unique,
    summary_md text,
    stats jsonb,
    created_at timestamptz default now()
);
```

---

## 8.9 outreach drafts

```sql
create table outreach_drafts (
    id uuid primary key default gen_random_uuid(),
    professor_id uuid references professors(id),
    subject text,
    body text,
    status text default 'DRAFT',
    created_at timestamptz default now()
);
```

Never auto-send.

---

## 8.10 application tracking

Add:

```sql
create table application_tasks (
    id uuid primary key default gen_random_uuid(),
    opportunity_id uuid references opportunities(id),
    task_type text,
    task_title text,
    due_date date,
    completed boolean default false,
    notes text,
    created_at timestamptz default now()
);
```

Examples:

```text
CV
SOP
LOR 1
LOR 2
Transcript
IELTS
Research Proposal
Professor Contact
Application Submission
Follow-up
```

---

## 8.11 run logs

```sql
create table run_log (
    id serial primary key,
    job text,
    ok boolean,
    detail text,
    items_found int default 0,
    items_new int default 0,
    items_changed int default 0,
    ran_at timestamptz default now()
);
```

---

# 9. SOURCE → NORMALIZATION PIPELINE

Every source must follow:

```text
SOURCE
  ↓
INGEST
  ↓
RAW DOCUMENT
  ↓
NORMALIZE
  ↓
EXTRACT
  ↓
DEDUP
  ↓
VERIFY
  ↓
ENRICH
  ↓
SCORE
  ↓
STORE
  ↓
PORTAL
```

Never directly insert an LLM-generated opportunity into the database without source provenance.

---

# 10. DEDUPLICATION

The same opportunity may appear on:

- LinkedIn;
- FindAPhD;
- university website;
- Google Alert;
- mailing list.

These should become one opportunity record with multiple source references.

Primary hash:

```text
normalized_title + university + official_url
```

Fallback:

```text
normalized_title + university + deadline
```

When duplicate sources are found:

- retain all source references;
- prefer official source for verification;
- update `last_seen`;
- do not create duplicate opportunities.

---

# 11. VERIFICATION ENGINE

Verification should be deterministic where possible.

Rules:

### VERIFIED_OFFICIAL

Set only when a reliable official university/lab/admissions source supports the opportunity.

### NEEDS_VERIFICATION

Opportunity exists but official confirmation is not available.

### EXPIRED

Deadline has passed and no rolling admission is indicated.

### CLOSED

Source explicitly says position closed/filled.

Never allow an LLM alone to set VERIFIED_OFFICIAL.

---

# 12. AI EXTRACTION

Use Claude API for:

- extraction;
- classification;
- summarization;
- research-fit analysis;
- draft generation.

LLM output must be strict JSON.

Example:

```json
{
  "title": null,
  "university": null,
  "country": null,
  "professor": null,
  "deadline": null,
  "rolling_admission": false,
  "funding_text": null,
  "stipend_amount": null,
  "tuition_covered": null,
  "eligibility": null,
  "english_requirement": null,
  "dependents_note": null,
  "research_topics": [],
  "recruiting_signal": "none",
  "confidence": 0,
  "fit_breakdown": {
    "topic_overlap": 0,
    "profile_fit": 0,
    "research_recency": 0,
    "recruiting_signal": 0,
    "institution_fit": 0,
    "funding_fit": 0
  },
  "fit_score": 0,
  "reason": null,
  "missing_information": []
}
```

The extraction prompt must explicitly state:

```text
Do not infer missing factual fields.
Do not invent funding.
Do not invent deadlines.
Do not invent eligibility.
Return null when the source does not establish a fact.
```

---

# 13. PERSONALIZED FIT SCORING

The score is a triage mechanism, not a claim of objective quality.

Suggested components:

```text
topic_overlap
profile_fit
research_recency
recruiting_signal
institution_fit
funding_fit
eligibility_fit
```

Each can be 0–10.

Example weighted calculation:

```text
topic_overlap        25%
profile_fit          20%
research_recency    10%
recruiting_signal    15%
institution_fit      10%
funding_fit          10%
eligibility_fit      10%
```

Weights must be configurable.

The UI must show the breakdown.

Do not display only one opaque number.

---

# 14. SCORE INTERPRETATION

The score should answer:

> "How closely does this opportunity match the user's configured profile?"

It must NOT be presented as:

> "probability of admission."

It must NOT imply:

> "you will get this PhD."

Suggested display:

```text
Fit: 86/100

Topic match:       9/10
Profile match:     9/10
Recruiting signal: 8/10
Funding fit:       7/10
Eligibility fit:  9/10
```

---

# 15. RESEARCH LEAD ENGINE

This is a major component.

The system should discover professors who:

- publish strongly in the user's target topics;
- have recent publications;
- have relevant grants/signals;
- have active labs;
- appear to recruit;
- are affiliated with target universities.

A professor does NOT need to have an advertised vacancy to become a research lead.

Example:

```text
RESEARCH LEAD

Professor: Dr. X
University: Y

Why detected:
- 6 relevant papers in last 18 months
- 4 papers overlap EEG + ML
- recent research project detected
- lab page recently updated

Current vacancy:
None detected

Action:
[Monitor Professor]
```

---

# 16. PROFESSOR MONITORING

When the user selects:

```text
Monitor Professor
```

the weekly job should check:

- official lab page;
- official university profile;
- recent publications;
- new project/grant signals;
- new PhD recruitment language;
- relevant vacancy pages.

If a meaningful change occurs:

```text
Professor Monitor Alert
```

appears on the portal.

No email required.

---

# 17. FUNDING CLASSIFICATION

Funding should be evidence-based.

Possible classes:

```text
A — Funding explicitly stated and appears comprehensive
B — Funding explicitly stated but important details unclear
C — Partial/unclear funding
D — No funding evidence
```

The system must retain:

```text
funding_text
funding_source_url
funding_verification
```

Do not infer "fully funded" from vague language.

---

# 18. DEADLINE ENGINE

Every opportunity should show:

```text
deadline
days_left
rolling_admission
deadline_status
```

Examples:

```text
12 days left
Tomorrow
Expired
Rolling
No deadline stated
```

Default urgency:

```text
<= 7 days     CRITICAL
8–14 days     URGENT
15–30 days    SOON
31+ days      NORMAL
```

Urgency must be separate from fit score.

---

# 19. PORTAL DESIGN

Use:

```text
React + Vite
Supabase JS
Netlify
```

Mobile-friendly.

## Page 1 — TODAY

One-screen dashboard.

Show:

### New opportunities

Top 5 relevant new opportunities.

### Deadline alerts

Deadlines <= 14 days.

### Research leads

New/high-value professor leads.

### Changed items

Funding/deadline/eligibility changes.

### Actions

Tasks requiring user attention.

### Daily tip

One useful application/research tip.

Goal:

**5-minute daily review.**

---

# 20. FEED

Filters:

- country;
- subject;
- keyword;
- fit score;
- funding class;
- verification;
- deadline;
- source;
- status;
- rolling admission.

Sort:

- newest;
- deadline;
- fit score;
- recently changed.

Default:

```text
NEW
AND
fit_score >= user's min_score
```

Avoid overwhelming the user.

---

# 21. PROFESSORS PAGE

Display:

- professor;
- university;
- research topics;
- recent papers;
- fit score;
- recruiting signal;
- official profile;
- public email where available;
- research lead status;
- monitoring status.

Actions:

```text
Monitor
Open Profile
View Papers
Create Draft
```

---

# 22. UNIVERSITIES PAGE

Display:

- country;
- university;
- official website;
- admissions page;
- funding model;
- funding notes;
- GPA notes;
- family/dependent notes;
- country context;
- verification status.

All manually editable.

---

# 23. RESEARCH LEADS PAGE

Separate from actual vacancies.

Filters:

- fit;
- country;
- university;
- research area;
- signal type;
- monitored/unmonitored.

This page is important because many potential PhD opportunities may begin as professor-level research leads rather than advertised vacancies.

---

# 24. PIPELINE

Statuses:

```text
NEW
SAVED
VERIFY
CONTACTED
RESPONSE_RECEIVED
APPLICATION_PREPARING
APPLIED
INTERVIEW
OFFER
REJECTED
IGNORED
```

Kanban interface.

---

# 25. DRAFTS

AI can prepare:

- professor outreach;
- follow-up;
- clarification request;
- funding question.

Drafts must use actual evidence from the professor's recent work.

Never fabricate:

- paper titles;
- grants;
- relationship;
- previous communication.

Never auto-send.

---

# 26. QUICK ADD

Quick Add is critical.

Input:

```text
URL
```

or:

```text
paste text
```

The system:

```text
Quick Add
 ↓
Edge Function
 ↓
Fetch URL if permitted
 ↓
Extract text
 ↓
Claude extraction
 ↓
Dedup
 ↓
Verification
 ↓
Fit score
 ↓
Portal
```

The UI should say:

```text
"Found on LinkedIn? Paste it here."
```

This gives the user a practical escape hatch for information that automated ingestion cannot legally or technically capture.

---

# 27. DAILY INGESTION JOBS

Python 3.11 worker.

Suggested modules:

```text
worker/
├── run_daily.py
├── config.py
├── db.py
├── models.py
├── normalize.py
├── dedup.py
├── verify.py
├── scoring.py
├── digest.py
│
├── sources/
│   ├── openalex.py
│   ├── semantic_scholar.py
│   ├── arxiv.py
│   ├── rss.py
│   ├── gmail.py
│   ├── google_alerts.py
│   ├── official_pages.py
│   ├── linkedin_alerts.py
│   └── manual.py
│
├── intelligence/
│   ├── professor_discovery.py
│   ├── research_leads.py
│   ├── research_signals.py
│   ├── opportunity_extraction.py
│   ├── fit_scoring.py
│   └── outreach_draft.py
│
└── tests/
```

Do not create one giant ingestion script.

---

# 28. GITHUB ACTIONS

Daily:

```yaml
name: nextphd-daily

on:
  schedule:
    - cron: '0 2 * * *'
  workflow_dispatch:

jobs:
  run:
    runs-on: ubuntu-latest
    timeout-minutes: 30

    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-python@v5
        with:
          python-version: '3.11'
          cache: pip

      - run: pip install -r worker/requirements.txt

      - run: python worker/run_daily.py
        env:
          SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
          SUPABASE_SERVICE_KEY: ${{ secrets.SUPABASE_SERVICE_KEY }}
          ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}
          GMAIL_CREDENTIALS_JSON: ${{ secrets.GMAIL_CREDENTIALS_JSON }}
          S2_API_KEY: ${{ secrets.S2_API_KEY }}
```

02:00 UTC corresponds to 08:00 Bangladesh time when Bangladesh is UTC+6.

Also support:

```text
workflow_dispatch
```

for manual execution.

---

# 29. WEEKLY JOB

Weekly job:

1. check monitored university pages;
2. check monitored professor pages;
3. re-score professor profiles;
4. detect new research signals;
5. check opportunity deadlines;
6. detect expired/closed opportunities;
7. update country information only when explicitly sourced;
8. produce weekly statistics.

---

# 30. FAILURE HANDLING

Every worker must fail visibly.

Never silently swallow errors.

Each job writes:

```text
run_log
```

with:

- job;
- start;
- end;
- success;
- number found;
- number inserted;
- number updated;
- error details.

A source failure must not destroy data from other sources.

Use per-source isolation:

```text
OpenAlex failure
    ≠
whole pipeline failure
```

---

# 31. RATE LIMITING

For every external source:

- respect documented limits;
- use caching;
- avoid repeated requests;
- use exponential backoff;
- do not hammer websites;
- respect robots.txt where applicable;
- use official APIs/RSS whenever available.

For monitored pages, only check a curated shortlist.

---

# 32. SECURITY

Secrets:

```text
SUPABASE_SERVICE_KEY
ANTHROPIC_API_KEY
GMAIL_CREDENTIALS
S2_API_KEY
```

must exist only in GitHub Secrets / secure environment variables.

Never commit secrets.

Frontend receives only:

```text
SUPABASE_URL
SUPABASE_ANON_KEY
```

Enable Supabase Auth.

RLS should restrict data to the authenticated owner.

Service-role operations remain backend-only.

---

# 33. RLS

All user-owned tables should have RLS.

Conceptually:

```sql
auth.uid() = owner
```

If the system is single-user, still implement proper ownership.

Do not rely on frontend hiding for security.

---

# 34. PRIVACY

Email ingestion should use a dedicated Gmail account.

Recommended behavior:

```text
email arrives
 ↓
label nextphd
 ↓
worker reads it
 ↓
extract relevant content
 ↓
store required structured data
 ↓
mark processed
 ↓
archive
```

Do not store unnecessary personal email content.

Provide a retention policy for raw email documents.

---

# 35. PORTAL SOURCE VISIBILITY

Every opportunity must have:

```text
Source:
LinkedIn Alert

Official verification:
Not yet verified

Original:
[Open Source]

Official:
[Open Official Source]
```

The user should always know where the information came from.

---

# 36. CHANGE DETECTION

When an existing opportunity changes:

compare:

```text
deadline
funding
eligibility
stipend
description
official URL
status
```

If materially changed:

```text
last_changed = now()
```

Show:

```text
CHANGED
Funding updated
Deadline changed
Eligibility changed
```

This is more useful than showing the same opportunity repeatedly.

---

# 37. NOISE CONTROL

Default feed:

```text
fit_score >= min_score
status = NEW
```

Daily new-item display target:

```text
maximum ~20
```

Do not hard-delete ignored items.

Store them and suppress them unless material changes occur.

The user can override the filter.

---

# 38. DAILY DIGEST

The digest is stored in Supabase.

Example:

```text
TODAY — 28 September

NEW
5 opportunities

HIGH FIT
2

DEADLINES
1 within 7 days
3 within 30 days

RESEARCH LEADS
4 new

CHANGED
2 funding updates

ACTION
Verify University X funding
```

No email digest required.

---

# 39. LINKEDIN COVERAGE STRATEGY

The system should document this explicitly in the UI.

### What is automated

- configured LinkedIn job alert emails;
- legitimate notification emails;
- independent sources.

### What is manual

- posts the user personally discovers;
- posts requiring Quick Add.

### What is not supported

- LinkedIn scraping;
- authenticated crawling;
- mass profile extraction;
- unrestricted collection of LinkedIn posts.

The portal should not falsely advertise "complete LinkedIn coverage."

---

# 40. SOURCE PERFORMANCE ANALYTICS

Sources page should show:

```text
Source                Found   Relevant   Verified
-------------------------------------------------
OpenAlex              142       18         -
University pages       32       14        12
EURAXESS               21        9         7
LinkedIn alerts        17        6         3
Google Alerts          12        4         2
Mailing lists           8        3         1
Quick Add               6        5         4
```

This allows the user to learn which sources actually produce useful opportunities.

Do not optimize for raw source volume.

Optimize for relevant verified results.

---

# 41. SOURCE HEALTH

Each source gets:

```text
HEALTHY
DEGRADED
FAILING
DISABLED
```

A source that fails repeatedly should not break the entire system.

---

# 42. INITIAL UNIVERSITY SEED

Initial seed can include universities already identified as relevant, such as:

```text
MBZUAI
KFUPM
KAUST
GIST
DGIST
UNIST
KAIST
Monash Malaysia
UTM
```

These are starting records only.

Do not assume they are currently suitable, funded, or accepting applications.

The system must verify current information from official sources.

---

# 43. PROFILE FIT TEST SET

Before trusting scoring, manually create a benchmark of approximately 10–20 professors/opportunities:

```text
clearly excellent fit
good fit
partial fit
poor fit
irrelevant
```

Run the scoring system.

Compare model output to human judgment.

Adjust weights/prompts.

Do not deploy scoring as "final" before this test.

---

# 44. AI COST CONTROL

Use:

```text
Cheapest correct computation first.
```

Do not call Claude for every page every day.

Pipeline:

```text
cheap filtering
 ↓
hash comparison
 ↓
keyword relevance
 ↓
dedup
 ↓
only then LLM
```

Use deterministic processing whenever sufficient.

---

# 45. CACHING

Cache:

- OpenAlex professor metadata;
- university metadata;
- source documents;
- page hashes;
- previously scored content.

Do not repeatedly send identical content to Claude.

---

# 46. LLM FAILURE SAFETY

If Claude:

- times out;
- returns invalid JSON;
- hallucinates;
- exceeds token limit;

then:

```text
mark extraction_status = FAILED
```

and retain the source.

Do not create a fabricated opportunity.

Use retry with bounded attempts.

---

# 47. TESTING STRATEGY

Required tests:

## Unit

- normalization;
- dedup;
- date parsing;
- deadline calculation;
- scoring;
- verification rules;
- source classification.

## Integration

- Supabase;
- Gmail ingestion;
- source ingestion;
- Quick Add;
- Claude extraction.

## Security

- RLS;
- service-role isolation;
- frontend cannot access service secrets.

## Regression

Create fixed source fixtures.

The same input should produce stable structured output within acceptable tolerance.

---

# 48. ACCEPTANCE TESTS

The build is not complete until all are demonstrated.

### AT-01

A sample official university opportunity is ingested.

Expected:

```text
stored
verified
scored
visible in Feed
```

### AT-02

A duplicate LinkedIn alert for the same opportunity is ingested.

Expected:

```text
NO DUPLICATE OPPORTUNITY
```

### AT-03

A LinkedIn alert with no official source is ingested.

Expected:

```text
UNVERIFIED / NEEDS_VERIFICATION
```

### AT-04

Quick Add with a professor post.

Expected:

```text
research lead/opportunity created
source retained
```

### AT-05

Missing funding information.

Expected:

```text
funding = null/unknown
```

No hallucination.

### AT-06

Deadline changes.

Expected:

```text
last_changed updated
portal marks CHANGED
```

### AT-07

Deadline passes.

Expected:

```text
EXPIRED
```

unless rolling admission.

### AT-08

Professor has strong research fit but no opening.

Expected:

```text
RESEARCH LEAD
```

### AT-09

Professor monitoring enabled.

Expected:

```text
weekly monitoring
signal detection
```

### AT-10

User marks opportunity Applied.

Expected:

```text
pipeline updated
```

### AT-11

RLS test.

Expected:

```text
unauthenticated user cannot access private data
```

### AT-12

Source failure.

Expected:

```text
source failure logged
other sources continue
```

---

# 49. FRONTEND NAVIGATION

Recommended:

```text
Today
Opportunities
Research Leads
Professors
Universities
Pipeline
Drafts
Sources
Tasks
Settings
```

Keep navigation simple.

---

# 50. OPPORTUNITY CARD

Every opportunity card should show:

```text
TITLE
University
Country

FIT 86
Funding: A
Verification: VERIFIED_OFFICIAL

Deadline:
12 days left

Why it matches:
EEG + biomedical ML + wearable sensing

Recruiting:
Explicit

Source:
Official university page

[View]
[Save]
[Verify]
[Contact]
[Ignore]
```

---

# 51. RESEARCH LEAD CARD

```text
Dr. Jane Doe
University X

Fit: 91

Research:
EEG
Neuroengineering
Biomedical AI

Evidence:
6 relevant papers
recent project signal
active lab

Opening:
None detected

[Monitor]
[View Papers]
[Draft Outreach]
```

---

# 52. USER WORKFLOW

The intended daily workflow:

```text
1. Open portal
       ↓
2. Read Today
       ↓
3. Review urgent deadlines
       ↓
4. Review high-fit opportunities
       ↓
5. Review new research leads
       ↓
6. Verify important opportunities
       ↓
7. Save/contact/apply
       ↓
8. Done
```

Target:

**~5–10 minutes/day**, not hours.

---

# 53. BUILD ORDER

Do NOT build everything at once.

Antigravity must implement and validate in phases.

## PHASE 0 — RECONNAISSANCE

Before coding:

- inspect repository;
- inspect existing files;
- inspect environment;
- confirm Python;
- confirm Node;
- confirm Supabase configuration;
- confirm GitHub repository;
- confirm Netlify target;
- identify secrets needed.

Deliver:

```text
PHASE-0-RECON.md
```

STOP.

---

# 54. PHASE 1 — DATABASE + SECURITY

Implement:

- Supabase schema;
- migrations;
- indexes;
- RLS;
- authentication;
- seed data;
- source registry.

Tests:

- schema;
- RLS;
- CRUD.

Deliver:

```text
PHASE-1-DB-SECURITY.md
```

STOP.

---

# 55. PHASE 2 — OPENALEX PROFESSOR DISCOVERY

Implement only:

```text
OpenAlex
 ↓
professor discovery
 ↓
university mapping
 ↓
recent papers
 ↓
Supabase
```

Manually inspect 10–20 results.

Validate names, universities and papers.

STOP.

---

# 56. PHASE 3 — AI PROFESSOR FIT

Implement:

- profile summary;
- topic matching;
- fit breakdown;
- research lead creation.

Test on manually selected professors.

STOP.

---

# 57. PHASE 4 — OFFICIAL UNIVERSITY PAGES

Implement curated-page monitoring.

Start with a small shortlist.

Use:

- URL;
- content hash;
- change detection;
- source document;
- verification.

Do not build broad web crawling.

STOP.

---

# 58. PHASE 5 — OPPORTUNITY INGESTION

Implement:

- RSS;
- compliant job-board sources;
- official vacancy pages.

Build normalization + dedup + verification.

STOP.

---

# 59. PHASE 6 — GMAIL / ALERT INGESTION

Implement dedicated Gmail.

Labels:

```text
nextphd
```

Support:

- LinkedIn alerts;
- Google Alerts;
- mailing lists;
- Facebook notifications where legitimately available.

Parse into common source-document format.

STOP.

---

# 60. PHASE 7 — QUICK ADD

Implement:

```text
URL / text
 ↓
Edge Function
 ↓
extract
 ↓
dedup
 ↓
verify
 ↓
score
 ↓
portal
```

This is essential for sources that cannot be automatically ingested.

STOP.

---

# 61. PHASE 8 — PORTAL

Build:

1. Today;
2. Opportunities;
3. Research Leads;
4. Professors;
5. Universities;
6. Pipeline;
7. Drafts;
8. Sources;
9. Settings.

Deploy read-only first.

STOP.

---

# 62. PHASE 9 — SCORING + DIGEST

Implement:

- opportunity fit;
- research lead fit;
- deadline engine;
- funding classification;
- daily digest;
- changed-item detection.

Benchmark against manual judgments.

STOP.

---

# 63. PHASE 10 — MONITORING + HARDENING

Implement:

- weekly professor monitoring;
- university page monitoring;
- source health;
- failure isolation;
- retries;
- caching;
- cost control;
- security hardening.

STOP.

---

# 64. PHASE 11 — FINAL CERTIFICATION

Run:

- unit tests;
- integration tests;
- RLS tests;
- source fixture tests;
- duplicate tests;
- hallucination/missing-field tests;
- failure recovery tests;
- UI tests;
- end-to-end test.

Create:

```text
FINAL-SYSTEM-CERTIFICATION.md
```

The system is not considered complete until this report passes.

---

# 65. ANTIGRAVITY OPERATING RULES

Antigravity must follow these rules.

### Rule 1

Do not invent missing requirements.

### Rule 2

Do not silently change architecture.

### Rule 3

Do not scrape prohibited/restricted platforms.

### Rule 4

Do not commit secrets.

### Rule 5

Do not skip tests.

### Rule 6

Do not build all phases in one shot.

### Rule 7

After every phase:

```text
implement
test
report
STOP
```

### Rule 8

If an external source's access method is unclear:

```text
STOP
document uncertainty
do not implement speculative scraping
```

### Rule 9

Never fabricate source facts.

### Rule 10

Never auto-send outreach.

### Rule 11

Preserve source provenance.

### Rule 12

Prefer official APIs/RSS over scraping.

---

# 66. FINAL SUCCESS CRITERIA

The system is successful when the user can:

### Discover

Find relevant PhD opportunities without manually checking dozens of sites.

### Understand

Immediately see:

- research fit;
- funding;
- deadline;
- eligibility;
- verification.

### Discover hidden opportunities

Identify professors/labs that fit strongly even when no vacancy is advertised.

### Track

Know:

- saved;
- contacted;
- applied;
- interview;
- offer;
- rejected.

### Monitor

Receive portal-visible updates when:

- deadlines change;
- funding changes;
- professor signals change;
- monitored pages change.

### Avoid noise

See a manageable number of useful items rather than hundreds of raw listings.

### Trust the system

Every important factual claim can be traced to a source.

---

# 67. V1 SCOPE — DO NOT OVERBUILD

V1 should focus on:

```text
Supabase
+
OpenAlex
+
official university pages
+
selected compliant job/RSS sources
+
Gmail alert ingestion
+
Quick Add
+
Claude extraction/scoring
+
Research Leads
+
Today dashboard
+
Opportunity Feed
+
Professor monitoring
+
Pipeline
```

Do NOT initially build:

- unrestricted web crawling;
- social-media scraping;
- automatic applications;
- automatic emails;
- complex microservices;
- unnecessary ML models;
- recommendation algorithms beyond transparent scoring.

---

# 68. FIRST ANTIGRAVITY PROMPT

Give Antigravity this exact instruction:

> Read `NEXTPHD_FINAL_BUILD_SPEC.md` completely before modifying the repository.
>
> This document is the authoritative product and architecture specification.
>
> First perform PHASE 0 — RECONNAISSANCE ONLY.
>
> Do not implement later phases.
>
> Inspect the existing repository, runtime, Python/Node versions, Supabase configuration, GitHub configuration, and Netlify configuration.
>
> Produce:
>
> 1. `PHASE-0-RECON.md`
> 2. identified risks;
> 3. missing credentials/configuration;
> 4. proposed repository structure;
> 5. exact files that would be created in Phase 1.
>
> Do not invent missing information.
>
> Do not scrape LinkedIn/Facebook.
>
> Do not commit secrets.
>
> Do not make architectural changes without documenting them.
>
> After Phase 0, STOP and show the report.
>
> Wait for approval before implementing Phase 1.

---

# 69. IMPORTANT PRODUCT DEFINITION

The system's promise is:

> **"I continuously collect and organize relevant PhD opportunities and research signals from multiple legitimate sources, verify what I can, personalize the results to my profile, and show everything important in one portal."**

It is NOT:

> "I scrape every website and every social network."

It is NOT:

> "I guarantee I will find every PhD position."

It is NOT:

> "AI decides which PhD you should take."

The user remains the final decision-maker.

---

# 70. FINAL ARCHITECTURE

```text
                         ┌──────────────────────────┐
                         │       DATA SOURCES       │
                         └────────────┬─────────────┘
                                      │
        ┌─────────────┬───────────────┼───────────────┬─────────────┐
        │             │               │               │             │
      APIs           RSS        Official Pages      Gmail        Quick Add
        │             │               │               │             │
        └─────────────┴───────────────┼───────────────┴─────────────┘
                                      │
                                      ▼
                           ┌─────────────────────┐
                           │ INGESTION / RAW DATA│
                           └──────────┬──────────┘
                                      │
                                      ▼
                           ┌─────────────────────┐
                           │ NORMALIZATION       │
                           └──────────┬──────────┘
                                      │
                                      ▼
                           ┌─────────────────────┐
                           │ DEDUPLICATION       │
                           └──────────┬──────────┘
                                      │
                                      ▼
                           ┌─────────────────────┐
                           │ VERIFICATION        │
                           └──────────┬──────────┘
                                      │
                     ┌────────────────┴────────────────┐
                     │                                 │
                     ▼                                 ▼
            ┌─────────────────┐               ┌─────────────────┐
            │ OPPORTUNITIES   │               │ RESEARCH LEADS  │
            └────────┬────────┘               └────────┬────────┘
                     │                                 │
                     └────────────────┬────────────────┘
                                      │
                                      ▼
                           ┌─────────────────────┐
                           │ AI EXTRACTION       │
                           │ + FIT ANALYSIS      │
                           └──────────┬──────────┘
                                      │
                                      ▼
                           ┌─────────────────────┐
                           │ SUPABASE POSTGRES   │
                           │ + RLS + AUTH        │
                           └──────────┬──────────┘
                                      │
                                      ▼
                           ┌─────────────────────┐
                           │ NETLIFY PORTAL      │
                           │                     │
                           │ TODAY               │
                           │ OPPORTUNITIES       │
                           │ RESEARCH LEADS      │
                           │ PROFESSORS          │
                           │ UNIVERSITIES        │
                           │ PIPELINE            │
                           │ DRAFTS              │
                           │ SOURCES             │
                           │ SETTINGS            │
                           └─────────────────────┘
```

---

# 71. FINAL IMPLEMENTATION PRINCIPLE

Build this as a **small, reliable personal intelligence system first**.

Do not chase maximum source count.

The goal is:

```text
HIGH RECALL
+
HIGH PRECISION
+
SOURCE TRACEABILITY
+
LOW DAILY COGNITIVE LOAD
```

The ideal outcome is that the user checks the portal once each day and can confidently answer:

> "What changed in my PhD search, what deserves my attention, and what should I do next?"

That is the definition of a successful V1.
