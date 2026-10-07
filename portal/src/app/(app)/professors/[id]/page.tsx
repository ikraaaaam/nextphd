import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createDraft, startOutreach } from '../../actions';
import { first, firstError, requireSession, rows } from '@/lib/session';
import { asList, fmtDate, link } from '@/lib/format';
import { Badge, EmptyState, ErrorNote, ExternalLink, FitBreakdown, KV, PageHeader, Provenance, ScorePill, Section, StatusBadge } from '@/components/ui';
import { FavouriteButton } from '@/components/forms';
import { OpportunityCard } from '@/components/OpportunityCard';

export const dynamic = 'force-dynamic';

export default async function ProfessorDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase } = await requireSession();

  const prof = await first(supabase.from('professors').select('*, universities(id,name), departments(id,name)').eq('id', id).limit(1));
  if (!prof.row && !prof.error) notFound();
  const p = prof.row ?? {};

  const [projects, grants, pubs, signals, leads, opps, contacts, drafts] = await Promise.all([
    rows(supabase.from('professor_projects').select('*').eq('professor_id', id).order('is_active', { ascending: false })),
    rows(supabase.from('professor_funding').select('*').eq('professor_id', id).order('year_awarded', { ascending: false, nullsFirst: false })),
    rows(supabase.from('publications').select('*').eq('professor_id', id).order('publication_date', { ascending: false, nullsFirst: false }).limit(15)),
    rows(supabase.from('research_signals').select('*').eq('professor_id', id).order('created_at', { ascending: false }).limit(10)),
    rows(supabase.from('research_leads').select('*').eq('professor_id', id).order('created_at', { ascending: false })),
    rows(supabase.from('opportunities').select('*, universities(id,name), professors(id,name)').eq('professor_id', id)),
    rows(supabase.from('outreach_contacts').select('*, contact_history(*)').eq('professor_id', id)),
    rows(supabase.from('outreach_drafts').select('*').eq('professor_id', id).order('created_at', { ascending: false })),
  ]);
  const err = firstError(prof.error, projects.error, grants.error, pubs.error, signals.error, leads.error, opps.error, contacts.error, drafts.error);
  const topics = asList(p.recent_topics);
  const contact = contacts.rows[0];
  const history = (contact?.contact_history ?? []) as Array<Record<string, string>>;
  const email = p.email_public as string | null;

  return (
    <div className="stack">
      <PageHeader
        crumb={<Link href="/professors">← Professors</Link>}
        title={p.name || 'Professor'}
        description={[p.universities?.name, p.departments?.name || p.department].filter(Boolean).join(' · ') || undefined}
        actions={
          p.id ? (
            <>
              <FavouriteButton table="professors" id={p.id} current={p.is_favourite} name={p.name} />
              {!contact && (
                <form action={startOutreach}>
                  <input type="hidden" name="professor_id" value={p.id} />
                  <button type="submit" className="btn btn-primary">
                    Start outreach tracking
                  </button>
                </form>
              )}
            </>
          ) : null
        }
      />
      <ErrorNote message={err} />

      <div className="row">
        <ScorePill score={p.fit_score} />
        <StatusBadge status={p.recruiting_signal === 'none' ? 'NO RECRUITING SIGNAL' : p.recruiting_signal} />
        {p.intl_student_signal && <Badge tone="info">Intl students: {p.intl_student_signal}</Badge>}
        {p.is_favourite && <Badge tone="info">Favourite</Badge>}
      </div>

      <div className="grid grid-2">
        <div className="card">
          <h3>Profile</h3>
          <KV
            items={[
              ['University', p.universities ? <Link key="u" href={`/universities/${p.universities.id}`}>{p.universities.name}</Link> : null],
              ['Department', p.departments?.name || p.department],
              ['Official website', <ExternalLink key="h" href={p.homepage}>{p.homepage}</ExternalLink>],
              ['Public email', email ? <a key="e" href={`mailto:${email}`}>{email}</a> : null],
              ['h-index', p.h_index],
              ['Works / citations', p.works_count != null ? `${p.works_count} works · ${p.cited_by_count ?? 0} citations` : null],
              ['Research interests', topics.length ? topics.join(' · ') : null],
            ]}
          />
          <Provenance sourceUrl={p.openalex_author_id ? `https://openalex.org/${p.openalex_author_id}` : null} sourceTitle="OpenAlex author record" retrievedAt={p.updated_at} />
        </div>
        <div className="card">
          <h3>Match explanation</h3>
          <p>{p.fit_reason || 'No explanation recorded yet.'}</p>
          <FitBreakdown value={p.fit_breakdown} />
          <p className="small muted" style={{ marginTop: 8 }}>
            Scores are computed deterministically from your profile and the professor’s recent topics — not an AI opinion.
          </p>
        </div>
      </div>

      <Section title="Active projects & funding evidence">
        <div className="grid grid-2">
          <div className="card">
            <h3>Projects</h3>
            {projects.rows.length === 0 ? (
              <p className="small muted">No projects recorded.</p>
            ) : (
              <ul className="list">
                {projects.rows.map((pr) => (
                  <li key={pr.id}>
                    <strong>{pr.title}</strong> <Badge tone={pr.is_active ? 'ok' : 'neutral'}>{pr.is_active ? 'Active' : 'Inactive'}</Badge>
                    {pr.description && <p className="small muted">{pr.description}</p>}
                    <Provenance sourceUrl={pr.url} sourceTitle={pr.evidence_source ?? undefined} retrievedAt={pr.updated_at} />
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div className="card">
            <h3>Grants / funding evidence</h3>
            {grants.rows.length === 0 ? (
              <p className="small muted">No funding evidence recorded.</p>
            ) : (
              <ul className="list">
                {grants.rows.map((g) => (
                  <li key={g.id}>
                    <strong>{g.funding_org}</strong> {g.grant_name && `— ${g.grant_name}`} <StatusBadge status={g.status} />
                    <div className="small muted">{[g.amount, g.year_awarded].filter(Boolean).join(' · ')}</div>
                    <Provenance sourceUrl={g.evidence_url} retrievedAt={g.updated_at} />
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </Section>

      <Section title="Recent publications" hint="Retrieved from OpenAlex.">
        {pubs.rows.length === 0 ? (
          <EmptyState title="No publications stored" />
        ) : (
          <div className="card">
            <ul className="list">
              {pubs.rows.map((pub) => (
                <li key={pub.id}>
                  {link(pub.source_url) ? (
                    <a href={pub.source_url} target="_blank" rel="noreferrer">
                      {pub.title}
                    </a>
                  ) : (
                    pub.title
                  )}
                  <span className="small muted"> · {fmtDate(pub.publication_date)}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </Section>

      <Section title="Research signals & leads">
        <div className="grid grid-2">
          <div className="card">
            <h3>Signals</h3>
            {signals.rows.length === 0 ? (
              <p className="small muted">No signals.</p>
            ) : (
              <ul className="list">
                {signals.rows.map((s) => (
                  <li key={s.id}>
                    <strong>{s.title}</strong> <Badge tone="info">Signal</Badge>
                    {s.summary && <p className="small muted">{s.summary}</p>}
                    <Provenance sourceUrl={s.source_url} retrievedAt={s.created_at} />
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div className="card">
            <h3>Leads</h3>
            {leads.rows.length === 0 ? (
              <p className="small muted">No research leads.</p>
            ) : (
              <ul className="list">
                {leads.rows.map((l) => (
                  <li key={l.id}>
                    <strong>{l.title}</strong> <StatusBadge status={l.status} /> <ScorePill score={l.fit_score} />
                    {l.description && <p className="small muted">{l.description}</p>}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </Section>

      <Section title="Related opportunities">
        {opps.rows.length === 0 ? <EmptyState title="No opportunities linked to this professor" /> : <div className="grid grid-2">{opps.rows.map((o) => <OpportunityCard key={o.id} opp={o} compact />)}</div>}
      </Section>

      <Section title="Outreach" hint="Drafts are never sent automatically — you send them yourself and then mark them sent.">
        <div className="grid grid-2">
          <div className="card stack-sm">
            <h3>Contact history</h3>
            {!contact ? (
              <p className="small muted">Outreach tracking hasn’t started for this professor.</p>
            ) : (
              <>
                <div className="row">
                  <StatusBadge status={contact.status} />
                  <Link href="/outreach" className="small">
                    Manage in Outreach →
                  </Link>
                </div>
                {history.length === 0 ? (
                  <p className="small muted">No messages logged.</p>
                ) : (
                  <ul className="list small">
                    {history.map((h) => (
                      <li key={h.id}>
                        {fmtDate(h.contact_date)} · {h.direction} · {h.subject || h.summary || 'no subject'} {h.response_status && <StatusBadge status={h.response_status} />}
                      </li>
                    ))}
                  </ul>
                )}
              </>
            )}
            {drafts.rows.length > 0 && <p className="small muted">{drafts.rows.length} draft(s) — see Outreach.</p>}
          </div>
          <form action={createDraft} className="card stack-sm">
            <h3>New outreach draft</h3>
            <input type="hidden" name="professor_id" value={id} />
            <div className="field">
              <label htmlFor="d-subject">Subject</label>
              <input id="d-subject" name="subject" type="text" required maxLength={300} />
            </div>
            <div className="field">
              <label htmlFor="d-body">Message</label>
              <textarea id="d-body" name="body" required maxLength={10000} />
            </div>
            <div>
              <button type="submit" className="btn btn-primary btn-sm">
                Save as draft
              </button>
            </div>
          </form>
        </div>
      </Section>
    </div>
  );
}
