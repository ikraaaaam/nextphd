import { requireSession } from '@/lib/session';
import { PageHeader, Section, StatusBadge, Provenance, EmptyState } from '@/components/ui';
import { OUTREACH_STATUSES, RESPONSE_SENTIMENTS } from '@/lib/constants';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { updateOutreachStatus, setFollowUp, logContact } from '../../actions';

export async function generateMetadata({ params }: { params: { id: string } }) {
  const { supabase, user } = await requireSession();
  const { data } = await supabase
    .from('outreach_contacts')
    .select('professors(name)')
    .eq('id', params.id)
    .eq('owner_id', user.id)
    .single();

  return { title: (data?.professors as any)?.name ? `Outreach: ${(data?.professors as any).name} | NEXTPHD` : 'Outreach Contact' };
}

export default async function OutreachDetail({ params }: { params: { id: string } }) {
  const { supabase, user } = await requireSession();

  const [
    { data: contact },
    { data: history },
    { data: drafts }
  ] = await Promise.all([
    supabase
      .from('outreach_contacts')
      .select('*, professors(id, name, email), opportunities(id, title), applications(id, title)')
      .eq('id', params.id)
      .eq('owner_id', user.id)
      .single(),
    supabase
      .from('contact_history')
      .select('*')
      .eq('outreach_contact_id', params.id)
      .eq('owner_id', user.id)
      .order('contact_date', { ascending: false }),
    supabase
      .from('outreach_drafts')
      .select('*')
      .eq('outreach_contact_id', params.id)
      .eq('owner_id', user.id)
      .order('updated_at', { ascending: false })
  ]);

  if (!contact) notFound();

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-start">
        <div>
          <PageHeader
            title={(contact.professors as any)?.name || 'Unknown Contact'}
            description={(contact.professors as any)?.email || 'No email provided'}
            crumb={<Link href="/outreach">&larr; All Outreach</Link>}
          />
        </div>
        <StatusBadge status={contact.status} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <Section title="Log Contact">
            <form action={logContact} className="space-y-4">
              <input type="hidden" name="contact_id" value={contact.id} />
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Direction</label>
                  <select name="direction" className="input">
                    <option value="OUTBOUND">Outbound (I contacted them)</option>
                    <option value="INBOUND">Inbound (They replied)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Method</label>
                  <select name="contact_method" className="input">
                    <option value="EMAIL">Email</option>
                    <option value="LINKEDIN">LinkedIn</option>
                    <option value="FORM">Contact Form</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Subject</label>
                <input type="text" name="subject" className="input" placeholder="e.g., Follow up regarding PhD application" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Summary / Notes</label>
                <textarea name="summary" rows={4} className="input" placeholder="What was discussed?" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Response Sentiment (If Inbound)</label>
                <select name="response_status" className="input">
                  <option value="">N/A</option>
                  {RESPONSE_SENTIMENTS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <button type="submit" className="btn btn-primary">Log Interaction</button>
            </form>
          </Section>

          <Section title="Contact History">
            {!history?.length ? (
              <EmptyState title="No interactions logged yet." />
            ) : (
              <div className="space-y-4">
                {history.map((h: any) => (
                  <div key={h.id} className="card text-sm">
                    <div className="flex justify-between items-start mb-2">
                      <span className="font-medium">
                        {h.direction === 'OUTBOUND' ? 'Sent' : 'Received'} via {h.contact_method}
                      </span>
                      <span className="text-dimmed">{new Date(h.contact_date).toLocaleString()}</span>
                    </div>
                    {h.subject && <p className="font-medium mb-1">{h.subject}</p>}
                    {h.summary && <p className="text-dimmed">{h.summary}</p>}
                    {h.response_status && (
                      <p className="mt-2 font-medium text-xs uppercase text-gray-500">
                        Sentiment: {h.response_status}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </Section>

          <Section title="Drafts">
            {!drafts?.length ? (
              <EmptyState title="No drafts available." />
            ) : (
              <div className="space-y-4">
                {drafts.map((d: any) => (
                  <div key={d.id} className="card">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-medium line-clamp-1">{d.subject}</h4>
                      <span className="text-xs font-medium px-2 py-1 bg-gray-100 rounded text-gray-800 uppercase tracking-wider">{d.status}</span>
                    </div>
                    <div className="text-sm text-dimmed whitespace-pre-wrap max-h-40 overflow-hidden relative">
                      {d.body}
                      <div className="absolute bottom-0 left-0 right-0 h-10 bg-gradient-to-t from-white to-transparent pointer-events-none" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Section>
        </div>

        <div className="space-y-6">
          <Section title="Status & Follow Up">
            <form action={updateOutreachStatus} className="space-y-4 mb-6">
              <input type="hidden" name="id" value={contact.id} />
              <select name="status" defaultValue={contact.status} className="input">
                {OUTREACH_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              <button type="submit" className="btn btn-primary w-full">Update Status</button>
            </form>

            <form action={setFollowUp} className="space-y-4 pt-4 border-t border-gray-100">
              <input type="hidden" name="id" value={contact.id} />
              <div>
                <label className="block text-sm font-medium mb-1 text-dimmed">Next Follow Up</label>
                <input
                  type="date"
                  name="next_follow_up_at"
                  defaultValue={contact.next_follow_up_at ? new Date(contact.next_follow_up_at).toISOString().slice(0, 10) : ''}
                  className="input"
                />
              </div>
              <button type="submit" className="btn btn-secondary w-full">Set Reminder</button>
            </form>
          </Section>

          <Section title="Linked Entities">
            <dl className="space-y-4 text-sm">
              {contact.professors && (
                <div>
                  <dt className="text-dimmed font-medium">Professor</dt>
                  <dd className="mt-1">
                    <Link href={`/professors/${contact.professors.id}`} className="text-[var(--accent)] hover:underline">
                      {contact.professors.name}
                    </Link>
                  </dd>
                </div>
              )}
              {contact.opportunities && (
                <div>
                  <dt className="text-dimmed font-medium">Opportunity</dt>
                  <dd className="mt-1">
                    <Link href={`/opportunities/${contact.opportunities.id}`} className="text-[var(--accent)] hover:underline">
                      {contact.opportunities.title}
                    </Link>
                  </dd>
                </div>
              )}
              {contact.applications && (
                <div>
                  <dt className="text-dimmed font-medium">Application</dt>
                  <dd className="mt-1">
                    <Link href={`/applications/${contact.applications.id}`} className="text-[var(--accent)] hover:underline">
                      {contact.applications.title}
                    </Link>
                  </dd>
                </div>
              )}
            </dl>
          </Section>

          <Provenance
            status={contact.status}
          />
        </div>
      </div>
    </div>
  );
}
