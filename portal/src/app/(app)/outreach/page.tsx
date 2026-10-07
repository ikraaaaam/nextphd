import { requireSession } from '@/lib/session';
import { PageHeader, Section, StatusBadge, EmptyState, Badge } from '@/components/ui';
import Link from 'next/link';
import { OUTREACH_STATUSES } from '@/lib/constants';
import { fmtDate, daysUntil } from '@/lib/format';

export const metadata = {
  title: 'Outreach | NEXTPHD',
};

export default async function OutreachPage() {
  const { supabase, user } = await requireSession();

  const { data: contacts } = await supabase
    .from('outreach_contacts')
    .select('*, professors(name), opportunities(title)')
    .eq('owner_id', user.id)
    .order('updated_at', { ascending: false });

  return (
    <div>
      <PageHeader
        title="Outreach Tracker"
        description="CRM for your communications with professors and researchers."
      />

      <Section title="Active Conversations">
        {!contacts?.length ? (
          <EmptyState title="No outreach contacts started yet">
            Link an outreach contact to an opportunity or professor to start tracking communications.
          </EmptyState>
        ) : (
          <div className="card" style={{ padding: 0, overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Contact / Professor</th>
                  <th>Related Opportunity</th>
                  <th>Status</th>
                  <th>Last Contact</th>
                  <th>Follow-up Due</th>
                </tr>
              </thead>
              <tbody>
                {contacts.map((contact: any) => {
                  const d = daysUntil(contact.next_follow_up_at);
                  const isOverdue = d != null && d < 0;
                  const isDueSoon = d != null && d >= 0 && d <= 3;
                  
                  return (
                    <tr key={contact.id} className={isOverdue ? 'row-warning' : ''}>
                      <td>
                        <Link href={`/outreach/${contact.id}`} style={{ fontWeight: 600 }}>{contact.professors?.name || 'Unknown Contact'}</Link>
                      </td>
                      <td>
                        {contact.opportunities?.title ? <span style={{ fontSize: '0.85rem' }}>{contact.opportunities.title}</span> : <span style={{ color: 'var(--text-muted)' }}>—</span>}
                      </td>
                      <td>
                        <StatusBadge status={contact.status} />
                      </td>
                      <td>
                        {contact.last_contact_at ? fmtDate(contact.last_contact_at) : contact.first_contact_at ? fmtDate(contact.first_contact_at) : <span style={{ color: 'var(--text-muted)' }}>Not contacted</span>}
                      </td>
                      <td>
                        {contact.next_follow_up_at ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ color: isOverdue ? 'var(--bad-fg)' : 'inherit', fontWeight: isOverdue || isDueSoon ? 600 : 400 }}>
                              {fmtDate(contact.next_follow_up_at)}
                            </span>
                            {isOverdue && <Badge tone="bad">Overdue</Badge>}
                            {isDueSoon && <Badge tone="warn">Due soon</Badge>}
                          </div>
                        ) : (
                          <span style={{ color: 'var(--text-muted)' }}>—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Section>
    </div>
  );
}
