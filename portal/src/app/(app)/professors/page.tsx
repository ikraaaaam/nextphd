import Link from 'next/link';
import { firstError, requireSession, rows } from '@/lib/session';
import { asList, fmtDate, one, safeSearch } from '@/lib/format';
import { Badge, EmptyState, ErrorNote, PageHeader, ScorePill, StatusBadge } from '@/components/ui';
import { FavouriteButton } from '@/components/forms';

export const dynamic = 'force-dynamic';

export default async function ProfessorsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams;
  const { supabase } = await requireSession();
  const q = safeSearch(one(sp.q));
  const university = one(sp.university);
  const fav = one(sp.fav) === '1';
  const minScore = Number(one(sp.min_score)) || 0;
  const sort = one(sp.sort) || 'score';

  let query = supabase.from('professors').select('*, universities(id,name,country)').limit(200);
  if (q) query = query.or(`name.ilike.%${q}%,department.ilike.%${q}%`);
  if (university) query = query.eq('university_id', university);
  if (fav) query = query.eq('is_favourite', true);
  if (minScore) query = query.gte('fit_score', minScore);
  query = sort === 'name' ? query.order('name') : sort === 'activity' ? query.order('updated_at', { ascending: false }) : query.order('fit_score', { ascending: false, nullsFirst: false });

  const [list, unis, pubs] = await Promise.all([
    rows(query),
    rows(supabase.from('universities').select('id,name').order('name')),
    rows(supabase.from('publications').select('professor_id,publication_date').not('professor_id', 'is', null).limit(5000)),
  ]);
  const pubCount = pubs.rows.reduce<Record<string, number>>((m, p) => ((m[p.professor_id] = (m[p.professor_id] ?? 0) + 1), m), {});
  const anyFilter = Boolean(q || university || fav || minScore);

  return (
    <div className="stack">
      <PageHeader title="Professors" description="Researchers you are tracking, ranked by explainable fit with your profile." />
      <ErrorNote message={firstError(list.error, unis.error, pubs.error)} />

      <form method="get" className="card">
        <div className="filters">
          <div className="field">
            <label htmlFor="q">Search</label>
            <input id="q" name="q" type="search" defaultValue={q} placeholder="Name or department" />
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
            <label htmlFor="min_score">Minimum fit score</label>
            <input id="min_score" name="min_score" type="number" min={0} max={100} defaultValue={minScore || ''} />
          </div>
          <div className="field">
            <label htmlFor="sort">Sort by</label>
            <select id="sort" name="sort" defaultValue={sort}>
              <option value="score">Fit score</option>
              <option value="activity">Recently updated</option>
              <option value="name">Name</option>
            </select>
          </div>
          <label className="check" style={{ marginBottom: 8 }}>
            <input type="checkbox" name="fav" value="1" defaultChecked={fav} /> Favourites only
          </label>
        </div>
        <div className="row" style={{ marginTop: 12 }}>
          <button type="submit" className="btn btn-primary">
            Apply filters
          </button>
          {anyFilter && (
            <Link href="/professors" className="btn">
              Clear
            </Link>
          )}
          <span className="small muted">{list.rows.length} professors</span>
        </div>
      </form>

      {list.rows.length === 0 ? (
        anyFilter ? (
          <EmptyState title="No professors match these filters" />
        ) : (
          <EmptyState title="No professors yet">Professors are added during Afternoon Verification, which also scores their fit against your <Link href="/settings">profile</Link>.</EmptyState>
        )
      ) : (
        <div className="grid grid-2">
          {list.rows.map((p) => {
            const topics = asList(p.recent_topics).slice(0, 4);
            return (
              <article key={p.id} className="card stack-sm">
                <div className="row-between" style={{ alignItems: 'flex-start' }}>
                  <h3 style={{ marginBottom: 0 }}>
                    <Link href={`/professors/${p.id}`}>{p.name}</Link>
                  </h3>
                  <FavouriteButton table="professors" id={p.id} current={p.is_favourite} name={p.name} />
                </div>
                <p className="small muted">
                  {p.universities ? <Link href={`/universities/${p.universities.id}`}>{p.universities.name}</Link> : 'University not recorded'}
                  {p.department ? ` · ${p.department}` : ''}
                </p>
                <div className="row">
                  <ScorePill score={p.fit_score} />
                  <StatusBadge status={p.recruiting_signal === 'none' ? 'NO RECRUITING SIGNAL' : p.recruiting_signal} />
                  <Badge tone="neutral">{pubCount[p.id] ?? 0} publications stored</Badge>
                  {p.h_index != null && <Badge tone="info">h-index {p.h_index}</Badge>}
                </div>
                {topics.length > 0 && <p className="small">Research: {topics.join(' · ')}</p>}
                {p.fit_reason && <p className="small muted">{p.fit_reason}</p>}
                <p className="small muted">Updated {fmtDate(p.updated_at)}</p>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
