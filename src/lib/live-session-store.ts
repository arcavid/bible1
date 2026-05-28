import 'server-only'

import {
  toLiveSessionApiState,
  toLiveSessionUpsertRow,
  type LiveSessionApiState,
  type LiveSessionBroadcastState,
  type LiveSessionRow,
} from '@/lib/live-session'
import { getServerSupabaseClient } from '@/lib/supabase/server'

type SupabaseErrorLike = { message: string }

export type LiveSessionStoreResult =
  | { configured: false }
  | { configured: true; state: LiveSessionApiState | null }

export async function readLiveSession(
  slug: string,
): Promise<LiveSessionStoreResult> {
  const supabase = getServerSupabaseClient()
  if (!supabase) return { configured: false }

  const result = (await supabase
    .from('live_sessions')
    .select('*')
    .eq('slug', slug)
    .maybeSingle()) as {
    data: LiveSessionRow | null
    error: SupabaseErrorLike | null
  }

  if (result.error) throw new Error(result.error.message)

  return {
    configured: true,
    state: result.data ? toLiveSessionApiState(result.data) : null,
  }
}

export async function upsertLiveSession(
  slug: string,
  state: LiveSessionBroadcastState,
): Promise<LiveSessionStoreResult> {
  const supabase = getServerSupabaseClient()
  if (!supabase) return { configured: false }

  const row = toLiveSessionUpsertRow(slug, state)
  const result = (await supabase
    .from('live_sessions')
    .upsert(row, { onConflict: 'slug' })
    .select('*')
    .single()) as { data: LiveSessionRow; error: SupabaseErrorLike | null }

  if (result.error) throw new Error(result.error.message)

  return {
    configured: true,
    state: toLiveSessionApiState(result.data),
  }
}
