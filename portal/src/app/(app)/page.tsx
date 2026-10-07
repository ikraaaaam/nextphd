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
    <div>
      <PageHeader
        title={`Good ${new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 18 ? 'afternoon' : 'evening'}, ${name}`}
        description="Your PhD intelligence briefing"
        actions={<div style={{ fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: 500, alignSelf: 'center' }}>{fmtDate(new Date().toISOString())}</div>}
      />
      
      <ErrorNote message={err} />

      {noProfile && (
        <div className="alert alert-warning">
          <strong>Configuration Action Required:</strong> Your profile isn’t configured yet. <Link href="/settings" style={{ fontWeight: 600, textDecoration: 'underline' }}>Complete your profile</Link> to activate personalized matching and enable scheduled intelligence runs.
        </div>
      )}
      
      {noData && !noProfile && (
        <div className="alert alert-info">
          <strong>Workspace initialized:</strong> Your database is currently empty. The system will populate opportunities, universities, and professors when the intelligence cycle runs. You can securely bootstrap the starter targets in the <Link href="/universities" style={{ fontWeight: 600, textDecoration: 'underline' }}>Universities</Link> tab.
        </div>
      )}

      {/* KPI Row */}
      <div className="metric-grid">
        <StatCard label="New Opportunities" value={newOpps.length} href="/opportunities?sort=newest" />
        <StatCard label="Strong Matches" value={strong.length} href={`/opportunities?min_score=${minScore}&sort=score`} />
        <StatCard label="Upcoming Deadlines" value={upcoming.length} href="/opportunities?sort=deadline" />
        <StatCard label="Research Signals" value={recentSignals.length} href="/research" />
        <StatCard label="Follow-ups Due" value={followUps.rows.length} href="/outreach" />
      </div>

      <div className="dashboard-grid">
        {/* LEFT COLUMN: Intelligence */}
        <div>
          <Section title="Today's Intelligence" actions={<Link href="/opportunities?sort=score" style={{ fontWeight: 600, fontSize: '0.85rem' }}>View all →</Link>}>
            {open.filter((o) => typeof o.fit_score === 'number').length === 0 ? (
              <EmptyState title="No scored opportunities yet">
                {opps.rows.length === 0
                  ? 'The intelligence cycle hasn’t discovered any opportunities yet. Morning Discovery runs on schedule once your profile is saved.'
                  : 'Opportunities exist but none has a match score yet. Scores are produced by Afternoon Verification.'}
              </EmptyState>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {open
                  .filter((o) => typeof o.fit_score === 'number')
                  .slice(0, 3)
                  .map((o) => (
                    <OpportunityCard key={o.id} opp={o} compact />
                  ))}
              </div>
            )}
          </Section>

          <Section title="Recent Research Signals" actions={<Link href="/research" style={{ fontWeight: 600, fontSize: '0.85rem' }}>View all →</Link>}>
            {signals.rows.length === 0 ? (
              <EmptyState title="No research signals">Signals are detected from professors’ publications during Afternoon Verification.</EmptyState>
            ) : (
              <div className="card" style={{ padding: 0 }}>
                {signals.rows.slice(0, 4).map((s) => (
                  <div key={s.id} className="intel-item" style={{ padding: '16px' }}>
                    <div className="intel-main">
                      <div className="intel-title">{s.title}</div>
                      <div className="intel-meta">
                        {s.professors?.name && <Link href={`/professors/${s.professors.id}`} style={{ fontWeight: 500 }}>{s.professors.name}</Link>}
                        <span style={{ opacity: 0.5 }}>·</span>
                        <span>{fmtDate(s.signal_date || s.created_at)}</span>
                      </div>
                      <div className="intel-reason">{s.summary}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Section>
        </div>

        {/* RIGHT COLUMN: Operations & Deadlines */}
        <div>
          <Section title="Intelligence Cycle">
            <div className="card" style={{ padding: 0 }}>
              <ul className="cycle-list" style={{ margin: 0, padding: '0 16px' }}>
                {CYCLE_SEGMENTS.map((seg) => {
                  const run = latestRun(runs.rows, seg.key);
                  const warns = warningsFromRun(run);
                  return (
                    <li key={seg.key} className="cycle-item">
                      <div className="cycle-status">
                        {run && run.status === 'SUCCESS' ? <span style={{ color: 'var(--ok-fg)' }}>✓</span> : run && run.status === 'FAILED' ? <span style={{ color: 'var(--bad-fg)' }}>✗</span> : <span style={{ color: 'var(--text-muted)' }}>○</span>}
                      </div>
                      <div className="cycle-info" style={{ flex: 1 }}>
                        <strong>{seg.label}</strong>
                        <span>{run ? fmtDateTime(run.ran_at) : 'Waiting for next scheduled run'}</span>
                        {warns.length > 0 && <div style={{ fontSize: '0.75rem', color: 'var(--warn-fg)', marginTop: '4px' }}>⚠ {warns.length} warning(s)</div>}
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          </Section>

          <Section title="Priority Deadlines">
            {upcoming.length === 0 && apps.rows.filter((a) => (daysUntil(a.deadline) ?? -1) >= 0).length === 0 && tasks.rows.length === 0 ? (
              <EmptyState title="Clear schedule">No upcoming deadlines detected.</EmptyState>
            ) : (
              <div className="card" style={{ padding: 0 }}>
                <ul className="cycle-list" style={{ margin: 0, padding: '0 16px' }}>
                  {upcoming.slice(0, 4).map((o) => {
                    const dl = deadlineLabel(o.deadline);
                    return (
                      <li key={o.id} className="cycle-item" style={{ alignItems: 'flex-start' }}>
                        <div className="cycle-info" style={{ flex: 1 }}>
                          <strong><Link href={`/opportunities/${o.id}`}>{o.title}</Link></strong>
                          <span>{fmtDate(o.deadline)}</span>
                        </div>
                        <Badge tone={dl.tone}>{dl.text}</Badge>
                      </li>
                    );
                  })}
                  {apps.rows.filter((a) => (daysUntil(a.deadline) ?? -1) >= 0).slice(0, 3).map((a) => {
                    const dl = deadlineLabel(a.deadline);
                    return (
                      <li key={a.id} className="cycle-item" style={{ alignItems: 'flex-start' }}>
                        <div className="cycle-info" style={{ flex: 1 }}>
                          <strong>Application: <Link href={`/applications/${a.id}`}>{a.title}</Link></strong>
                          <span>{fmtDate(a.deadline)}</span>
                        </div>
                        <Badge tone={dl.tone}>{dl.text}</Badge>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}
          </Section>

          {warnings.length > 0 && (
            <Section title="System Warnings">
              <div className="card" style={{ padding: '16px', background: 'var(--bad-bg)', borderColor: 'var(--bad-border)' }}>
                <ul style={{ margin: 0, paddingLeft: '16px', color: 'var(--bad-fg)', fontSize: '0.85rem' }}>
                  {[...warnings, ...digestWarnings.map((w) => `Digest: ${w}`)].slice(0, 5).map((w, i) => (
                    <li key={i} style={{ marginBottom: '4px' }}>{w}</li>
                  ))}
                </ul>
              </div>
            </Section>
          )}
        </div>
      </div>
    </div>
  );
}
