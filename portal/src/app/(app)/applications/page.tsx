import { requireSession } from '@/lib/session';
import { PageHeader, Section, StatusBadge, EmptyState } from '@/components/ui';
import Link from 'next/link';
import { APPLICATION_STATUSES } from '@/lib/constants';

export const metadata = {
  title: 'Applications | NEXTPHD',
};

export default async function ApplicationsPage() {
  const { supabase, user } = await requireSession();

  const { data: applications } = await supabase
    .from('applications')
    .select('*, universities(name), professors(name)')
    .eq('owner_id', user.id)
    .order('updated_at', { ascending: false });

  return (
    <div className="space-y-8">
      <PageHeader
        title="Applications"
        description="Manage your PhD applications and tasks."
      />

      <Section title="Application Pipeline">
        {!applications?.length ? (
          <EmptyState title="No applications started yet." />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {applications.map((app: any) => (
              <Link key={app.id} href={`/applications/${app.id}`} className="card block hover:ring-2 hover:ring-[var(--accent)] transition-shadow">
                <div className="flex justify-between items-start mb-3">
                  <h3 className="font-semibold text-lg line-clamp-1">{app.title}</h3>
                  <StatusBadge status={app.status} />
                </div>
                {app.universities?.name && <p className="text-sm text-dimmed mb-1">{app.universities.name}</p>}
                {app.professors?.name && <p className="text-sm text-dimmed mb-3">{app.professors.name}</p>}
                {app.deadline && (
                  <p className="text-sm font-medium mt-4">
                    Deadline: {new Date(app.deadline).toLocaleDateString()}
                  </p>
                )}
              </Link>
            ))}
          </div>
        )}
      </Section>
    </div>
  );
}
