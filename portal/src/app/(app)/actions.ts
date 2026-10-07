'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { requireSession } from '@/lib/session';
import {
  APPLICATION_STATUSES,
  DOCUMENT_CATEGORIES,
  FUNDING_PREFERENCES,
  LINK_PLATFORMS,
  OPPORTUNITY_STATUSES,
  OUTREACH_STATUSES,
  RECOMMENDATION_STATUSES,
  RESPONSE_SENTIMENTS,
  STARTER_UNIVERSITIES,
  TEST_TYPES,
  WORK_TYPES,
} from '@/lib/constants';

// All mutations run with the signed-in user's session (RLS enforced) and always stamp
// owner_id from the verified auth user — never from client-supplied form data.

function text(fd: FormData, key: string, max = 4000): string | null {
  const v = fd.get(key);
  if (typeof v !== 'string') return null;
  const t = v.trim();
  return t ? t.slice(0, max) : null;
}

function required(fd: FormData, key: string, max = 4000): string {
  const v = text(fd, key, max);
  if (!v) throw new Error(`"${key}" is required.`);
  return v;
}

function oneOf<T extends string>(value: string | null, allowed: readonly T[], label: string): T {
  if (!value || !(allowed as readonly string[]).includes(value)) throw new Error(`Invalid ${label}.`);
  return value as T;
}

function dateOrNull(fd: FormData, key: string): string | null {
  const v = text(fd, key, 10);
  if (!v) return null;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(v)) throw new Error(`Invalid date for ${key}.`);
  return v;
}

function listFrom(fd: FormData, key: string): string[] {
  const v = text(fd, key, 4000);
  if (!v) return [];
  return Array.from(new Set(v.split(/[\n,;]+/).map((s) => s.trim()).filter(Boolean)));
}

function check(error: { message: string } | null, what: string) {
  if (error) throw new Error(`${what} failed: ${error.message}`);
}

function refresh() {
  revalidatePath('/', 'layout');
}

// ---------- Favourites ----------
const FAVOURITE_TABLES = ['universities', 'professors', 'research_groups'] as const;

export async function toggleFavourite(fd: FormData) {
  const { supabase, user } = await requireSession();
  const table = oneOf(text(fd, 'table'), FAVOURITE_TABLES, 'table');
  const id = required(fd, 'id');
  const next = text(fd, 'current') !== 'true';
  const { error } = await supabase.from(table).update({ is_favourite: next }).eq('id', id).eq('owner_id', user.id);
  check(error, 'Updating favourite');
  refresh();
}

// ---------- Universities / starter seed / research groups ----------
export async function seedStarterUniversities() {
  const { supabase, user } = await requireSession();
  const records = STARTER_UNIVERSITIES.map((u) => ({ owner_id: user.id, name: u.name, country: u.country, verified: false }));
  // unique(owner_id, name) + ignoreDuplicates => idempotent, never overwrites existing records.
  const { error } = await supabase.from('universities').upsert(records, { onConflict: 'owner_id,name', ignoreDuplicates: true });
  check(error, 'Adding starter universities');
  refresh();
}

export async function addResearchGroup(fd: FormData) {
  const { supabase, user } = await requireSession();
  const { error } = await supabase.from('research_groups').insert({
    owner_id: user.id,
    name: required(fd, 'name', 200),
    university_id: text(fd, 'university_id'),
    website: text(fd, 'website', 500),
    notes: text(fd, 'notes'),
  });
  check(error, 'Adding research group');
  refresh();
}

// ---------- Opportunities ----------
export async function setOpportunityStatus(fd: FormData) {
  const { supabase, user } = await requireSession();
  const status = oneOf(text(fd, 'status'), OPPORTUNITY_STATUSES, 'status');
  const { error } = await supabase.from('opportunities').update({ status }).eq('id', required(fd, 'id')).eq('owner_id', user.id);
  check(error, 'Updating status');
  refresh();
}

