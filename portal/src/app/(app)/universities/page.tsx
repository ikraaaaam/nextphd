import Link from 'next/link';
import { seedStarterUniversities } from '../actions';
import { firstError, requireSession, rows } from '@/lib/session';
import { fmtDate, one, safeSearch } from '@/lib/format';
import { Badge, EmptyState, ErrorNote, PageHeader } from '@/components/ui';
import { FavouriteButton } from '@/components/forms';
import { CountryFilter } from '@/components/CountryFilter';
import { STARTER_UNIVERSITIES, COUNTRY_CATALOGUE } from '@/lib/constants';

export const dynamic = 'force-dynamic';

export default async function UniversitiesPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams;
  const { supabase } = await requireSession();
  const q = safeSearch(one(sp.q));
  const region = one(sp.region);
  const country = one(sp.country);
  const fav = one(sp.fav) === '1';
  const verified = one(sp.verified);

  let query = supabase.from('universities').select('*').order('is_favourite', { ascending: false }).order('name');
  if (q) query = query.or(`name.ilike.%${q}%,city.ilike.%${q}%`);
  
  if (country) {
    query = query.eq('country', country);
  } else if (region && COUNTRY_CATALOGUE[region]) {
    query = query.in('country', COUNTRY_CATALOGUE[region]);
  }

  if (fav) query = query.eq('is_favourite', true);
  if (verified === 'yes') query = query.eq('verified', true);
  if (verified === 'no') query = query.eq('verified', false);

  const [list, all, opps, profs] = await Promise.all([
    rows(query),
    rows(supabase.from('universities').select('id,country')),
    rows(supabase.from('opportunities').select('university_id').limit(5000)),
    rows(supabase.from('professors').select('university_id').limit(5000)),
  ]);

  const countBy = (rs: { university_id: string | null }[]) => rs.reduce<Record<string, number>>((m, r) => (r.university_id ? ((m[r.university_id] = (m[r.university_id] ?? 0) + 1), m) : m), {});
  const oppCount = countBy(opps.rows as never);
  const profCount = countBy(profs.rows as never);
  const empty = all.rows.length === 0;
  const anyFilter = Boolean(q || region || country || fav || verified);

  return (
    <div>
      <PageHeader title="Universities" description="Track institutions, explore matching departments, and monitor academic signals." />
      <ErrorNote message={firstError(list.error, all.error, opps.error, profs.error)} />

      {empty ? (
        <EmptyState
          title="No universities configured yet"
          action={
            <form action={seedStarterUniversities}>
              <button type="submit" className="btn btn-primary">
                Add the {STARTER_UNIVERSITIES.length} starter targets
              </button>
            </form>
          }
        >
          Universities are discovered during the Morning intelligence cycle or explicitly configured here. When added, Afternoon Verification will enrich them with real institutional metrics and faculty signals via OpenAlex. No fake data is ever inserted.
        </EmptyState>
      ) : (
        <>
          <form method="get" className="card" style={{ marginBottom: '24px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label htmlFor="q">Search universities</label>
                <input id="q" name="q" className="form-control" type="search" defaultValue={q} placeholder="Name or city..." />
              </div>
              <CountryFilter defaultRegion={region} defaultCountry={country} />
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label htmlFor="verified">Verification Status</label>
                <select id="verified" name="verified" className="form-control" defaultValue={verified}>
                  <option value="">All Statuses</option>
                  <option value="yes">Verified (OpenAlex matched)</option>
                  <option value="no">Unverified (Pending verification)</option>
                </select>
              </div>
              <div className="form-group" style={{ marginBottom: 0, display: 'flex', alignItems: 'flex-end', paddingBottom: '8px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', margin: 0, color: 'var(--text)' }}>
                  <input type="checkbox" name="fav" value="1" defaultChecked={fav} style={{ width: '16px', height: '16px', accentColor: 'var(--brand)' }} /> ★ Favourites only
                </label>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '16px', paddingTop: '16px', borderTop: '1px solid var(--border)' }}>
              <button type="submit" className="btn btn-primary">
                Search & Filter
              </button>
              {anyFilter && (
                <Link href="/universities" className="btn">
                  Clear
                </Link>
              )}
              <span style={{ marginLeft: 'auto', fontSize: '0.85rem', color: 'var(--text-muted)' }}>{list.rows.length} universities found</span>
            </div>
          </form>

          {list.rows.length === 0 ? (
            <EmptyState title="No universities match these filters" />
          ) : (
            <div className="grid-cards">
              {list.rows.map((u) => (
                <article key={u.id} className="card interactive" style={{ display: 'flex', flexDirection: 'column' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '4px' }}>
                    <h3 style={{ marginBottom: 0, fontSize: '1.1rem' }}>
                      <Link href={`/universities/${u.id}`} style={{ color: 'var(--text)' }}>{u.name}</Link>
                    </h3>
                    <FavouriteButton table="universities" id={u.id} current={u.is_favourite} name={u.name} />
                  </div>
                  
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-2)', marginBottom: '16px' }}>
                    {[u.city, u.country].filter(Boolean).join(', ') || 'Location pending verification'}
                  </div>

                  <div style={{ borderTop: '1px solid var(--border)', paddingTop: '16px', paddingBottom: '16px', flex: 1 }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', textAlign: 'center' }}>
                      <div>
                        <div style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--text)' }}>{profCount[u.id] ?? 0}</div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Professors</div>
                      </div>
                      <div>
                        <div style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--text)' }}>{oppCount[u.id] ?? 0}</div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Opps</div>
                      </div>
                      <div>
                        <div style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--text)' }}>{u.works_count ? (u.works_count > 1000 ? Math.floor(u.works_count / 1000) + 'k' : u.works_count) : '-'}</div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Pubs</div>
                      </div>
                    </div>
                  </div>

                  <div className="chips-container" style={{ marginTop: 'auto' }}>
                    {u.verified ? (
                      <Badge tone="ok">✓ Verified</Badge>
                    ) : (
                      <Badge tone="neutral">Pending Verification</Badge>
                    )}
                    {u.openalex_id && <Badge tone="info">OpenAlex Matched</Badge>}
                  </div>
                </article>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
