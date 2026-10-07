import Link from 'next/link';
import { first, firstError, requireSession, rows } from '@/lib/session';
import { daysUntil, deadlineLabel, fmtDate, fmtDateTime } from '@/lib/format';
import { CYCLE_SEGMENTS, latestRun, parseDigest, sectionItems, warningsFromRun } from '@/lib/digest';
import { Badge, EmptyState, ErrorNote, PageHeader, ScorePill, Section, StatCard, StatusBadge } from '@/components/ui';
import { OpportunityCard } from '@/components/OpportunityCard';

export const dynamic = 'force-dynamic';

const DAY = 86_400_000;

export default async function DashboardPage() {
  const { supabase, user } = await requireSession();
  const sinceWeek = new Date(Date.now() - 7 * DAY).toISOString();
  const nowIso = new Date().toISOString();

  const [opps, settings, runs, digest, signals, followUps, apps, tasks, badSources, uniCount, profCount] = await Promise.all([
    rows(supabase.from('opportunities').select('*, universities(id,name), professors(id,name)').order('fit_score', { ascending: false, nullsFirst: false }).limit(500)),
    first(supabase.from('settings').select('*').limit(1)),
    rows(supabase.from('run_log').select('*').order('ran_at', { ascending: false }).limit(60)),
    first(supabase.from('digests').select('*').order('day', { ascending: false }).limit(1)),
    rows(supabase.from('research_signals').select('*, professors(id,name)').order('created_at', { ascending: false }).limit(200)),
    rows(supabase.from('outreach_contacts').select('*, professors(id,name)').not('next_follow_up_at', 'is', null).lte('next_follow_up_at', nowIso).neq('status', 'RESPONDED').neq('status', 'IGNORED')),
    rows(supabase.from('applications').select('id,title,deadline,status').not('deadline', 'is', null).order('deadline', { ascending: true })),
    rows(supabase.from('application_tasks').select('id,task_title,due_date,application_id').eq('completed', false).not('due_date', 'is', null).order('due_date', { ascending: true }).limit(20)),
    rows(supabase.from('sources').select('id,name,last_run_ok,consecutive_failures,last_run_at').or('consecutive_failures.gt.0,last_run_ok.eq.false')),
    supabase.from('universities').select('id', { count: 'exact', head: true }),
    supabase.from('professors').select('id', { count: 'exact', head: true }),
  ]);

  const err = firstError(opps.error, settings.error, runs.error, digest.error, signals.error, followUps.error, apps.error, tasks.error, badSources.error);
  const profile = settings.row;
  const minScore: number = typeof profile?.min_score === 'number' ? profile.min_score : 60;
  const open = opps.rows.filter((o) => !['IGNORED', 'REJECTED', 'CLOSED', 'EXPIRED'].includes(o.status) && !['CLOSED', 'EXPIRED'].includes(o.verification));

  const newOpps = opps.rows.filter((o) => o.first_seen && o.first_seen >= sinceWeek);
  const strong = open.filter((o) => typeof o.fit_score === 'number' && o.fit_score >= minScore);
  const upcoming = open.filter((o) => { const d = daysUntil(o.deadline); return d !== null && d >= 0 && d <= 45; }).sort((a, b) => (a.deadline > b.deadline ? 1 : -1));
  const recentSignals = signals.rows.filter((s) => s.created_at && s.created_at >= sinceWeek);

  const sections = parseDigest(digest.row?.summary_md);
  const favUpdates = sectionItems(sections, 'FAVOURITE');
  const digestWarnings = sectionItems(sections, 'SOURCE');
  const digestDeadlines = sectionItems(sections, 'DEADLINES');

  const name = (user.user_metadata?.full_name as string | undefined) || (user.email ?? '').split('@')[0];
  const noProfile = !profile;
  const noData = opps.rows.length === 0 && (uniCount.count ?? 0) === 0 && (profCount.count ?? 0) === 0;

  const warnings: string[] = [
    ...badSources.rows.map((s) => `Source “${s.name}” ${s.consecutive_failures ? `has failed ${s.consecutive_failures} time(s) in a row` : 'last run failed'}.`),
    ...CYCLE_SEGMENTS.flatMap((s) => warningsFromRun(latestRun(runs.rows, s.key)).map((w) => `${s.label}: ${w}`)),
  ];

  return (
    <div className="stack">
      <PageHeader
        title={`Welcome back, ${name}`}
        description="Your PhD opportunity and research intelligence command center."
        actions={<Badge tone="neutral">{fmtDate(new Date().toISOString())}</Badge>}
      />
      <ErrorNote message={err} />

      {noProfile && (
        <div className="notice notice-warn">
          Your profile isn’t configured yet. <Link href="/settings">Complete your profile</Link> to activate personalized matching and enable scheduled runs for your account.
        </div>
      )}
      {noData && (
        <div className="notice notice-info">
          Your workspace is empty: no opportunities, universities or professors have been recorded yet. Data appears once the intelligence cycle runs
          {noProfile ? ' (it needs a saved profile first)' : ''}. You can add the spec’s starter universities from <Link href="/universities">Universities</Link>.
        </div>
      )}

      <div className="grid grid-stats">
        <StatCard label="New opportunities" value={newOpps.length} note="First seen in the last 7 days" href="/opportunities?sort=newest" />
        <StatCard label="Strong matches" value={strong.length} note={`Match score ≥ ${minScore}%`} href={`/opportunities?min_score=${minScore}&sort=score`} />
        <StatCard label="Upcoming deadlines" value={upcoming.length} note="Opportunities due within 45 days" href="/opportunities?sort=deadline" />
        <StatCard label="Favourite updates" value={favUpdates.length} note={digest.row ? `From digest of ${fmtDate(digest.row.day)}` : 'No digest yet'} />
        <StatCard label="Research signals" value={recentSignals.length} note="Detected in the last 7 days" href="/research" />
        <StatCard label="Follow-ups due" value={followUps.rows.length} note="Outreach follow-ups on or before today" href="/outreach" />
      </div>

      <Section title="Intelligence cycle" hint="Scheduled discovery, verification and daily digest runs.">
        <div className="grid grid-3">
          {CYCLE_SEGMENTS.map((seg) => {
            const run = latestRun(runs.rows, seg.key);
            const warns = warningsFromRun(run);
            return (
              <div key={seg.key} className="card stack-sm">
                <div className="row-between">
                  <h3 style={{ marginBottom: 0 }}>{seg.label}</h3>
                  <StatusBadge status={run ? run.status : 'NOT RUN'} fallback="NOT RUN" />
                </div>
                <p className="small muted">{seg.detail}</p>
                <dl className="kv">
                  <dt>Last run</dt>
                  <dd>{run ? fmtDateTime(run.ran_at) : 'Never'}</dd>
                  {run && seg.key !== 'EVENING_DIGEST' && (
                    <>
                      <dt>Result</dt>
                      <dd>
                        {run.items_found ?? 0} found · {run.items_new ?? 0} new
                      </dd>
                    </>
                  )}
                  {seg.key === 'EVENING_DIGEST' && (
                    <>
                      <dt>Latest digest</dt>
                      <dd>{digest.row ? fmtDate(digest.row.day) : 'None yet'}</dd>
                    </>
                  )}
                  <dt>Warnings</dt>
                  <dd>{warns.length}</dd>
                </dl>
              </div>
            );
          })}
        </div>
      </Section>

      <Section title="Top matches" hint="Highest explainable fit scores among open opportunities." actions={<Link href="/opportunities?sort=score">All opportunities →</Link>}>
        {open.filter((o) => typeof o.fit_score === 'number').length === 0 ? (
          <EmptyState title="No scored opportunities yet">
            {opps.rows.length === 0
              ? 'The intelligence cycle hasn’t discovered any opportunities yet. Morning Discovery runs on schedule once your profile is saved.'
              : 'Opportunities exist but none has a match score yet. Scores are produced by Afternoon Verification.'}
          </EmptyState>
        ) : (
          <div className="grid grid-2">
            {open
              .filter((o) => typeof o.fit_score === 'number')
              .slice(0, 4)
              .map((o) => (
                <OpportunityCard key={o.id} opp={o} />
              ))}
          </div>
        )}
      </Section>

      <div className="grid grid-2">
        <section className="section" style={{ marginTop: 12 }}>
          <div className="section-title">
            <h2>Deadlines</h2>
          </div>
          {upcoming.length === 0 && apps.rows.filter((a) => (daysUntil(a.deadline) ?? -1) >= 0).length === 0 && tasks.rows.length === 0 ? (
            <EmptyState title="No upcoming deadlines">Deadlines from opportunities, applications and tasks appear here.</EmptyState>
          ) : (
            <div className="card">
              <ul className="list">
                {upcoming.slice(0, 6).map((o) => {
                  const dl = deadlineLabel(o.deadline);
                  return (
                    <li key={o.id} className="row-between">
                      <span>
                        <Link href={`/opportunities/${o.id}`}>{o.title}</Link>
                        <span className="small muted"> · {fmtDate(o.deadline)}</span>
                      </span>
                      <Badge tone={dl.tone}>{dl.text}</Badge>
                    </li>
                  );
                })}
                {apps.rows
                  .filter((a) => (daysUntil(a.deadline) ?? -1) >= 0)
                  .slice(0, 5)
                  .map((a) => {
                    const dl = deadlineLabel(a.deadline);
                    return (
                      <li key={a.id} className="row-between">
                        <span>
                          Application: <Link href={`/applications/${a.id}`}>{a.title}</Link>
                          <span className="small muted"> · {fmtDate(a.deadline)}</span>
                        </span>
                        <Badge tone={dl.tone}>{dl.text}</Badge>
                      </li>
                    );
                  })}
                {tasks.rows.slice(0, 5).map((t) => {
                  const dl = deadlineLabel(t.due_date);
                  return (
                    <li key={t.id} className="row-between">
                      <span>
                        Task: <Link href={`/applications/${t.application_id}`}>{t.task_title}</Link>
                        <span className="small muted"> · {fmtDate(t.due_date)}</span>
                      </span>
                      <Badge tone={dl.tone}>{dl.text}</Badge>
                    </li>
                  );
                })}
              </ul>
              {digestDeadlines.length > 0 && <p className="small muted" style={{ marginTop: 10 }}>Digest also flags {digestDeadlines.length} deadline/application item(s).</p>}
            </div>
          )}
        </section>

        <section className="section" style={{ marginTop: 12 }}>
          <div className="section-title">
            <h2>Favourite updates</h2>
          </div>
          {favUpdates.length === 0 ? (
            <EmptyState title="No favourite updates">
              Mark universities, professors or research groups as favourites. Meaningful changes (new opportunities, research signals, group updates) appear here via the daily digest.
            </EmptyState>
          ) : (
            <div className="card">
              <ul className="list">
                {favUpdates.map((u, i) => (
                  <li key={i}>{u}</li>
                ))}
              </ul>
            </div>
          )}
        </section>
      </div>

      <div className="grid grid-2">
        <section className="section" style={{ marginTop: 12 }}>
          <div className="section-title">
            <h2>Research signals</h2>
            <Link href="/research">Research →</Link>
          </div>
          {signals.rows.length === 0 ? (
            <EmptyState title="No research signals yet">Signals are detected from professors’ publications during Afternoon Verification.</EmptyState>
          ) : (
            <div className="card">
              <ul className="list">
                {signals.rows.slice(0, 5).map((s) => (
                  <li key={s.id}>
                    <strong>{s.title}</strong>
                    <div className="small muted">
                      {s.professors?.name ? `${s.professors.name} · ` : ''}
                      {fmtDate(s.signal_date || s.created_at)}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>

        <section className="section" style={{ marginTop: 12 }}>
          <div className="section-title">
            <h2>System &amp; source warnings</h2>
          </div>
          {warnings.length === 0 ? (
            <div className="card">
              <Badge tone="ok">No warnings</Badge> <span className="small muted">All recorded runs and sources are healthy{runs.rows.length === 0 ? ' (no runs recorded yet)' : ''}.</span>
            </div>
          ) : (
            <div className="card">
              <ul className="list">
                {[...warnings, ...digestWarnings.map((w) => `Digest: ${w}`)].slice(0, 8).map((w, i) => (
                  <li key={i}>
                    <Badge tone="warn">Warning</Badge> <span className="small">{w}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>
      </div>

      <Section title="Daily digest" hint={digest.row ? `Generated for ${fmtDate(digest.row.day)}` : undefined}>
        {sections.length === 0 ? (
          <EmptyState title="No digest yet">The Evening Intelligence run builds a digest of new opportunities, deadlines, favourite updates and warnings.</EmptyState>
        ) : (
          <div className="grid grid-2">
            {sections.map((s) => (
              <div key={s.heading} className="card">
                <h3>{s.heading}</h3>
                <ul className="list small">
                  {s.items.map((it, i) => (
                    <li key={i}>{it}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
      </Section>

      <div className="small muted">
        Tracking {uniCount.count ?? 0} universities · {profCount.count ?? 0} professors · {opps.rows.length} opportunities. Top-match score:{' '}
        <ScorePill score={open.find((o) => typeof o.fit_score === 'number')?.fit_score} />
      </div>
    </div>
  );
}
