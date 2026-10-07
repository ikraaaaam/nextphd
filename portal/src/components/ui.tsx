import Link from 'next/link';
import type { ReactNode } from 'react';
import { fmtDate, fmtDateTime, link, pretty, toneFor, type Tone } from '@/lib/format';

export function Badge({ children, tone = 'neutral', title }: { children: ReactNode; tone?: Tone; title?: string }) {
  return (
    <span className={`badge badge-${tone}`} title={title}>
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
    <div>
      {crumb && <div className="breadcrumb">{crumb}</div>}
      <div className="page-head">
        <div>
          <h1>{title}</h1>
          {description && <p>{description}</p>}
        </div>
        {actions && <div className="row">{actions}</div>}
      </div>
    </div>
  );
}

export function Section({ title, hint, children, actions }: { title: string; hint?: string; children: ReactNode; actions?: ReactNode }) {
  return (
    <section className="section">
      <div className="section-title">
        <div>
          <h2>{title}</h2>
          {hint && <p className="muted small">{hint}</p>}
        </div>
        {actions}
      </div>
      {children}
    </section>
  );
}

export function StatCard({ label, value, note, href }: { label: string; value: ReactNode; note?: string; href?: string }) {
  const body = (
    <div className="card stat">
      <span className="stat-label">{label}</span>
      <span className="stat-value">{value}</span>
      {note && <span className="stat-note">{note}</span>}
    </div>
  );
  return href ? (
    <Link href={href} className="stat-link">
      {body}
    </Link>
  ) : (
    body
  );
}

export function EmptyState({ title, children, action }: { title: string; children?: ReactNode; action?: ReactNode }) {
  return (
    <div className="empty">
      <h3>{title}</h3>
      {children && <p>{children}</p>}
      {action}
    </div>
  );
}

export function ErrorNote({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <div className="notice notice-bad" role="alert">
      Could not load some data: {message}
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
      <div className="prov">
        <Badge tone="warn">No source recorded</Badge>
      </div>
    );
  }
  return (
    <div className="prov">
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
      {retrievedAt && (
        <span>
          <strong>Retrieved:</strong> {fmtDate(retrievedAt)}
        </span>
      )}
      {verifiedAt && (
        <span>
          <strong>Last verified:</strong> {fmtDate(verifiedAt)}
        </span>
      )}
      {status && <StatusBadge status={status} />}
      {evidence && <span className="pre">“{evidence}”</span>}
    </div>
  );
}

export function KV({ items }: { items: Array<[string, ReactNode]> }) {
  return (
    <dl className="kv">
      {items.map(([k, v]) => (
        <div key={k} style={{ display: 'contents' }}>
          <dt>{k}</dt>
          <dd>{v === null || v === undefined || v === '' ? '—' : v}</dd>
        </div>
      ))}
    </dl>
  );
}

export function ExternalLink({ href, children }: { href: string | null | undefined; children: ReactNode }) {
  const safe = link(href);
  if (!safe) return <span className="muted">—</span>;
  return (
    <a href={safe} target="_blank" rel="noreferrer">
      {children}
    </a>
  );
}

export function ScorePill({ score }: { score: number | null | undefined }) {
  if (score === null || score === undefined) return <Badge tone="neutral">No score</Badge>;
  const tone: Tone = score >= 75 ? 'ok' : score >= 50 ? 'warn' : 'bad';
  return <Badge tone={tone}>Match {score}%</Badge>;
}

export function FitBreakdown({ value }: { value: unknown }) {
  if (!value || typeof value !== 'object') return null;
  const entries = Object.entries(value as Record<string, unknown>).filter(([, v]) => typeof v === 'number' || typeof v === 'string' || typeof v === 'boolean');
  if (entries.length === 0) return null;
  return (
    <ul className="small muted" style={{ listStyle: 'none', display: 'flex', gap: '4px 14px', flexWrap: 'wrap' }}>
      {entries.map(([k, v]) => (
        <li key={k}>
          <strong style={{ color: 'var(--text-2)' }}>{pretty(k)}:</strong> {String(v)}
        </li>
      ))}
    </ul>
  );
}

export { fmtDate, fmtDateTime };
