import { redirect } from 'next/navigation';
import { createClient } from '@/utils/supabase/server';
import type { Row } from './format';

/** Authenticated Supabase client bound to the user's session cookies (RLS applies). */
export async function requireSession() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');
  return { supabase, user };
}

type Result = { data: unknown[] | null; error: { message: string } | null };

/** Resolve a query into rows + an error message (never throws, never hides failures). */
export async function rows(query: PromiseLike<Result>): Promise<{ rows: Row[]; error: string | null }> {
  const { data, error } = await query;
  return { rows: (data ?? []) as Row[], error: error ? error.message : null };
}

export async function first(query: PromiseLike<Result>): Promise<{ row: Row | null; error: string | null }> {
  const r = await rows(query);
  return { row: r.rows[0] ?? null, error: r.error };
}

export function firstError(...errors: Array<string | null>): string | null {
  return errors.find((e): e is string => Boolean(e)) ?? null;
}