export async function toggleOpportunitySaved(fd: FormData) {
  const { supabase, user } = await requireSession();
  const saved = text(fd, 'status') === 'SAVED';
  const { error } = await supabase
    .from('opportunities')
    .update({ status: saved ? 'NEW' : 'SAVED' })
    .eq('id', required(fd, 'id'))
    .eq('owner_id', user.id);
  check(error, 'Saving opportunity');
  refresh();
}

export async function addOpportunityNote(fd: FormData) {
  const { supabase, user } = await requireSession();
  const id = required(fd, 'id');
  const note = required(fd, 'note', 2000);
  const { data, error: readErr } = await supabase.from('opportunities').select('notes').eq('id', id).eq('owner_id', user.id).single();
  check(readErr, 'Reading notes');
  const stamp = new Date().toISOString().slice(0, 10);
  const merged = `${data?.notes ? `${data.notes}\n` : ''}[User note ${stamp}] ${note}`;
  const { error } = await supabase.from('opportunities').update({ notes: merged }).eq('id', id).eq('owner_id', user.id);
  check(error, 'Saving note');
  refresh();
}

export async function addToPipeline(fd: FormData) {
  const { supabase, user } = await requireSession();
  const id = required(fd, 'id');
  const { data: opp, error: readErr } = await supabase
    .from('opportunities')
    .select('id,title,university_id,professor_id,deadline')
    .eq('id', id)
    .eq('owner_id', user.id)
    .single();
  check(readErr, 'Reading opportunity');
  if (!opp) throw new Error('Opportunity not found.');

  const { data: existing } = await supabase.from('applications').select('id').eq('owner_id', user.id).eq('opportunity_id', id).limit(1);
  let applicationId = existing?.[0]?.id as string | undefined;
  if (!applicationId) {
    const { data: created, error } = await supabase
      .from('applications')
      .insert({
        owner_id: user.id,
        opportunity_id: opp.id,
        university_id: opp.university_id,
        professor_id: opp.professor_id,
        title: opp.title || 'Untitled opportunity',
        deadline: opp.deadline,
        status: 'INTERESTED',
      })
      .select('id')
      .single();
    check(error, 'Creating application');
    applicationId = created?.id;
  }
  refresh();
  redirect(`/applications/${applicationId}`);
}

// ---------- Applications ----------
export async function setApplicationStatus(fd: FormData) {
  const { supabase, user } = await requireSession();
  const status = oneOf(text(fd, 'status'), APPLICATION_STATUSES, 'status');
  // The DB trigger records application_status_history on status change.
  const { error } = await supabase.from('applications').update({ status }).eq('id', required(fd, 'id')).eq('owner_id', user.id);
  check(error, 'Updating application status');
  refresh();
}

export async function saveApplicationNotes(fd: FormData) {
  const { supabase, user } = await requireSession();
  const { error } = await supabase
    .from('applications')
    .update({ notes: text(fd, 'notes', 8000), deadline: dateOrNull(fd, 'deadline') })
    .eq('id', required(fd, 'id'))
    .eq('owner_id', user.id);
  check(error, 'Saving application');
  refresh();
}

export async function addApplicationTask(fd: FormData) {
  const { supabase, user } = await requireSession();
  const { error } = await supabase.from('application_tasks').insert({
    owner_id: user.id,
    application_id: required(fd, 'application_id'),
    task_title: required(fd, 'task_title', 300),
    task_type: text(fd, 'task_type', 60),
    due_date: dateOrNull(fd, 'due_date'),
    portfolio_document_id: text(fd, 'portfolio_document_id'),
  });
  check(error, 'Adding task');
  refresh();
}

export async function toggleTask(fd: FormData) {
  const { supabase, user } = await requireSession();
  const completed = text(fd, 'completed') !== 'true';
  const { error } = await supabase.from('application_tasks').update({ completed }).eq('id', required(fd, 'id')).eq('owner_id', user.id);
  check(error, 'Updating task');
  refresh();
}

