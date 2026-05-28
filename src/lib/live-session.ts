import { parseSegmentedRef } from './bible/reference'
import type { Database } from './supabase/types'

export const LIVE_SESSION_DEFAULT_SLUG = 'today'
export const LIVE_SESSION_POLL_INTERVAL_MS = 1_000

export type LiveSessionBroadcastState = {
  href: string
  reference: string
  ordinal: number
  number: number
  text: string
  blackout: boolean
}

export type LiveSessionApiState = LiveSessionBroadcastState & {
  updatedAt: string
}

export type LiveSessionRow =
  Database['public']['Tables']['live_sessions']['Row']
export type LiveSessionRowInsert =
  Database['public']['Tables']['live_sessions']['Insert']

const CURRENT_TRANSLATION_CODE = 'krv'

export function toLiveSessionUpsertRow(
  slug: string,
  state: LiveSessionBroadcastState,
): LiveSessionRowInsert {
  const [, book, chapter, verse] = state.href.split('/')
  const parsed =
    book && chapter && verse ? parseSegmentedRef(book, chapter, verse) : null

  if (!parsed?.verse) {
    throw new Error(`Invalid live session href: ${state.href}`)
  }

  return {
    slug,
    current_href: state.href,
    reference: state.reference,
    translation_code: CURRENT_TRANSLATION_CODE,
    translation_id: null,
    current_verse_id: null,
    preview_verse_id: null,
    current_text_snapshot: state.text,
    state_version: 1,
    book_slug: parsed.book,
    chapter: parsed.chapter,
    verse: parsed.verse,
    ordinal: state.ordinal,
    number: state.number,
    text: state.text,
    blackout: state.blackout,
  }
}

export function toLiveSessionApiState(
  row: LiveSessionRow,
): LiveSessionApiState {
  return {
    href: row.current_href,
    reference: row.reference,
    ordinal: row.ordinal,
    number: row.number,
    text: row.current_text_snapshot ?? row.text,
    blackout: row.blackout,
    updatedAt: row.updated_at,
  }
}
