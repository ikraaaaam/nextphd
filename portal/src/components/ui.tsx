import Link from 'next/link';
import type { ReactNode } from 'react';
import { fmtDate, fmtDateTime, link, pretty, toneFor, type Tone } from '@/lib/format';

export function Badge({ children, tone = 'neutral', title }: { children: ReactNode; tone?: Tone; title?: string }) {
  const toneClass = {
    neutral: '',
    info: 'active',
    ok: 'success',
    warn: 'warning',
    bad: 'warning', // styling generic warning for bad
  }[tone] || '';
  
  return (
    <span className={`chip ${toneClass}`} title={title}>
      {children}
    </span>
  );
}

export function StatusBadge({ status, fallback = 'UNKNOWN' }: { status: string | null | undefined; fallback?: string }) {
  const label = status || fallback;
  return <Badge tone={toneFor(label)}>{pretty(label)}</Badge>;
}

export function PageHeader({ title, description, actions, crumb }: { title: string; description?: string; actions?: ReactNode; crumb?: ReactNode }) {
  return (
    <div style={{ marginBottom: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
      <div>
        {crumb && <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '8px', fontWeight: 500 }}>{crumb}</div>}
        <h1 style={{ marginBottom: description ? '8px' : 0 }}>{title}</h1>
        {description && <p style={{ color: 'var(--text-2)', fontSize: '1rem', maxWidth: '600px' }}>{description}</p>}
      </div>
      {actions && <div style={{ display: 'flex', gap: '12px' }}>{actions}</div>}
    </div>
  );
}

export function Section({ title, hint, children, actions }: { title: string; hint?: string; children: ReactNode; actions?: ReactNode }) {
  return (
    <section className="dashboard-section">
      <h4 style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', paddingBottom: '8px', borderBottom: '1px solid var(--border)' }}>
        <div>
          <span style={{ color: 'var(--text-2)', fontWeight: 600, fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{title}</span>
          {hint && <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 400, textTransform: 'none', letterSpacing: 0, marginTop: '2px' }}>{hint}</p>}
        </div>
        {actions && <div style={{ fontSize: '0.85rem', fontWeight: 500 }}>{actions}</div>}
      </h4>
      {children}
    </section>
  );
}

export function StatCard({ label, value, note, href }: { label: string; value: ReactNode; note?: string; href?: string }) {
  const body = (
    <div className={`metric-card ${href ? 'interactive' : ''}`}>
      <span className="metric-value">{value}</span>
      <span className="metric-label">{label}</span>
      {note && <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '8px' }}>{note}</span>}
    </div>
  );
  return href ? (
    <Link href={href} style={{ textDecoration: 'none', color: 'inherit' }}>
      {body}
    </Link>
  ) : (
    body
  );
}

export function EmptyState({ title, children, action }: { title: string; children?: ReactNode; action?: ReactNode }) {
  return (
    <div className="empty-state">
      <h3>{title}</h3>
      {children && <p>{children}</p>}
      {action && <div style={{ marginTop: '16px' }}>{action}</div>}
    </div>
  );
}

export function ErrorNote({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <div className="alert alert-warning" role="alert">
      <strong>Error:</strong> {message}
    </div>
  );
}

export function Provenance({
  sourceUrl,
  sourceTitle,
  retrievedAt,
  verifiedAt,
  status,
  evidence,
}: {
  sourceUrl?: string | null;
  sourceTitle?: string | null;
  retrievedAt?: string | null;
  verifiedAt?: string | null;
  status?: string | null;
  evidence?: string | null;
}) {
  const href = link(sourceUrl);
  if (!href && !retrievedAt && !verifiedAt && !status) {
    return (
      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '12px' }}>
        <Badge tone="warn">No source recorded</Badge>
      </div>
    );
  }
  return (
    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '4px', padding: '12px', background: 'var(--surface-muted)', borderRadius: 'var(--radius-sm)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
        <span>
          <strong>Source:</strong>{' '}
          {href ? (
            <a href={href} target="_blank" rel="noreferrer">
              {sourceTitle || href}
            </a>
          ) : (
            'not recorded'
          )}
        </span>
        {status && <StatusBadge status={status} />}
      </div>
      <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
        {retrievedAt && <span><strong>Retrieved:</strong> {fmtDate(retrievedAt)}</span>}
        {verifiedAt && <span><strong>Verified:</strong> {fmtDate(verifiedAt)}</span>}
      </div>
      {evidence && <div style={{ marginTop: '4px', fontStyle: 'italic', borderLeft: '2px solid var(--border)', paddingLeft: '8px' }}>“{evidence}”</div>}
    </div>
  );
}

export function KV({ items }: { items: Array<[string, ReactNode]> }) {
  return (
    <dl style={{ display: 'grid', gridTemplateColumns: 'max-content 1fr', gap: '8px 16px', fontSize: '0.85rem' }}>
      {items.map(([k, v]) => (
        <div key={k} style={{ display: 'contents' }}>
          <dt style={{ color: 'var(--text-muted)', fontWeight: 500 }}>{k}</dt>
          <dd style={{ color: 'var(--text)', margin: 0, fontWeight: 500 }}>{v === null || v === undefined || v === '' ? '—' : v}</dd>
        </div>
      ))}
    </dl>
  );
}

export function ExternalLink({ href, children }: { href: string | null | undefined; children: ReactNode }) {
  const safe = link(href);
  if (!safe) return <span style={{ color: 'var(--text-muted)' }}>—</span>;
  return (
    <a href={safe} target="_blank" rel="noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
      {children} ↗
    </a>
  );
}

export function ScorePill({ score }: { score: number | null | undefined }) {
  if (typeof score !== 'number') return <Badge>No score</Badge>;
  const tone = score >= 75 ? 'ok' : score >= 50 ? 'info' : score >= 25 ? 'warn' : 'bad';
  return <Badge tone={tone}>{score}%</Badge>;
}

export function FitBreakdown({ value }: { value: any }) {
  if (!value || typeof value !== 'object' || Object.keys(value).length === 0) return <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No breakdown data available.</span>;
  return (
    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
      {Object.entries(value).map(([k, v]) => (
        <Badge key={k} tone="neutral" title={k.replace(/_/g, ' ')}>
          {k.replace(/_/g, ' ')}: {String(v)}
        </Badge>
      ))}
    </div>
  );
}
