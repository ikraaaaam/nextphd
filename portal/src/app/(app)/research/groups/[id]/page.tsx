import { requireSession } from '@/lib/session';
import { PageHeader, Section, Provenance } from '@/components/ui';
import { notFound } from 'next/navigation';
import Link from 'next/link';

export async function generateMetadata({ params }: { params: { id: string } }) {
  const { supabase, user } = await requireSession();
  const { data } = await supabase
    .from('research_groups')
    .select('name')
    .eq('id', params.id)
    .eq('owner_id', user.id)
    .single();

  return { title: data?.name ? `${data.name} | NEXTPHD` : 'Research Group' };
}

export default async function ResearchGroupDetail({ params }: { params: { id: string } }) {
  const { supabase, user } = await requireSession();

  const { data: group } = await supabase
    .from('research_groups')
    .select('*, universities(id, name)')
    .eq('id', params.id)
    .eq('owner_id', user.id)
    .single();

  if (!group) {
    notFound();
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-start">
        <PageHeader
          title={group.name}
          description={group.universities?.name}
          crumb={<Link href="/research">&larr; All Research</Link>}
        />
        {group.website && (
          <a
            href={group.website}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-secondary"
          >
            Visit Website &rarr;
          </a>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <Section title="Notes">
            {group.notes ? (
              <div className="prose max-w-none whitespace-pre-wrap">{group.notes}</div>
            ) : (
              <p className="text-dimmed italic">No notes available.</p>
            )}
          </Section>
        </div>

        <div className="space-y-6">
          <Section title="Metadata">
            <dl className="space-y-4 text-sm">
              <div>
                <dt className="text-dimmed font-medium">University</dt>
                <dd className="mt-1">
                  {group.universities ? (
                    <Link href={`/universities/${group.universities.id}`} className="text-[var(--accent)] hover:underline">
                      {group.universities.name}
                    </Link>
                  ) : (
                    'Not linked'
                  )}
                </dd>
              </div>
            </dl>
          </Section>

          <Provenance
            status={null}
          />
        </div>
      </div>
    </div>
  );
}
