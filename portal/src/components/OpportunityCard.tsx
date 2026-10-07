import Link from 'next/link';
import { toggleOpportunitySaved } from '@/app/(app)/actions';
import { deadlineLabel, fmtDate, link, pretty, type Row } from '@/lib/format';
import { Badge, ScorePill, StatusBadge } from './ui';

export function OpportunityCard({ opp, compact = false }: { opp: Row; compact?: boolean }) {
  const dl = deadlineLabel(opp.deadline);
  const saved = opp.status === 'SAVED';
  const official = link(opp.official_url) || link(opp.source_url);
  return (
    <article className="card stack-sm">
      <div className="row-between" style={{ alignItems: 'flex-start' }}>
        <h3 style={{ marginBottom: 0 }}>
          <Link href={`/opportunities/${opp.id}`}>{opp.title || 'Untitled opportunity'}</Link>
        </h3>
        <ScorePill score={opp.fit_score} />
      </div>
      <p className="small muted">
        {opp.universities?.name ? <Link href={`/universities/${opp.universities.id ?? opp.university_id}`}>{opp.universities.name}</Link> : 'University not specified'}
        {opp.country ? ` · ${opp.country}` : ''}
        {opp.professors?.name ? <> · <Link href={`/professors/${opp.professors.id ?? opp.professor_id}`}>{opp.professors.name}</Link></> : null}
      </p>
      <div className="row">
        <StatusBadge status={opp.verification} />
        <StatusBadge status={opp.funding_class} fallback="FUNDING UNKNOWN" />
        <Badge tone={dl.tone}>{opp.deadline ? `${fmtDate(opp.deadline)} · ${dl.text}` : dl.text}</Badge>
        {opp.status && opp.status !== 'NEW' && <StatusBadge status={opp.status} />}
      </div>
      {opp.field && <p className="small">Research area: {opp.field}</p>}
      {!compact && opp.fit_reason && <p className="small muted">{opp.fit_reason}</p>}
      <div className="row">
        <Link href={`/opportunities/${opp.id}`} className="btn btn-sm">
          Details
        </Link>
        {official && (
          <a className="btn btn-sm" href={official} target="_blank" rel="noreferrer">
            Open source ↗
          </a>
        )}
        <form action={toggleOpportunitySaved}>
          <input type="hidden" name="id" value={opp.id} />
          <input type="hidden" name="status" value={opp.status ?? ''} />
          <button type="submit" className="btn btn-sm" aria-pressed={saved}>
            {saved ? '★ Saved' : '☆ Save'}
          </button>
        </form>
      </div>
      <span className="sr-only">{pretty(opp.status)}</span>
    </article>
  );
}
