import Link from 'next/link';
import { firstError, requireSession, rows } from '@/lib/session';
import { deadlineLabel, fmtDate, one, safeSearch } from '@/lib/format';
import { Badge, EmptyState, ErrorNote, PageHeader, ScorePill, StatusBadge } from '@/components/ui';
import { OpportunityCard } from '@/components/OpportunityCard';
import { OPPORTUNITY_STATUSES } from '@/lib/constants';

export const dynamic = 'force-dynamic';

type SP = Promise<Record<string, string | string[] | undefined>>;

const VERIFICATIONS = ['UNVERIFIED', 'NEEDS_VERIFICATION', 'VERIFIED_OFFICIAL', 'EXPIRED', 'CLOSED'];
const FUNDING = ['FULLY_FUNDED', 'PARTIALLY_FUNDED', 'UNFUNDED', 'UNKNOWN'];
const PAGE_LIMIT = 100;

export default async function OpportunitiesPage({ searchParams }: { searchParams: SP }) {
  const sp = await searchParams;
  const { supabase } = await requireSession();

  const q = safeSearch(one(sp.q));
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
  if (country) query = query.eq('country', country);
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
  const anyFilter = Boolean(q || country || university || area || funding || verification || status || minScore);

  return (
    <div className="stack">
      <PageHeader title="Opportunities" description="PhD positions discovered by the intelligence cycle, scored against your profile. Verification status shows how trustworthy each listing is." />
      <ErrorNote message={firstError(list.error, unis.error, countries.error)} />

      <form method="get" className="card">
        <div className="filters">
          <div className="field">
            <label htmlFor="q">Search</label>
            <input id="q" name="q" type="search" defaultValue={q} placeholder="Title, area, funding…" />
          </div>
          <div className="field">
            <label htmlFor="country">Country</label>
            <select id="country" name="country" defaultValue={country}>
              <option value="">All</option>
              {countryOptions.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor="university">University</label>
            <select id="university" name="university" defaultValue={university}>
              <option value="">All</option>
              {unis.rows.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor="area">Research area / keyword</label>
            <input id="area" name="area" defaultValue={area} placeholder="e.g. machine learning" />
          </div>
          <div className="field">
            <label htmlFor="funding">Funding</label>
            <select id="funding" name="funding" defaultValue={funding}>
              <option value="">All</option>
              {FUNDING.map((f) => (
                <option key={f} value={f}>
                  {f.replace(/_/g, ' ')}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor="verification">Verification</label>
            <select id="verification" name="verification" defaultValue={verification}>
              <option value="">All</option>
              {VERIFICATIONS.map((f) => (
                <option key={f} value={f}>
                  {f.replace(/_/g, ' ')}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor="status">Status</label>
            <select id="status" name="status" defaultValue={status}>
              <option value="">All</option>
              {OPPORTUNITY_STATUSES.map((f) => (
                <option key={f} value={f}>
                  {f.replace(/_/g, ' ')}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor="min_score">Minimum match score</label>
            <input id="min_score" name="min_score" type="number" min={0} max={100} defaultValue={minScore || ''} placeholder="0–100" />
          </div>
          <div className="field">
            <label htmlFor="sort">Sort by</label>
            <select id="sort" name="sort" defaultValue={sort}>
              <option value="newest">Newest first</option>
              <option value="deadline">Deadline (soonest)</option>
              <option value="score">Match score (highest)</option>
            </select>
          </div>
          <div className="field">
            <label htmlFor="view">View</label>
            <select id="view" name="view" defaultValue={view}>
              <option value="cards">Cards</option>
              <option value="table">Table</option>
            </select>
          </div>
        </div>
        <div className="row" style={{ marginTop: 12 }}>
          <button type="submit" className="btn btn-primary">
            Apply filters
          </button>
          {anyFilter && (
            <Link href="/opportunities" className="btn">
              Clear
            </Link>
          )}
          <span className="small muted">
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
            The intelligence cycle hasn’t discovered any opportunities yet. Morning Discovery runs on schedule once your <Link href="/settings">profile</Link> is saved; results then appear here.
          </EmptyState>
        )
      ) : view === 'table' ? (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Title</th>
                <th>University</th>
                <th>Country</th>
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
                      <Link href={`/opportunities/${o.id}`}>{o.title || 'Untitled'}</Link>
                    </td>
                    <td>{o.universities?.name ?? '—'}</td>
                    <td>{o.country ?? '—'}</td>
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
        <div className="grid grid-2">
          {list.rows.map((o) => (
            <OpportunityCard key={o.id} opp={o} />
          ))}
        </div>
      )}
    </div>
  );
}
