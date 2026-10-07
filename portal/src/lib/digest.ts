import type { Row } from './format';

export type DigestSection = { heading: string; items: string[] };

/** Parse the pipeline's markdown digest into sections WITHOUT rendering raw HTML. */
export function parseDigest(md: string | null | undefined): DigestSection[] {
  if (!md) return [];
  const sections: DigestSection[] = [];
  let current: DigestSection | null = null;
  for (const raw of md.split('\n')) {
    const line = raw.replace(/\s+$/, '');
    if (line.startsWith('## ')) {
      current = { heading: line.slice(3).trim(), items: [] };
      sections.push(current);
    } else if (current && /^\s*-\s+/.test(line)) {
      const text = line.replace(/^\s*-\s+/, '').replace(/\*/g, '');
      if (/^\s{2,}-/.test(line) && current.items.length > 0) {
        current.items[current.items.length - 1] += ` — ${text}`;
      } else {
        current.items.push(text);
      }
    }
  }
  return sections;
}

export function sectionItems(sections: DigestSection[], heading: string): string[] {
  return sections.find((s) => s.heading.toUpperCase().startsWith(heading))?.items ?? [];
}

export const CYCLE_SEGMENTS = [
  { key: 'MORNING_DISCOVERY', label: 'Morning Discovery', detail: 'Finds new opportunities from configured sources.' },
  { key: 'AFTERNOON_VERIFICATION', label: 'Afternoon Verification', detail: 'Re-matches professors and processes research signals.' },
  { key: 'EVENING_DIGEST', label: 'Evening Intelligence', detail: 'Builds the daily digest of meaningful changes.' },
] as const;

export function latestRun(runs: Row[], segment: string): Row | null {
  return runs.find((r) => r.segment === segment) ?? null;
}

export function warningsFromRun(run: Row | null): string[] {
  const list = run?.source_failures;
  if (!Array.isArray(list)) return [];
  return list.map((w: unknown) => {
    if (w && typeof w === 'object') {
      const o = w as Record<string, unknown>;
      return String(o.warning ?? o.error ?? JSON.stringify(o));
    }
    return String(w);
  });
}
