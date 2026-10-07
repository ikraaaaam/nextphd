import Link from 'next/link';
import { notFound } from 'next/navigation';
import { addResearchGroup } from '../../actions';
import { first, firstError, requireSession, rows } from '@/lib/session';
import { fmtDate, fmtDateTime, link, type Row } from '@/lib/format';
import { Badge, EmptyState, ErrorNote, ExternalLink, KV, PageHeader, Provenance, ScorePill, Section, StatusBadge } from '@/components/ui';
import { FavouriteButton } from '@/components/forms';

export const dynamic = 'force-dynamic';

export default async function UniversityDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase } = await requireSession();

  const uni = await first(supabase.from('universities').select('*').eq('id', id).limit(1));
  if (!uni.row && !uni.error) notFound();
  const u = uni.row ?? {};

  const [depts, profs, opps, signals, groups, funding, living, visa, health] = await Promise.all([
    rows(supabase.from('departments').select('*').eq('university_id', id).order('name')),
    rows(supabase.from('professors').select('*').eq('university_id', id).order('fit_score', { ascending: false, nullsFirst: false })),
    rows(supabase.from('opportunities').select('id,title,professor_id,department_id,fit_score,deadline,verification,funding_class').eq('university_id', id)),
    rows(supabase.from('research_signals').select('id,title,signal_date,created_at,professors(name)').eq('university_id', id).order('created_at', { ascending: false }).limit(10)),
    rows(supabase.from('research_groups').select('*').eq('university_id', id).order('name')),
    rows(supabase.from('funding_intelligence').select('*').eq('university_id', id)),
    rows(supabase.from('living_costs').select('*').eq('university_id', id)),
    rows(supabase.from('visa_intelligence').select('*').eq('university_id', id)),
    rows(supabase.from('healthcare_intelligence').select('*').eq('university_id', id)),
  ]);

  const err = firstError(uni.error, depts.error, profs.error, opps.error, signals.error, groups.error, funding.error, living.error, visa.error, health.error);
  const oppsByProf = (pid: string) => opps.rows.filter((o) => o.professor_id === pid);
  const profsByDept = (did: string | null) => profs.rows.filter((p) => (p.department_id ?? null) === did);
  const orphanOpps = opps.rows.filter((o) => !o.professor_id);

  const ProfNode = ({ p }: { p: Row }) => (
    <li>
      <Link href={`/professors/${p.id}`}>{p.name}</Link> <ScorePill score={p.fit_score} />
      {oppsByProf(p.id).length > 0 && (
        <ul className="tree" style={{ marginTop: 6 }}>
          {oppsByProf(p.id).map((o) => (
            <li key={o.id} className="small">
              Opportunity: <Link href={`/opportunities/${o.id}`}>{o.title}</Link>
            </li>
          ))}
        </ul>
      )}
    </li>
  );

  return (
    <div className="stack">
      <PageHeader
        crumb={<Link href="/universities">← Universities</Link>}
        title={u.name || 'University'}
        description={[u.city, u.country].filter(Boolean).join(', ') || undefined}
        actions={u.id ? <FavouriteButton table="universities" id={u.id} current={u.is_favourite} name={u.name} /> : null}
      />
      <ErrorNote message={err} />
      <div className="row">
        <Badge tone={u.verified ? 'ok' : 'warn'}>{u.verified ? `Verified ${fmtDate(u.verified_on)}` : 'Unverified'}</Badge>
        {u.is_favourite && <Badge tone="info">Favourite</Badge>}
        {u.funding_model && <Badge tone="neutral">{u.funding_model}</Badge>}
      </div>

      <div className="grid grid-2">
        <div className="card">
          <h3>Overview</h3>
          <KV
            items={[
              ['Website', <ExternalLink key="w" href={u.website}>{u.website}</ExternalLink>],
              ['Admissions page', <ExternalLink key="a" href={u.grad_admissions_url}>{u.grad_admissions_url}</ExternalLink>],
              ['City', u.city],
              ['Country', u.country],
              ['Research output', u.works_count ? `${u.works_count.toLocaleString()} works · ${(u.cited_by_count ?? 0).toLocaleString()} citations (OpenAlex)` : null],
              ['Last updated', fmtDateTime(u.updated_at)],
            ]}
          />
          <Provenance sourceUrl={u.source_url} verifiedAt={u.verified_on} status={u.verified ? 'VERIFIED' : 'UNVERIFIED'} />
        </div>
        <div className="card">
          <h3>Funding, admissions &amp; living notes</h3>
          <KV
            items={[
              ['Funding model', u.funding_model],
              ['Stipend notes', u.stipend_note],
              ['GPA notes', u.gpa_note],
              ['Family / dependents', u.family_note],
              ['Muslim-environment notes', u.muslim_env_note],
            ]}
          />
          {!u.funding_model && !u.stipend_note && !u.gpa_note && !u.family_note && !u.muslim_env_note && (
            <p className="small muted" style={{ marginTop: 8 }}>No notes recorded yet. These fields are only filled from sourced information.</p>
          )}
        </div>
      </div>

      <Section title="Structure" hint="University → Departments → Professors → Opportunities">
        {depts.rows.length === 0 && profs.rows.length === 0 && opps.rows.length === 0 ? (
          <EmptyState title="Nothing recorded under this university yet">Departments, professors and opportunities appear here once the intelligence cycle finds them.</EmptyState>
        ) : (
          <div className="card">
            <ul className="tree">
              {depts.rows.map((d) => (
                <li key={d.id}>
                  <strong>{d.name}</strong> <span className="small muted">department</span>
                  <ul className="tree" style={{ marginTop: 6 }}>
                    {profsByDept(d.id).length === 0 ? <li className="small muted">No professors recorded</li> : profsByDept(d.id).map((p) => <ProfNode key={p.id} p={p} />)}
                  </ul>
                </li>
              ))}
              {profsByDept(null).length > 0 && (
                <li>
                  <strong>Professors without a department</strong>
                  <ul className="tree" style={{ marginTop: 6 }}>
                    {profsByDept(null).map((p) => (
                      <ProfNode key={p.id} p={p} />
                    ))}
                  </ul>
                </li>
              )}
              {orphanOpps.length > 0 && (
                <li>
                  <strong>Opportunities without a named professor</strong>
                  <ul className="tree" style={{ marginTop: 6 }}>
                    {orphanOpps.map((o) => (
                      <li key={o.id} className="small">
                        <Link href={`/opportunities/${o.id}`}>{o.title}</Link>
                      </li>
                    ))}
                  </ul>
                </li>
              )}
            </ul>
          </div>
        )}
      </Section>

      <Section title="Research activity">
        <div className="grid grid-2">
          <div className="card">
            <h3>Recent research signals</h3>
            {signals.rows.length === 0 ? (
              <p className="small muted">No signals recorded.</p>
            ) : (
              <ul className="list">
                {signals.rows.map((s) => (
                  <li key={s.id}>
                    {s.title} <span className="small muted">· {s.professors?.name ?? 'Unknown'} · {fmtDate(s.signal_date || s.created_at)}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div className="card stack-sm">
            <h3>Research groups</h3>
            {groups.rows.length === 0 ? (
              <p className="small muted">No research groups recorded.</p>
            ) : (
              <ul className="list">
                {groups.rows.map((g) => (
                  <li key={g.id} className="row-between">
                    <span>
                      {g.name} {link(g.website) && <a className="small" href={g.website} target="_blank" rel="noreferrer">website ↗</a>}
                    </span>
                    <FavouriteButton table="research_groups" id={g.id} current={g.is_favourite} name={g.name} />
                  </li>
                ))}
              </ul>
            )}
            <form action={addResearchGroup} className="form-grid">
              <input type="hidden" name="university_id" value={id} />
              <div className="field">
                <label htmlFor="rg-name">Add research group</label>
                <input id="rg-name" name="name" type="text" required maxLength={200} />
              </div>
              <div className="field">
                <label htmlFor="rg-web">Website (optional)</label>
                <input id="rg-web" name="website" type="url" />
              </div>
              <div>
                <button type="submit" className="btn btn-sm">
                  Add group
                </button>
              </div>
            </form>
          </div>
        </div>
      </Section>

      <Section title="Funding & relocation evidence" actions={<Link href="/funding">Funding &amp; Relocation →</Link>}>
        {funding.rows.length + living.rows.length + visa.rows.length + health.rows.length === 0 ? (
          <EmptyState title="No funding or relocation evidence for this university yet" />
        ) : (
          <div className="grid grid-2">
            {funding.rows.map((f) => (
              <div key={f.id} className="card">
                <StatusBadge status={f.funding_status} />
                <p className="small">{f.stipend_amount ? `Stipend ${f.stipend_amount} ${f.stipend_currency ?? ''}` : 'Stipend not stated'}</p>
                <Provenance sourceUrl={f.source_url} sourceTitle={f.source_title} retrievedAt={f.retrieved_at} verifiedAt={f.last_verified_at} status={f.verification_status} />
              </div>
            ))}
            {living.rows.map((l) => (
              <div key={l.id} className="card">
                <strong>
                  {l.cost_category}: {l.estimate_amount} {l.currency}/{String(l.period).toLowerCase()}
                </strong>
                <Provenance sourceUrl={l.source_url} sourceTitle={l.source_title} retrievedAt={l.retrieved_at} verifiedAt={l.last_verified_at} status={l.verification_status} />
              </div>
            ))}
          </div>
        )}
      </Section>
    </div>
  );
}
