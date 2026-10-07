import Link from 'next/link';
import { firstError, requireSession, rows } from '@/lib/session';
import { deadlineLabel, fmtDate, one, safeSearch } from '@/lib/format';
import { Badge, EmptyState, ErrorNote, PageHeader, ScorePill, StatusBadge } from '@/components/ui';
import { OpportunityCard } from '@/components/OpportunityCard';
import { CountryFilter } from '@/components/CountryFilter';
import { COUNTRY_CATALOGUE, OPPORTUNITY_STATUSES } from '@/lib/constants';

export const dynamic = 'force-dynamic';

type SP = Promise<Record<string, string | string[] | undefined>>;

const VERIFICATIONS = ['UNVERIFIED', 'NEEDS_VERIFICATION', 'VERIFIED_OFFICIAL', 'EXPIRED', 'CLOSED'];
const FUNDING = ['FULLY_FUNDED', 'PARTIALLY_FUNDED', 'UNFUNDED', 'UNKNOWN'];
const PAGE_LIMIT = 100;

export default async function OpportunitiesPage({ searchParams }: { searchParams: SP }) {
  const sp = await searchParams;
  const { supabase } = await requireSession();

  const q = safeSearch(one(sp.q));
  const region = one(sp.region);
  const country = one(sp.country);
  const university = one(sp.university);
  const area = safeSearch(one(sp.area));
  const funding = one(sp.funding);
  const verification = one(sp.verification);
  const status = one(sp.status);
  const minScore = Number(one(sp.min_score)) || 0;
  const sort = one(sp.sort) || 'newest';
  const view = one(sp.view) === 'table' ? 'table' : 'cards';

  let query = supabase.from('opportunities').select('*, universities(id,name), professors(id,name)').limit(PAGE_LIMIT);
  if (q) query = query.or(`title.ilike.%${q}%,field.ilike.%${q}%,funding_text.ilike.%${q}%,eligibility.ilike.%${q}%`);
  
  if (country) {
    query = query.eq('country', country);
  } else if (region && COUNTRY_CATALOGUE[region]) {
    query = query.in('country', COUNTRY_CATALOGUE[region]);
  }

  if (university) query = query.eq('university_id', university);
  if (area) query = query.ilike('field', `%${area}%`);
  if (funding) query = query.eq('funding_class', funding);
  if (verification) query = query.eq('verification', verification);
  if (status) query = query.eq('status', status);
  if (minScore > 0) query = query.gte('fit_score', minScore);
  if (sort === 'deadline') query = query.order('deadline', { ascending: true, nullsFirst: false });
  else if (sort === 'score') query = query.order('fit_score', { ascending: false, nullsFirst: false });
  else query = query.order('first_seen', { ascending: false });

  const [list, unis, countries] = await Promise.all([
    rows(query),
    rows(supabase.from('universities').select('id,name').order('name')),
    rows(supabase.from('opportunities').select('country').not('country', 'is', null).limit(2000)),
  ]);
  const countryOptions = Array.from(new Set(countries.rows.map((r) => r.country as string))).sort();
  const anyFilter = Boolean(q || region || country || university || area || funding || verification || status || minScore);

  return (
    <div>
      <PageHeader title="Opportunities" description="PhD positions discovered by the intelligence cycle, evaluated and scored against your profile." />
      <ErrorNote message={firstError(list.error, unis.error, countries.error)} />

      <form method="get" className="card" style={{ marginBottom: '24px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label htmlFor="q">Search</label>
            <input id="q" name="q" className="form-control" type="search" defaultValue={q} placeholder="Title, area, funding…" />
          </div>
          <CountryFilter defaultRegion={region} defaultCountry={country} />
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label htmlFor="university">University</label>
            <select id="university" name="university" className="form-control" defaultValue={university}>
              <option value="">All Universities</option>
              {unis.rows.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name}
                </option>
              ))}
            </select>
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label htmlFor="area">Research Area</label>
            <input id="area" name="area" className="form-control" defaultValue={area} placeholder="e.g. machine learning" />
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label htmlFor="funding">Funding status</label>
            <select id="funding" name="funding" className="form-control" defaultValue={funding}>
              <option value="">All Statuses</option>
              {FUNDING.map((f) => (
                <option key={f} value={f}>
                  {f.replace(/_/g, ' ')}
                </option>
              ))}
            </select>
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label htmlFor="verification">Verification</label>
            <select id="verification" name="verification" className="form-control" defaultValue={verification}>
              <option value="">All</option>
              {VERIFICATIONS.map((f) => (
                <option key={f} value={f}>
                  {f.replace(/_/g, ' ')}
                </option>
              ))}
            </select>
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label htmlFor="status">Application Status</label>
            <select id="status" name="status" className="form-control" defaultValue={status}>
              <option value="">All</option>
              {OPPORTUNITY_STATUSES.map((f) => (
                <option key={f} value={f}>
                  {f.replace(/_/g, ' ')}
                </option>
              ))}
            </select>
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label htmlFor="min_score">Minimum Match Score</label>
            <input id="min_score" name="min_score" className="form-control" type="number" min={0} max={100} defaultValue={minScore || ''} placeholder="e.g. 75" />
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label htmlFor="sort">Sort By</label>
            <select id="sort" name="sort" className="form-control" defaultValue={sort}>
              <option value="newest">Newest first</option>
              <option value="deadline">Deadline (soonest)</option>
              <option value="score">Match score (highest)</option>
            </select>
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label htmlFor="view">Layout</label>
            <select id="view" name="view" className="form-control" defaultValue={view}>
              <option value="cards">Cards View</option>
              <option value="table">Data Table</option>
            </select>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '16px', paddingTop: '16px', borderTop: '1px solid var(--border)' }}>
          <button type="submit" className="btn btn-primary">
            Search & Filter
          </button>
          {anyFilter && (
            <Link href="/opportunities" className="btn">
              Clear filters
            </Link>
          )}
          <span style={{ marginLeft: 'auto', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            {list.rows.length} result{list.rows.length === 1 ? '' : 's'}
            {list.rows.length === PAGE_LIMIT ? ` (showing first ${PAGE_LIMIT})` : ''}
          </span>
        </div>
      </form>

      {list.rows.length === 0 ? (
        anyFilter ? (
          <EmptyState title="No opportunities match these filters" action={<Link href="/opportunities" className="btn">Clear filters</Link>}>
            Try removing a filter or lowering the minimum match score.
          </EmptyState>
        ) : (
          <EmptyState title="No opportunities yet">
            The intelligence cycle hasn’t discovered any opportunities yet. Morning Discovery runs on schedule once your <Link href="/settings" style={{ fontWeight: 600, textDecoration: 'underline' }}>profile</Link> is saved; results then appear here.
          </EmptyState>
        )
      ) : view === 'table' ? (
        <div className="card" style={{ padding: 0, overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Title</th>
                <th>University</th>
                <th>Area</th>
                <th>Match</th>
                <th>Funding</th>
                <th>Deadline</th>
                <th>Verification</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {list.rows.map((o) => {
                const dl = deadlineLabel(o.deadline);
                return (
                  <tr key={o.id}>
                    <td>
                      <Link href={`/opportunities/${o.id}`} style={{ fontWeight: 600 }}>{o.title || 'Untitled'}</Link>
                    </td>
                    <td>{o.universities?.name ?? '—'}<br/><span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{o.country ?? ''}</span></td>
                    <td>{o.field ?? '—'}</td>
                    <td>
                      <ScorePill score={o.fit_score} />
                    </td>
                    <td>
                      <StatusBadge status={o.funding_class} />
                    </td>
                    <td>
                      {fmtDate(o.deadline)} <Badge tone={dl.tone}>{dl.text}</Badge>
                    </td>
                    <td>
                      <StatusBadge status={o.verification} />
                    </td>
                    <td>
                      <StatusBadge status={o.status} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="grid-cards">
          {list.rows.map((o) => (
            <OpportunityCard key={o.id} opp={o} />
          ))}
        </div>
      )}
    </div>
  );
}
