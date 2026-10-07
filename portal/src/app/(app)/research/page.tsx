import { requireSession } from '@/lib/session';
import { PageHeader, Section, EmptyState } from '@/components/ui';
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
    <div className="space-y-8">
      <PageHeader
        title="Research & Intelligence"
        description="Track research groups, publications, and emerging topics."
      />

      <Section title="Research Groups">
        {!groups?.length ? (
          <EmptyState title="No research groups tracked yet." />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {groups.map((g: any) => (
              <Link key={g.id} href={`/research/groups/${g.id}`} className="card block hover:ring-2 hover:ring-[var(--accent)] transition-shadow">
                <h3 className="font-semibold text-lg mb-1">{g.name}</h3>
                {g.universities?.name && <p className="text-sm text-dimmed mb-3">{g.universities.name}</p>}
                {g.website && (
                  <p className="text-sm text-dimmed truncate">{g.website}</p>
                )}
              </Link>
            ))}
          </div>
        )}
      </Section>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Section title="Recent Publications">
          {!publications?.length ? (
            <EmptyState title="No publications tracked yet." />
          ) : (
            <div className="space-y-4">
              {publications.map((p: any) => (
                <div key={p.id} className="card">
                  <h4 className="font-medium mb-1 line-clamp-2">{p.title}</h4>
                  <div className="flex items-center justify-between text-sm text-dimmed mt-2">
                    <span>{p.professors?.name || 'Unknown Professor'}</span>
                    <span>{p.publication_date ? new Date(p.publication_date).toLocaleDateString() : 'Unknown Date'}</span>
                  </div>
                  {p.source_url && (
                    <a href={p.source_url} target="_blank" rel="noopener noreferrer" className="text-sm text-[var(--accent)] hover:underline mt-2 block">
                      View Source &rarr;
                    </a>
                  )}
                </div>
              ))}
            </div>
          )}
        </Section>

        <Section title="Emerging Topics">
          {!emergingTopics?.length ? (
            <EmptyState title="No emerging topics identified." />
          ) : (
            <div className="space-y-4">
              {emergingTopics.map((t: any) => (
                <div key={t.id} className="card flex items-center justify-between">
                  <div>
                    <h4 className="font-medium mb-1">{t.topic}</h4>
                    <p className="text-sm text-dimmed">Evidence count: {t.recent_count}</p>
                  </div>
                  {t.growth_measure && (
                    <div className="text-right">
                      <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-800">
                        +{t.growth_measure.toFixed(1)}x Growth
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </Section>
      </div>
    </div>
  );
}
