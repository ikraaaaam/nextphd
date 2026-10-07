import Link from 'next/link';
import { notFound } from 'next/navigation';
import { addOpportunityNote, addToPipeline, setOpportunityStatus, toggleOpportunitySaved } from '../../actions';
import { first, firstError, requireSession, rows } from '@/lib/session';
import { daysUntil, deadlineLabel, fmtDate, fmtDateTime, link, pretty } from '@/lib/format';
import { Badge, ErrorNote, ExternalLink, FitBreakdown, KV, PageHeader, Provenance, ScorePill, Section, StatusBadge } from '@/components/ui';
import { SelectForm } from '@/components/forms';
import { OPPORTUNITY_STATUSES } from '@/lib/constants';

export const dynamic = 'force-dynamic';

export default async function OpportunityDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase } = await requireSession();

  const opp = await first(supabase.from('opportunities').select('*, universities(id,name,website,grad_admissions_url), professors(id,name,homepage), departments(id,name)').eq('id', id).limit(1));
  if (!opp.row && !opp.error) notFound();
  const o = opp.row ?? {};

  const [funding, apps] = await Promise.all([
    rows(supabase.from('funding_intelligence').select('*').eq('opportunity_id', id)),
    rows(supabase.from('applications').select('id,status').eq('opportunity_id', id)),
  ]);

  const dl = deadlineLabel(o.deadline);
  const d = daysUntil(o.deadline);
  const official = link(o.official_url);

  return (
    <div className="stack">
      <PageHeader
        crumb={<Link href="/opportunities">← Opportunities</Link>}
        title={o.title || 'Opportunity'}
        description={[o.universities?.name, o.country].filter(Boolean).join(' · ') || undefined}
        actions={
          <>
            <form action={toggleOpportunitySaved}>
              <input type="hidden" name="id" value={id} />
              <input type="hidden" name="status" value={o.status ?? ''} />
              <button type="submit" className="btn" aria-pressed={o.status === 'SAVED'}>
                {o.status === 'SAVED' ? '★ Saved' : '☆ Save'}
              </button>
            </form>
            {apps.rows[0] ? (
              <Link href={`/applications/${apps.rows[0].id}`} className="btn btn-primary">
                Open application ({pretty(apps.rows[0].status)})
              </Link>
            ) : (
              <form action={addToPipeline}>
                <input type="hidden" name="id" value={id} />
                <button type="submit" className="btn btn-primary">
                  Add to application pipeline
                </button>
              </form>
            )}
          </>
        }
      />
      <ErrorNote message={firstError(opp.error, funding.error, apps.error)} />

      <div className="row">
        <ScorePill score={o.fit_score} />
        <StatusBadge status={o.verification} />
        <StatusBadge status={o.funding_class} fallback="FUNDING UNKNOWN" />
        <StatusBadge status={o.status} />
        <Badge tone={dl.tone}>{o.deadline ? `${fmtDate(o.deadline)} · ${dl.text}` : dl.text}</Badge>
        {o.rolling_admission && <Badge tone="info">Rolling admission</Badge>}
      </div>

      <div className="grid grid-2">
        <div className="card">
          <h3>Position</h3>
          <KV
            items={[
              ['University', o.universities ? <Link key="u" href={`/universities/${o.universities.id}`}>{o.universities.name}</Link> : null],
              ['Department', o.departments?.name],
              ['Country', o.country],
              ['Supervisor', o.professors ? <Link key="p" href={`/professors/${o.professors.id}`}>{o.professors.name}</Link> : null],
              ['Research area', o.field],
              ['Posted', fmtDate(o.posted_on)],
              ['Deadline', o.deadline ? `${fmtDate(o.deadline)}${d !== null ? ` (${d < 0 ? `${-d} days ago` : `${d} days left`})` : ''}` : null],
              ['Eligibility / degree / skills', o.eligibility ? <span key="e" className="pre">{o.eligibility}</span> : null],
              ['English requirement', o.english_req],
              ['Dependents', o.dependents_note],
            ]}
          />
          <p className="small muted" style={{ marginTop: 8 }}>
            Required degree and skills are not stored as separate fields; any stated requirements appear under eligibility.
          </p>
        </div>

        <div className="card">
          <h3>Funding</h3>
          <KV
            items={[
              ['Classification', <StatusBadge key="f" status={o.funding_class} />],
              ['Funding text', o.funding_text ? <span key="t" className="pre">{o.funding_text}</span> : null],
              ['Stipend / salary', o.stipend_amount],
              ['Tuition covered', o.tuition_covered === true ? 'Yes' : o.tuition_covered === false ? 'No' : null],
            ]}
          />
          {funding.rows.length > 0 && (
            <div className="stack-sm" style={{ marginTop: 10 }}>
              {funding.rows.map((f) => (
                <div key={f.id} className="small">
                  <StatusBadge status={f.funding_status} /> {f.stipend_amount ? `${f.stipend_amount} ${f.stipend_currency ?? ''}` : ''}
                  <Provenance sourceUrl={f.source_url} sourceTitle={f.source_title} retrievedAt={f.retrieved_at} verifiedAt={f.last_verified_at} status={f.verification_status} />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="card">
        <h3>Match explanation</h3>
        <p>{o.fit_reason || 'No explanation recorded yet — scores and reasons are produced by Afternoon Verification.'}</p>
        <FitBreakdown value={o.fit_breakdown} />
      </div>

      <div className="card">
        <h3>Source &amp; provenance</h3>
        <KV
          items={[
            ['Source', o.source],
            ['Source URL', <ExternalLink key="s" href={o.source_url}>{o.source_url}</ExternalLink>],
            ['Official URL', <ExternalLink key="o" href={o.official_url}>{o.official_url}</ExternalLink>],
            ['First seen', fmtDateTime(o.first_seen)],
            ['Last seen / verified', fmtDateTime(o.last_seen)],
            ['Last changed', o.last_changed ? fmtDateTime(o.last_changed) : null],
            ['Verification', <StatusBadge key="v" status={o.verification} />],
          ]}
        />
        <p className="small muted" style={{ marginTop: 8 }}>
          {o.verification === 'VERIFIED_OFFICIAL' ? 'Verified against an official source.' : 'Not verified against an official source — confirm details on the official page before applying.'}
        </p>
        <div className="row" style={{ marginTop: 10 }}>
          {link(o.source_url) && (
            <a className="btn btn-sm" href={link(o.source_url)!} target="_blank" rel="noreferrer">
              Open source ↗
            </a>
          )}
          {official && (
            <a className="btn btn-sm" href={official} target="_blank" rel="noreferrer">
              Official page ↗
            </a>
          )}
          {o.universities?.website && link(o.universities.website) && (
            <a className="btn btn-sm" href={link(o.universities.website)!} target="_blank" rel="noreferrer">
              University site ↗
            </a>
          )}
          {o.professors && (
            <Link className="btn btn-sm" href={`/professors/${o.professors.id}`}>
              Professor profile
            </Link>
          )}
          {o.universities && (
            <Link className="btn btn-sm" href={`/universities/${o.universities.id}`}>
              University page
            </Link>
          )}
        </div>
      </div>

      <Section title="Status & notes">
        <div className="grid grid-2">
          <div className="card stack-sm">
            <h3>Update status</h3>
            <SelectForm action={setOpportunityStatus} id={id} options={OPPORTUNITY_STATUSES} current={o.status} label="Opportunity status" />
          </div>
          <div className="card stack-sm">
            <h3>Notes</h3>
            {o.notes ? <p className="pre small">{o.notes}</p> : <p className="small muted">No notes yet.</p>}
            <form action={addOpportunityNote} className="stack-sm">
              <input type="hidden" name="id" value={id} />
              <div className="field">
                <label htmlFor="note">Add a note</label>
                <textarea id="note" name="note" required maxLength={2000} />
              </div>
              <div>
                <button type="submit" className="btn btn-primary btn-sm">
                  Save note
                </button>
              </div>
            </form>
          </div>
        </div>
      </Section>
    </div>
  );
}
