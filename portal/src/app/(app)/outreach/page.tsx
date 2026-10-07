import { requireSession } from '@/lib/session';
import { PageHeader, Section, StatusBadge, EmptyState } from '@/components/ui';
import Link from 'next/link';
import { OUTREACH_STATUSES } from '@/lib/constants';

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
    <div className="space-y-8">
      <PageHeader
        title="Outreach"
        description="Track your communications with professors and researchers."
      />

      <Section title="Outreach Tracker">
        {!contacts?.length ? (
          <EmptyState title="No outreach contacts started yet." />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {contacts.map((contact: any) => (
              <Link key={contact.id} href={`/outreach/${contact.id}`} className="card block hover:ring-2 hover:ring-[var(--accent)] transition-shadow">
                <div className="flex justify-between items-start mb-3">
                  <h3 className="font-semibold text-lg line-clamp-1">{contact.professors?.name || 'Unknown Contact'}</h3>
                  <StatusBadge status={contact.status} />
                </div>
                {contact.opportunities?.title && (
                  <p className="text-sm text-dimmed mb-3">Re: {contact.opportunities.title}</p>
                )}
                <div className="text-sm text-dimmed space-y-1">
                  {contact.last_contact_at ? (
                    <p>Last contact: {new Date(contact.last_contact_at).toLocaleDateString()}</p>
                  ) : contact.first_contact_at ? (
                    <p>First contact: {new Date(contact.first_contact_at).toLocaleDateString()}</p>
                  ) : null}
                  {contact.next_follow_up_at && (
                    <p className="font-medium text-red-600">
                      Follow-up: {new Date(contact.next_follow_up_at).toLocaleDateString()}
                    </p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </Section>
    </div>
  );
}
