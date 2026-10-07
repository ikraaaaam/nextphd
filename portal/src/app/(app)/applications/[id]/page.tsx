import { requireSession } from '@/lib/session';
import { PageHeader, Section, StatusBadge, Provenance } from '@/components/ui';
import { APPLICATION_STATUSES } from '@/lib/constants';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { setApplicationStatus, saveApplicationNotes, addApplicationTask } from '../../actions';

export async function generateMetadata({ params }: { params: { id: string } }) {
  const { supabase, user } = await requireSession();
  const { data } = await supabase
    .from('applications')
    .select('title')
    .eq('id', params.id)
    .eq('owner_id', user.id)
    .single();

  return { title: data?.title ? `${data.title} | NEXTPHD` : 'Application' };
}

export default async function ApplicationDetail({ params }: { params: { id: string } }) {
  const { supabase, user } = await requireSession();

  const [
    { data: app },
    { data: tasks },
    { data: history }
  ] = await Promise.all([
    supabase
      .from('applications')
      .select('*, opportunities(id, title), universities(id, name), professors(id, name)')
      .eq('id', params.id)
      .eq('owner_id', user.id)
      .single(),
    supabase
      .from('application_tasks')
      .select('*')
      .eq('application_id', params.id)
      .eq('owner_id', user.id)
      .order('due_date', { ascending: true, nullsFirst: false }),
    supabase
      .from('application_status_history')
      .select('*')
      .eq('application_id', params.id)
      .eq('owner_id', user.id)
      .order('created_at', { ascending: false })
  ]);

  if (!app) notFound();

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-start">
        <div>
          <PageHeader
            title={app.title}
            description={app.universities?.name}
            crumb={<Link href="/applications">&larr; All Applications</Link>}
          />
        </div>
        <StatusBadge status={app.status} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <Section title="Application Details">
            <form action={saveApplicationNotes} className="space-y-4">
              <input type="hidden" name="id" value={app.id} />
              <div>
                <label className="block text-sm font-medium mb-1">Deadline</label>
                <input
                  type="date"
                  name="deadline"
                  defaultValue={app.deadline || ''}
                  className="input max-w-md"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Notes</label>
                <textarea
                  name="notes"
                  defaultValue={app.notes || ''}
                  rows={8}
                  className="input"
                  placeholder="Draft your application notes here..."
                />
              </div>
              <button type="submit" className="btn btn-primary">Save Details</button>
            </form>
          </Section>

          <Section title="Tasks">
            <div className="space-y-4">
              {tasks?.map((task) => (
                <div key={task.id} className={`card ${task.completed ? 'opacity-50' : ''}`}>
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-medium">{task.task_title}</h4>
                      <p className="text-sm text-dimmed">{task.task_type || 'General Task'}</p>
                    </div>
                    {task.due_date && (
                      <span className="text-sm font-medium text-red-600">Due: {new Date(task.due_date).toLocaleDateString()}</span>
                    )}
                  </div>
                </div>
              ))}
              
              <form action={addApplicationTask} className="card bg-gray-50 flex gap-4 items-end mt-4">
                <input type="hidden" name="application_id" value={app.id} />
                <div className="flex-1">
                  <label className="block text-sm font-medium mb-1">New Task</label>
                  <input type="text" name="task_title" required placeholder="e.g., Request transcript" className="input" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Due Date</label>
                  <input type="date" name="due_date" className="input" />
                </div>
                <button type="submit" className="btn btn-secondary">Add</button>
              </form>
            </div>
          </Section>
        </div>

        <div className="space-y-6">
          <Section title="Update Status">
            <form action={setApplicationStatus} className="space-y-4">
              <input type="hidden" name="id" value={app.id} />
              <select name="status" defaultValue={app.status} className="input">
                {APPLICATION_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              <button type="submit" className="btn btn-primary w-full">Update Status</button>
            </form>
          </Section>

          <Section title="Linked Entities">
            <dl className="space-y-4 text-sm">
              {app.opportunities && (
                <div>
                  <dt className="text-dimmed font-medium">Opportunity</dt>
                  <dd className="mt-1">
                    <Link href={`/opportunities/${app.opportunities.id}`} className="text-[var(--accent)] hover:underline">
                      {app.opportunities.title}
                    </Link>
                  </dd>
                </div>
              )}
              {app.universities && (
                <div>
                  <dt className="text-dimmed font-medium">University</dt>
                  <dd className="mt-1">
                    <Link href={`/universities/${app.universities.id}`} className="text-[var(--accent)] hover:underline">
                      {app.universities.name}
                    </Link>
                  </dd>
                </div>
              )}
              {app.professors && (
                <div>
                  <dt className="text-dimmed font-medium">Professor</dt>
                  <dd className="mt-1">
                    <Link href={`/professors/${app.professors.id}`} className="text-[var(--accent)] hover:underline">
                      {app.professors.name}
                    </Link>
                  </dd>
                </div>
              )}
            </dl>
          </Section>

          <Section title="Status History">
            <div className="space-y-3">
              {history?.map((h) => (
                <div key={h.id} className="text-sm">
                  <span className="text-dimmed">{new Date(h.created_at).toLocaleDateString()}</span>
                  <p className="mt-1">
                    {h.old_status ? `Changed from ${h.old_status} to ` : 'Set to '}
                    <span className="font-medium">{h.new_status}</span>
                  </p>
                </div>
              ))}
            </div>
          </Section>

          <Provenance
            status={app.status}
          />
        </div>
      </div>
    </div>
  );
}
