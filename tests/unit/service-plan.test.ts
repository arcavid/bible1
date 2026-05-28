import { describe, expect, it } from 'vitest'

import {
  parseServicePlanInput,
  servicePlanItemHref,
  servicePlanItemLabel,
  toServicePlanItemRows,
} from '@/lib/service-plan'

describe('service plan references', () => {
  it('parses Korean service references while preserving verse ranges', () => {
    const items = parseServicePlanInput('시 23:1-6, 요 14:1-3\n롬 8:28')

    expect(items).toEqual([
      {
        position: 0,
        rawRef: '시 23:1-6',
        book: 'Psalms',
        chapter: 23,
        startVerse: 1,
        endVerse: 6,
      },
      {
        position: 1,
        rawRef: '요 14:1-3',
        book: 'John',
        chapter: 14,
        startVerse: 1,
        endVerse: 3,
      },
      {
        position: 2,
        rawRef: '롬 8:28',
        book: 'Romans',
        chapter: 8,
        startVerse: 28,
        endVerse: null,
      },
    ])
  })

  it('formats labels and hrefs for chapter, single-verse, and range items', () => {
    const [range, single, chapter] = parseServicePlanInput(
      '시 23:1-6, 롬 8:28, 창 1',
    )

    expect(range && servicePlanItemLabel(range)).toBe('시편 23장 1–6절')
    expect(range && servicePlanItemHref(range)).toBe('/Psalms/23/1')
    expect(single && servicePlanItemLabel(single)).toBe('로마서 8장 28절')
    expect(single && servicePlanItemHref(single)).toBe('/Romans/8/28')
    expect(chapter && servicePlanItemLabel(chapter)).toBe('창세기 1장')
    expect(chapter && servicePlanItemHref(chapter)).toBe('/Genesis/1')
  })

  it('serializes parsed items into Supabase insert rows', () => {
    const items = parseServicePlanInput('시 23:1-6')

    expect(toServicePlanItemRows('plan-123', items)).toEqual([
      {
        service_plan_id: 'plan-123',
        position: 0,
        translation_code: 'krv',
        translation_id: null,
        book_id: null,
        chapter_id: null,
        start_verse_id: null,
        end_verse_id: null,
        book_slug: 'Psalms',
        chapter: 23,
        start_verse: 1,
        end_verse: 6,
        label: '시편 23장 1–6절',
        href: '/Psalms/23/1',
        raw_ref: '시 23:1-6',
        parsed_range: {
          translationCode: 'krv',
          bookSlug: 'Psalms',
          chapter: 23,
          startVerse: 1,
          endVerse: 6,
        },
        validation_status: 'unresolved',
      },
    ])
  })
})
