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
    <div>
      <PageHeader title="Professors" description="Track researchers, analyze their publication signals, and evaluate their fit for your PhD." />
      <ErrorNote message={firstError(list.error, unis.error, pubs.error)} />

      <form method="get" className="card" style={{ marginBottom: '24px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label htmlFor="q">Search</label>
            <input id="q" name="q" className="form-control" type="search" defaultValue={q} placeholder="Name or department..." />
          </div>
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
            <label htmlFor="min_score">Minimum Fit Score</label>
            <input id="min_score" name="min_score" className="form-control" type="number" min={0} max={100} defaultValue={minScore || ''} placeholder="e.g. 75" />
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label htmlFor="sort">Sort By</label>
            <select id="sort" name="sort" className="form-control" defaultValue={sort}>
              <option value="score">Fit score (Highest first)</option>
              <option value="activity">Recently updated</option>
              <option value="name">Name (A-Z)</option>
            </select>
          </div>
          <div className="form-group" style={{ marginBottom: 0, display: 'flex', alignItems: 'flex-end', paddingBottom: '8px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', margin: 0, color: 'var(--text)' }}>
              <input type="checkbox" name="fav" value="1" defaultChecked={fav} style={{ width: '16px', height: '16px', accentColor: 'var(--brand)' }} /> Favourites only
            </label>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '16px', paddingTop: '16px', borderTop: '1px solid var(--border)' }}>
          <button type="submit" className="btn btn-primary">
            Apply filters
          </button>
          {anyFilter && (
            <Link href="/professors" className="btn">
              Clear
            </Link>
          )}
          <span style={{ marginLeft: 'auto', fontSize: '0.85rem', color: 'var(--text-muted)' }}>{list.rows.length} professors found</span>
        </div>
      </form>

      {list.rows.length === 0 ? (
        anyFilter ? (
          <EmptyState title="No professors match these filters" />
        ) : (
          <EmptyState title="No professors yet">Professors are discovered automatically during the intelligence cycle, or you can track them manually via University pages. Once recorded, the system will score them against your <Link href="/settings" style={{ fontWeight: 600, textDecoration: 'underline' }}>profile</Link>.</EmptyState>
        )
      ) : (
        <div className="grid-cards">
          {list.rows.map((p) => {
            const topics = asList(p.recent_topics).slice(0, 4);
            return (
              <article key={p.id} className="card interactive" style={{ display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                  <div>
                    <h3 style={{ marginBottom: '4px', fontSize: '1.1rem' }}>
                      <Link href={`/professors/${p.id}`} style={{ color: 'var(--text)' }}>{p.name}</Link>
                    </h3>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-2)' }}>
                      {p.universities ? <Link href={`/universities/${p.universities.id}`} style={{ fontWeight: 500 }}>{p.universities.name}</Link> : 'University not recorded'}
                      {p.department && <span> · {p.department}</span>}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                    {p.fit_score != null && (
                      <div style={{ textAlign: 'right', marginTop: '2px' }}>
                        <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--brand)', lineHeight: 1 }}>{p.fit_score}%</div>
                        <div style={{ fontSize: '0.65rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: '2px' }}>Match</div>
                      </div>
                    )}
                    <FavouriteButton table="professors" id={p.id} current={p.is_favourite} name={p.name} />
                  </div>
                </div>

                <div className="chips-container" style={{ margin: '12px 0' }}>
                  <StatusBadge status={p.recruiting_signal === 'none' ? 'NO RECRUITING SIGNAL' : p.recruiting_signal} />
                  <Badge tone="neutral">{pubCount[p.id] ?? 0} pubs stored</Badge>
                  {p.h_index != null && <Badge tone="info">h-index {p.h_index}</Badge>}
                </div>

                <div style={{ flex: 1 }}>
                  {topics.length > 0 && (
                    <div style={{ fontSize: '0.85rem', marginBottom: '12px' }}>
                      <strong style={{ color: 'var(--text-2)' }}>Research Areas:</strong> {topics.join(' · ')}
                    </div>
                  )}
                  {p.fit_reason && (
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-2)', lineHeight: 1.5, paddingLeft: '12px', borderLeft: '2px solid var(--border-strong)' }}>
                      {p.fit_reason}
                    </div>
                  )}
                </div>

                <div style={{ borderTop: '1px solid var(--border)', paddingTop: '12px', marginTop: '16px', fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', justifyContent: 'space-between' }}>
                  <span>Updated {fmtDate(p.updated_at)}</span>
                  <Link href={`/professors/${p.id}`} style={{ fontWeight: 600 }}>View dossier →</Link>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
