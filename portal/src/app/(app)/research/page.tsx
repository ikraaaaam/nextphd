import { requireSession } from '@/lib/session';
import { PageHeader, Section, EmptyState, Badge } from '@/components/ui';
import { fmtDate } from '@/lib/format';
import Link from 'next/link';

export const metadata = {
  title: 'Research | NEXTPHD',
};

export default async function ResearchPage() {
  const { supabase, user } = await requireSession();

  const [
    { data: groups },
    { data: publications },
    { data: emergingTopics }
  ] = await Promise.all([
    supabase
      .from('research_groups')
      .select('*, universities(name)')
      .eq('owner_id', user.id)
      .order('name'),
    supabase
      .from('publications')
      .select('*, professors(name)')
      .eq('owner_id', user.id)
      .order('publication_date', { ascending: false })
      .limit(10),
    supabase
      .from('emerging_topics')
      .select('*')
      .eq('owner_id', user.id)
      .order('growth_measure', { ascending: false })
      .limit(10)
  ]);

  return (
    <div>
      <PageHeader
        title="Research Intelligence"
        description="Track specific research groups, monitor faculty publications, and analyze emerging topics detected in your field."
      />

      <Section title="Research Groups">
        {!groups?.length ? (
          <EmptyState title="No research groups tracked yet">
            Research groups are identified by the intelligence pipeline from professor affiliations.
          </EmptyState>
        ) : (
          <div className="grid-cards">
            {groups.map((g: any) => (
              <Link key={g.id} href={`/research/groups/${g.id}`} className="card interactive" style={{ textDecoration: 'none', color: 'inherit' }}>
                <h3 style={{ marginBottom: '4px', fontSize: '1.1rem', color: 'var(--text)' }}>{g.name}</h3>
                {g.universities?.name && <p style={{ fontSize: '0.85rem', color: 'var(--text-2)', marginBottom: '12px' }}>{g.universities.name}</p>}
                {g.website && (
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{g.website}</p>
                )}
              </Link>
            ))}
          </div>
        )}
      </Section>

      <div className="dashboard-grid" style={{ marginTop: '32px' }}>
        <div>
          <Section title="Recent Publications & Signals">
            {!publications?.length ? (
              <EmptyState title="No publications tracked yet">Publications are extracted from OpenAlex when professors are verified.</EmptyState>
            ) : (
              <div className="card" style={{ padding: 0 }}>
                {publications.map((p: any) => (
                  <div key={p.id} className="intel-item" style={{ padding: '16px' }}>
                    <div className="intel-main">
                      <h4 style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text)', marginBottom: '8px', lineHeight: 1.4 }}>{p.title}</h4>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.85rem', color: 'var(--text-2)' }}>
                        <span>{p.professors?.name || 'Unknown Professor'}</span>
                        <span style={{ color: 'var(--text-muted)' }}>{p.publication_date ? fmtDate(p.publication_date) : 'Unknown Date'}</span>
                      </div>
                      {p.source_url && (
                        <div style={{ marginTop: '12px' }}>
                          <a href={p.source_url} target="_blank" rel="noopener noreferrer" className="btn btn-sm">
                            Source ↗
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Section>
        </div>

        <div>
          <Section title="Emerging Topics">
            {!emergingTopics?.length ? (
              <EmptyState title="No emerging topics identified">Topics are clustered from recent research signals.</EmptyState>
            ) : (
              <div className="card" style={{ padding: 0 }}>
                {emergingTopics.map((t: any) => (
                  <div key={t.id} className="intel-item" style={{ padding: '16px', alignItems: 'center' }}>
                    <div className="intel-main">
                      <h4 style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text)', margin: 0 }}>{t.topic}</h4>
                      <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0, marginTop: '4px' }}>Evidence count: {t.recent_count}</p>
                    </div>
                    {t.growth_measure != null && (
                      <div style={{ textAlign: 'right' }}>
                        <Badge tone="ok">+{t.growth_measure.toFixed(1)}x</Badge>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </Section>
        </div>
      </div>
    </div>
  );
}
