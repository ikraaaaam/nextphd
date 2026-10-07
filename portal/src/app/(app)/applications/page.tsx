import { requireSession } from '@/lib/session';
import { PageHeader, Section, StatusBadge, EmptyState, Badge } from '@/components/ui';
import Link from 'next/link';
import { APPLICATION_STATUSES } from '@/lib/constants';
import { fmtDate } from '@/lib/format';

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

  // Group applications by status for the Kanban board
  const kanbanColumns = [
    { id: 'PREPARING', title: 'Preparing', apps: applications?.filter(a => a.status === 'PREPARING') || [] },
    { id: 'SUBMITTED', title: 'Submitted', apps: applications?.filter(a => a.status === 'SUBMITTED') || [] },
    { id: 'INTERVIEWING', title: 'Interviewing', apps: applications?.filter(a => a.status === 'INTERVIEWING') || [] },
    { id: 'ACCEPTED', title: 'Accepted', apps: applications?.filter(a => a.status === 'ACCEPTED') || [] },
    { id: 'REJECTED', title: 'Rejected', apps: applications?.filter(a => a.status === 'REJECTED') || [] },
    { id: 'WITHDRAWN', title: 'Withdrawn', apps: applications?.filter(a => a.status === 'WITHDRAWN') || [] },
  ];

  return (
    <div>
      <PageHeader
        title="Application Pipeline"
        description="Manage your active PhD applications, deadlines, and submission statuses."
      />

      {!applications?.length ? (
        <EmptyState title="No applications started yet">
          Applications can be created directly from saved Opportunities.
        </EmptyState>
      ) : (
        <div className="kanban-board" style={{ marginTop: '32px' }}>
          {kanbanColumns.map(col => {
            if (col.apps.length === 0 && (col.id === 'REJECTED' || col.id === 'WITHDRAWN' || col.id === 'ACCEPTED')) return null; // hide empty terminal states to save space, unless they have items
            return (
              <div key={col.id} className="kanban-col">
                <div className="kanban-col-header">
                  <span>{col.title}</span>
                  <Badge tone="neutral">{col.apps.length}</Badge>
                </div>
                
                {col.apps.map(app => (
                  <Link key={app.id} href={`/applications/${app.id}`} style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}>
                    <div className="kanban-card">
                      <h4 style={{ fontSize: '0.95rem', fontWeight: 600, marginBottom: '8px', lineHeight: 1.3 }}>{app.title}</h4>
                      {app.universities?.name && <div style={{ fontSize: '0.8rem', color: 'var(--text-2)', marginBottom: '4px' }}>{app.universities.name}</div>}
                      {app.professors?.name && <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{app.professors.name}</div>}
                      
                      <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        {app.deadline ? (
                          <div style={{ fontSize: '0.75rem', fontWeight: 600, color: new Date(app.deadline) < new Date() ? 'var(--bad-fg)' : 'var(--text)' }}>
                            Due: {fmtDate(app.deadline)}
                          </div>
                        ) : (
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>No deadline</div>
                        )}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
