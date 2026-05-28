import {
  chapterHref,
  formatKoreanRef,
  parseReference,
  verseHref,
} from './bible/reference'
import type { BibleRef } from './bible/types'
import type { Database } from './supabase/types'

export type ServicePlanItem = {
  position: number
  rawRef: string
  book: BibleRef['book']
  chapter: number
  startVerse: number | null
  endVerse: number | null
}

export type ServicePlanItemRowInsert =
  Database['public']['Tables']['service_plan_items']['Insert']

const CURRENT_TRANSLATION_CODE = 'krv'

export function parseServicePlanInput(input: string): ServicePlanItem[] {
  return input
    .split(/[,\n]+/)
    .map((piece) => piece.trim())
    .filter(Boolean)
    .map((rawRef) => ({ rawRef, parsed: parseReference(rawRef) }))
    .filter(
      (entry): entry is { rawRef: string; parsed: BibleRef } =>
        entry.parsed !== null,
    )
    .map(({ rawRef, parsed }, position) => {
      const startVerse = parsed.verse ?? null
      const endVerse = detectEndVerse(rawRef, startVerse)
      return {
        position,
        rawRef,
        book: parsed.book,
        chapter: parsed.chapter,
        startVerse,
        endVerse,
      }
    })
}

export function servicePlanItemHref(item: ServicePlanItem): string {
  if (item.startVerse === null) {
    return chapterHref({ book: item.book, chapter: item.chapter })
  }

  return verseHref({
    book: item.book,
    chapter: item.chapter,
    verse: item.startVerse,
  })
}

export function servicePlanItemLabel(item: ServicePlanItem): string {
  if (item.startVerse === null) {
    return formatKoreanRef({ book: item.book, chapter: item.chapter })
  }

  const startLabel = formatKoreanRef({
    book: item.book,
    chapter: item.chapter,
    verse: item.startVerse,
  })
  if (item.endVerse === null || item.endVerse === item.startVerse) {
    return startLabel
  }

  return startLabel.replace(
    `${item.startVerse}절`,
    `${item.startVerse}–${item.endVerse}절`,
  )
}

export function toServicePlanItemRows(
  servicePlanId: string,
  items: ServicePlanItem[],
): ServicePlanItemRowInsert[] {
  return items.map((item) => ({
    service_plan_id: servicePlanId,
    position: item.position,
    translation_code: CURRENT_TRANSLATION_CODE,
    translation_id: null,
    book_id: null,
    chapter_id: null,
    start_verse_id: null,
    end_verse_id: null,
    book_slug: item.book,
    chapter: item.chapter,
    start_verse: item.startVerse,
    end_verse: item.endVerse,
    label: servicePlanItemLabel(item),
    href: servicePlanItemHref(item),
    raw_ref: item.rawRef,
    parsed_range: {
      translationCode: CURRENT_TRANSLATION_CODE,
      bookSlug: item.book,
      chapter: item.chapter,
      startVerse: item.startVerse,
      endVerse: item.endVerse,
    },
    validation_status: 'unresolved',
  }))
}

function detectEndVerse(
  rawRef: string,
  startVerse: number | null,
): number | null {
  if (startVerse === null) return null

  const normalized = rawRef
    .normalize('NFC')
    .replace(/[：]/g, ':')
    .replace(/[–—]/g, '-')
    .replace(/\s+/g, '')

  const match = /-(\d{1,3})(?:절)?$/.exec(normalized)
  if (!match) return null

  const endVerse = Number(match[1])
  if (!Number.isInteger(endVerse) || endVerse < startVerse) return null
  return endVerse
}
