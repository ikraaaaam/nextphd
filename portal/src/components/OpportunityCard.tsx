import Link from 'next/link';
import { toggleOpportunitySaved } from '@/app/(app)/actions';
import { deadlineLabel, fmtDate, link, pretty, type Row } from '@/lib/format';
import { Badge, ScorePill, StatusBadge } from './ui';

export function OpportunityCard({ opp, compact = false }: { opp: Row; compact?: boolean }) {
  const dl = deadlineLabel(opp.deadline);
  const saved = opp.status === 'SAVED';
  const official = link(opp.official_url) || link(opp.source_url);
  
  return (
    <article className="card interactive" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
        <div>
          <h3 style={{ marginBottom: '4px', fontSize: '1.05rem', fontWeight: 600 }}>
            <Link href={`/opportunities/${opp.id}`} style={{ color: 'var(--text)' }}>{opp.title || 'Untitled opportunity'}</Link>
          </h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '8px', display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
            {opp.universities?.name ? <Link href={`/universities/${opp.universities.id ?? opp.university_id}`} style={{ fontWeight: 500, color: 'var(--text-2)' }}>{opp.universities.name}</Link> : 'University not specified'}
            {opp.country && <span>· {opp.country}</span>}
            {opp.professors?.name && <><span>·</span><Link href={`/professors/${opp.professors.id ?? opp.professor_id}`} style={{ color: 'var(--text-2)' }}>{opp.professors.name}</Link></>}
          </p>
        </div>
        <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: '12px' }}>
          {opp.fit_score != null ? (
            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--brand)', lineHeight: 1 }}>
              {opp.fit_score}%
              <div style={{ fontSize: '0.65rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: '2px' }}>Match</div>
            </div>
          ) : (
            <Badge tone="neutral">Unscored</Badge>
          )}
        </div>
      </div>
      
      {opp.field && <div style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--text)', marginBottom: '12px' }}>{opp.field}</div>}
      
      <div className="chips-container" style={{ marginBottom: '16px' }}>
        <StatusBadge status={opp.funding_class} fallback="FUNDING UNKNOWN" />
        <Badge tone={dl.tone}>{opp.deadline ? `${fmtDate(opp.deadline)} · ${dl.text}` : dl.text}</Badge>
        <StatusBadge status={opp.verification} />
        {opp.status && opp.status !== 'NEW' && opp.status !== 'SAVED' && <StatusBadge status={opp.status} />}
      </div>
      
      {!compact && opp.fit_reason && (
        <div style={{ flexGrow: 1, fontSize: '0.85rem', color: 'var(--text-2)', lineHeight: 1.5, marginBottom: '20px', paddingLeft: '12px', borderLeft: '2px solid var(--border-strong)' }}>
          {opp.fit_reason}
        </div>
      )}
      {!opp.fit_reason && <div style={{ flexGrow: 1 }} />}

      <div style={{ display: 'flex', gap: '8px', borderTop: '1px solid var(--border)', paddingTop: '16px', marginTop: 'auto' }}>
        <Link href={`/opportunities/${opp.id}`} className="btn btn-sm">
          View
        </Link>
        {official && (
          <a className="btn btn-sm" href={official} target="_blank" rel="noreferrer">
            Source ↗
          </a>
        )}
        <form action={toggleOpportunitySaved} style={{ marginLeft: 'auto' }}>
          <input type="hidden" name="id" value={opp.id} />
          <input type="hidden" name="status" value={opp.status ?? ''} />
          <button type="submit" className={`btn btn-sm ${saved ? 'btn-primary' : ''}`} aria-pressed={saved}>
            {saved ? '★ Remove from favourites' : '☆ Add to favourites'}
          </button>
        </form>
      </div>
    </article>
  );
}
