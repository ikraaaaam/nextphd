// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Row = Record<string, any>;

export type Tone = 'ok' | 'warn' | 'bad' | 'info' | 'neutral';

export function fmtDate(value: string | null | undefined): string {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC' });
}

export function fmtDateTime(value: string | null | undefined): string {
  if (!value) return 'Never';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return 'Never';
  return d.toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: 'UTC' }) + ' UTC';
}

/** Whole days from today (UTC date) to a YYYY-MM-DD / ISO date. Negative = past. */
export function daysUntil(value: string | null | undefined): number | null {
  if (!value) return null;
  const target = new Date(value.length === 10 ? `${value}T00:00:00Z` : value);
  if (Number.isNaN(target.getTime())) return null;
  const now = new Date();
  const today = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  const t = Date.UTC(target.getUTCFullYear(), target.getUTCMonth(), target.getUTCDate());
  return Math.round((t - today) / 86_400_000);
}

export function deadlineLabel(value: string | null | undefined): { text: string; tone: Tone } {
  const d = daysUntil(value);
  if (d === null) return { text: 'No deadline', tone: 'neutral' };
  if (d < 0) return { text: `Passed ${-d}d ago`, tone: 'bad' };
  if (d === 0) return { text: 'Due today', tone: 'bad' };
  if (d <= 14) return { text: `${d}d left`, tone: 'bad' };
  if (d <= 45) return { text: `${d}d left`, tone: 'warn' };
  return { text: `${d}d left`, tone: 'info' };
}

export function toneFor(status: string | null | undefined): Tone {
  const s = (status ?? '').toUpperCase();
  if (['VERIFIED', 'VERIFIED_OFFICIAL', 'COMPLETED', 'SUCCESS', 'FULLY_FUNDED', 'EXPLICITLY_FUNDED', 'STIPEND_STATED', 'SALARY_STATED', 'TUITION_WAIVER_STATED', 'RECEIVED', 'OFFER', 'ACCEPTED', 'RESPONDED', 'POSITIVE', 'SUBMITTED', 'SENT'].includes(s)) return 'ok';
  if (['PARTIAL', 'UNVERIFIED', 'NEEDS_VERIFICATION', 'VERIFY', 'FUNDING_AVAILABLE_UNCLEAR', 'FOLLOW_UP', 'REQUESTED', 'DRAFTING', 'CONTACTED', 'NEUTRAL', 'PARTIALLY_FUNDED', 'DRAFT'].includes(s)) return 'warn';
  if (['FAILED', 'EXPIRED', 'CLOSED', 'REJECTED', 'DECLINED', 'NEGATIVE', 'IGNORED'].includes(s)) return 'bad';
  if (['RUNNING', 'NEW', 'SAVED', 'INTERESTED', 'RESEARCHING', 'PREPARING', 'APPLIED', 'INTERVIEW', 'TO_CONTACT'].includes(s)) return 'info';
  return 'neutral';
}

export function pretty(value: string | null | undefined): string {
  if (!value) return '—';
  return value.replace(/_/g, ' ');
}

export function asList(value: unknown): string[] {
  if (Array.isArray(value)) return value.map(String).filter(Boolean);
  return [];
}

/** Escape user text for use inside a PostgREST ilike/or() filter. */
export function safeSearch(raw: string): string {
  return raw.replace(/[,()%*\\:"']/g, ' ').trim().slice(0, 80);
}

export function one(value: string | string[] | undefined): string {
  return Array.isArray(value) ? (value[0] ?? '') : (value ?? '');
}

export function link(url: string | null | undefined): string | null {
  if (!url) return null;
  return /^https?:\/\//i.test(url) ? url : null;
}