// ---------- Outreach (approval-before-send: nothing is ever sent automatically) ----------
async function ensureContact(
  supabase: Awaited<ReturnType<typeof requireSession>>['supabase'],
  ownerId: string,
  professorId: string,
  opportunityId: string | null,
): Promise<string> {
  const { data: existing, error } = await supabase.from('outreach_contacts').select('id').eq('owner_id', ownerId).eq('professor_id', professorId).limit(1);
  check(error, 'Reading outreach contact');
  if (existing?.[0]) return existing[0].id as string;
  const { data: created, error: insErr } = await supabase
    .from('outreach_contacts')
    .insert({ owner_id: ownerId, professor_id: professorId, opportunity_id: opportunityId, status: 'TO_CONTACT' })
    .select('id')
    .single();
  check(insErr, 'Creating outreach contact');
  return created!.id as string;
}

export async function startOutreach(fd: FormData) {
  const { supabase, user } = await requireSession();
  await ensureContact(supabase, user.id, required(fd, 'professor_id'), text(fd, 'opportunity_id'));
  refresh();
  redirect('/outreach');
}

export async function updateOutreachStatus(fd: FormData) {
  const { supabase, user } = await requireSession();
  const status = oneOf(text(fd, 'status'), OUTREACH_STATUSES, 'status');
  const id = required(fd, 'id');
  const patch: Record<string, unknown> = { status };
  const { data: current } = await supabase.from('outreach_contacts').select('first_contact_at').eq('id', id).eq('owner_id', user.id).single();
  if (status === 'CONTACTED' && !current?.first_contact_at) {
    patch.first_contact_at = new Date().toISOString();
    patch.last_contact_at = patch.first_contact_at;
  }
  const { error } = await supabase.from('outreach_contacts').update(patch).eq('id', id).eq('owner_id', user.id);
  check(error, 'Updating outreach status');
  refresh();
}

export async function setFollowUp(fd: FormData) {
  const { supabase, user } = await requireSession();
  const date = dateOrNull(fd, 'next_follow_up_at');
  const { error } = await supabase
    .from('outreach_contacts')
    .update({ next_follow_up_at: date ? `${date}T00:00:00Z` : null })
    .eq('id', required(fd, 'id'))
    .eq('owner_id', user.id);
  check(error, 'Setting follow-up');
  refresh();
}

export async function logContact(fd: FormData) {
  const { supabase, user } = await requireSession();
  const contactId = required(fd, 'contact_id');
  const direction = text(fd, 'direction') === 'INBOUND' ? 'INBOUND' : 'OUTBOUND';
  const sentiment = direction === 'INBOUND' ? oneOf(text(fd, 'response_status') ?? 'UNKNOWN', RESPONSE_SENTIMENTS, 'response') : null;
  const now = new Date().toISOString();
  const { error } = await supabase.from('contact_history').insert({
    owner_id: user.id,
    outreach_contact_id: contactId,
    direction,
    contact_method: text(fd, 'contact_method', 40) ?? 'EMAIL',
    contact_date: now,
    subject: text(fd, 'subject', 300),
    summary: text(fd, 'summary'),
    response_status: sentiment,
  });
  check(error, 'Logging contact');
  const { data: c } = await supabase.from('outreach_contacts').select('first_contact_at,status').eq('id', contactId).eq('owner_id', user.id).single();
  const patch: Record<string, unknown> = { last_contact_at: now };
  if (!c?.first_contact_at) patch.first_contact_at = now;
  patch.status = direction === 'INBOUND' ? 'RESPONDED' : c?.status === 'TO_CONTACT' ? 'CONTACTED' : c?.status;
  const { error: upErr } = await supabase.from('outreach_contacts').update(patch).eq('id', contactId).eq('owner_id', user.id);
  check(upErr, 'Updating contact');
  refresh();
}

