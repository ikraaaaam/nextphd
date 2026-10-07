import Link from 'next/link';
import { seedStarterUniversities } from '../actions';
import { firstError, requireSession, rows } from '@/lib/session';
import { fmtDate, one, safeSearch } from '@/lib/format';
import { Badge, EmptyState, ErrorNote, PageHeader } from '@/components/ui';
import { FavouriteButton } from '@/components/forms';
import { STARTER_UNIVERSITIES } from '@/lib/constants';

export const dynamic = 'force-dynamic';

export default async function UniversitiesPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams;
  const { supabase } = await requireSession();
  const q = safeSearch(one(sp.q));
  const country = one(sp.country);
  const fav = one(sp.fav) === '1';
  const verified = one(sp.verified);

  let query = supabase.from('universities').select('*').order('is_favourite', { ascending: false }).order('name');
  if (q) query = query.or(`name.ilike.%${q}%,city.ilike.%${q}%`);
  if (country) query = query.eq('country', country);
  if (fav) query = query.eq('is_favourite', true);
  if (verified === 'yes') query = query.eq('verified', true);
  if (verified === 'no') query = query.eq('verified', false);

  const [list, all, opps, profs] = await Promise.all([
    rows(query),
    rows(supabase.from('universities').select('id,country')),
    rows(supabase.from('opportunities').select('university_id').limit(5000)),
    rows(supabase.from('professors').select('university_id').limit(5000)),
  ]);

  const countries = Array.from(new Set(all.rows.map((r) => r.country).filter(Boolean))).sort() as string[];
  const countBy = (rs: { university_id: string | null }[]) => rs.reduce<Record<string, number>>((m, r) => (r.university_id ? ((m[r.university_id] = (m[r.university_id] ?? 0) + 1), m) : m), {});
  const oppCount = countBy(opps.rows as never);
  const profCount = countBy(profs.rows as never);
  const empty = all.rows.length === 0;
  const anyFilter = Boolean(q || country || fav || verified);

  return (
    <div className="stack">
      <PageHeader title="Universities" description="Institutions you are tracking, with their departments, professors and opportunities." />
      <ErrorNote message={firstError(list.error, all.error, opps.error, profs.error)} />

      {empty ? (
        <EmptyState
          title="No universities recorded yet"
          action={
            <form action={seedStarterUniversities}>
              <button type="submit" className="btn btn-primary">
                Add the {STARTER_UNIVERSITIES.length} starter universities from the spec
              </button>
            </form>
          }
        >
          Universities are added by the intelligence cycle as it discovers them. The build spec (§42) also defines a starter list ({STARTER_UNIVERSITIES.map((u) => u.name).join(', ')}). They are added as <strong>unverified starting records only</strong> — not assumed to be suitable, funded, or accepting applications.
        </EmptyState>
      ) : (
        <>
          <form method="get" className="card">
            <div className="filters">
              <div className="field">
                <label htmlFor="q">Search</label>
                <input id="q" name="q" type="search" defaultValue={q} placeholder="Name or city" />
              </div>
              <div className="field">
                <label htmlFor="country">Country</label>
                <select id="country" name="country" defaultValue={country}>
                  <option value="">All</option>
                  {countries.map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </select>
              </div>
              <div className="field">
                <label htmlFor="verified">Verification</label>
                <select id="verified" name="verified" defaultValue={verified}>
                  <option value="">All</option>
                  <option value="yes">Verified</option>
                  <option value="no">Unverified</option>
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
                <Link href="/universities" className="btn">
                  Clear
                </Link>
              )}
              <span className="small muted">{list.rows.length} universities</span>
            </div>
          </form>

          {list.rows.length === 0 ? (
            <EmptyState title="No universities match these filters" />
          ) : (
            <div className="grid grid-2">
              {list.rows.map((u) => (
                <article key={u.id} className="card stack-sm">
                  <div className="row-between" style={{ alignItems: 'flex-start' }}>
                    <h3 style={{ marginBottom: 0 }}>
                      <Link href={`/universities/${u.id}`}>{u.name}</Link>
                    </h3>
                    <FavouriteButton table="universities" id={u.id} current={u.is_favourite} name={u.name} />
                  </div>
                  <p className="small muted">{[u.city, u.country].filter(Boolean).join(', ') || 'Location not recorded'}</p>
                  <div className="row">
                    <Badge tone={u.verified ? 'ok' : 'warn'}>{u.verified ? `Verified ${fmtDate(u.verified_on)}` : 'Unverified'}</Badge>
                    <Badge tone="neutral">{profCount[u.id] ?? 0} professors</Badge>
                    <Badge tone="neutral">{oppCount[u.id] ?? 0} opportunities</Badge>
                    {u.works_count ? <Badge tone="info">{u.works_count.toLocaleString()} works</Badge> : null}
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