export async function createDraft(fd: FormData) {
  const { supabase, user } = await requireSession();
  const professorId = required(fd, 'professor_id');
  const opportunityId = text(fd, 'opportunity_id');
  const contactId = await ensureContact(supabase, user.id, professorId, opportunityId);
  const { error } = await supabase.from('outreach_drafts').insert({
    owner_id: user.id,
    professor_id: professorId,
    opportunity_id: opportunityId,
    outreach_contact_id: contactId,
    subject: required(fd, 'subject', 300),
    body: required(fd, 'body', 10000),
    status: 'DRAFT',
  });
  check(error, 'Creating draft');
  refresh();
}

export async function updateDraft(fd: FormData) {
  const { supabase, user } = await requireSession();
  const { error } = await supabase
    .from('outreach_drafts')
    .update({ subject: required(fd, 'subject', 300), body: required(fd, 'body', 10000) })
    .eq('id', required(fd, 'id'))
    .eq('owner_id', user.id)
    .eq('status', 'DRAFT');
  check(error, 'Saving draft');
  refresh();
}

/** Records that the USER sent the draft themselves. The system never sends email. */
export async function markDraftSent(fd: FormData) {
  const { supabase, user } = await requireSession();
  const id = required(fd, 'id');
  const { data: draft, error } = await supabase.from('outreach_drafts').select('id,subject,outreach_contact_id,status').eq('id', id).eq('owner_id', user.id).single();
  check(error, 'Reading draft');
  if (!draft || draft.status !== 'DRAFT') throw new Error('Only drafts can be marked as sent.');
  const { error: upErr } = await supabase.from('outreach_drafts').update({ status: 'SENT' }).eq('id', id).eq('owner_id', user.id);
  check(upErr, 'Marking sent');
  if (draft.outreach_contact_id) {
    const now = new Date().toISOString();
    await supabase.from('contact_history').insert({
      owner_id: user.id,
      outreach_contact_id: draft.outreach_contact_id,
      direction: 'OUTBOUND',
      contact_method: 'EMAIL',
      contact_date: now,
      subject: draft.subject,
      summary: 'Draft marked as sent by user.',
    });
    const { data: c } = await supabase.from('outreach_contacts').select('first_contact_at').eq('id', draft.outreach_contact_id).single();
    await supabase
      .from('outreach_contacts')
      .update({ status: 'CONTACTED', last_contact_at: now, first_contact_at: c?.first_contact_at ?? now })
      .eq('id', draft.outreach_contact_id)
      .eq('owner_id', user.id);
  }
  refresh();
}

// ---------- Portfolio ----------
export async function addPortfolioDocument(fd: FormData) {
  const { supabase, user } = await requireSession();
  const category = oneOf(text(fd, 'category'), DOCUMENT_CATEGORIES, 'category');
  const title = required(fd, 'title', 200);
  const { data: prior } = await supabase.from('portfolio_documents').select('version').eq('owner_id', user.id).eq('category', category).eq('title', title).order('version', { ascending: false }).limit(1);
  const version = ((prior?.[0]?.version as number | undefined) ?? 0) + 1;
  const { error } = await supabase.from('portfolio_documents').insert({
    owner_id: user.id,
    category,
    title,
    description: text(fd, 'description'),
    version,
    file_path: text(fd, 'file_path', 500),
  });
  check(error, 'Adding document');
  refresh();
}

export async function addLanguageTest(fd: FormData) {
  const { supabase, user } = await requireSession();
  const { error } = await supabase.from('language_tests').insert({
    owner_id: user.id,
    test_type: oneOf(text(fd, 'test_type'), TEST_TYPES, 'test type'),
    test_date: dateOrNull(fd, 'test_date'),
    total_score: text(fd, 'total_score', 40),
    expiry_date: dateOrNull(fd, 'expiry_date'),
    notes: text(fd, 'notes'),
  });
  check(error, 'Adding test score');
  refresh();
}

export async function addRecommendation(fd: FormData) {
  const { supabase, user } = await requireSession();
  const { error } = await supabase.from('recommendation_letters').insert({
    owner_id: user.id,
    recommender_name: required(fd, 'recommender_name', 200),
    recommender_title: text(fd, 'recommender_title', 200),
    recommender_institution: text(fd, 'recommender_institution', 200),
    recommender_email: text(fd, 'recommender_email', 200),
    application_id: text(fd, 'application_id'),
    deadline: dateOrNull(fd, 'deadline'),
    requested_date: dateOrNull(fd, 'requested_date'),
    status: 'REQUESTED',
  });
  check(error, 'Adding recommendation');
  refresh();
}

export async function updateRecommendationStatus(fd: FormData) {
  const { supabase, user } = await requireSession();
  const status = oneOf(text(fd, 'status'), RECOMMENDATION_STATUSES, 'status');
  const patch: Record<string, unknown> = { status };
  if (status === 'RECEIVED') patch.received_date = new Date().toISOString().slice(0, 10);
  const { error } = await supabase.from('recommendation_letters').update(patch).eq('id', required(fd, 'id')).eq('owner_id', user.id);
  check(error, 'Updating recommendation');
  refresh();
}

export async function addPortfolioLink(fd: FormData) {
  const { supabase, user } = await requireSession();
  const url = required(fd, 'url', 500);
  if (!/^https?:\/\//i.test(url)) throw new Error('Links must start with http:// or https://');
  const { error } = await supabase.from('portfolio_links').insert({
    owner_id: user.id,
    platform: oneOf(text(fd, 'platform'), LINK_PLATFORMS, 'platform'),
    url,
    description: text(fd, 'description'),
  });
  check(error, 'Adding link');
  refresh();
}

export async function addPortfolioWork(fd: FormData) {
  const { supabase, user } = await requireSession();
  const { error } = await supabase.from('publications').insert({
    owner_id: user.id,
    title: required(fd, 'title', 400),
    work_type: oneOf(text(fd, 'work_type'), WORK_TYPES, 'work type'),
    publication_date: dateOrNull(fd, 'publication_date'),
    source_url: text(fd, 'source_url', 500),
    is_user_portfolio: true,
  });
  check(error, 'Adding work');
  refresh();
}

// ---------- Settings / profile ----------
export async function saveSettings(fd: FormData) {
  const { supabase, user } = await requireSession();
  const funding = oneOf(text(fd, 'funding') ?? 'FULLY_FUNDED', FUNDING_PREFERENCES, 'funding preference');
  const minScoreRaw = Number(text(fd, 'min_score') ?? '60');
  if (!Number.isInteger(minScoreRaw) || minScoreRaw < 0 || minScoreRaw > 100) throw new Error('Minimum match score must be 0–100.');
  const countries = listFrom(fd, 'countries');
  const interests = listFrom(fd, 'interests');
  const { error } = await supabase.from('settings').upsert(
    {
      owner_id: user.id,
      countries,
      subjects: listFrom(fd, 'research_areas'),
      keywords: listFrom(fd, 'keywords'),
      exclude_keywords: listFrom(fd, 'exclude_keywords'),
      min_score: minScoreRaw,
      profile_summary: text(fd, 'profile_summary', 4000),
      academic_background: { degrees: listFrom(fd, 'degrees'), summary: text(fd, 'academic_summary', 2000) },
      research_background: { interests, experience: text(fd, 'research_experience', 4000), publications: listFrom(fd, 'publications_list') },
      technical_skills: { skills: listFrom(fd, 'skills') },
      preferences: { funding, countries, universities: listFrom(fd, 'universities'), research_areas: listFrom(fd, 'research_areas') },
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'owner_id' },
  );
  check(error, 'Saving settings');
  refresh();
}
