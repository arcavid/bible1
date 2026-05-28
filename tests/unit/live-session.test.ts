import { describe, expect, it } from 'vitest'

import {
  LIVE_SESSION_DEFAULT_SLUG,
  toLiveSessionApiState,
  toLiveSessionUpsertRow,
} from '@/lib/live-session'

describe('live session state mapping', () => {
  it('maps presenter broadcast state into a Supabase upsert row', () => {
    expect(
      toLiveSessionUpsertRow(LIVE_SESSION_DEFAULT_SLUG, {
        href: '/Psalms/23/5',
        reference: '시편 23장 5절',
        ordinal: 5,
        number: 5,
        text: '예시 발표 문장입니다',
        blackout: true,
      }),
    ).toEqual({
      slug: 'today',
      current_href: '/Psalms/23/5',
      reference: '시편 23장 5절',
      translation_code: 'krv',
      translation_id: null,
      current_verse_id: null,
      preview_verse_id: null,
      current_text_snapshot: '예시 발표 문장입니다',
      state_version: 1,
      book_slug: 'Psalms',
      chapter: 23,
      verse: 5,
      ordinal: 5,
      number: 5,
      text: '예시 발표 문장입니다',
      blackout: true,
    })
  })

  it('maps Supabase rows back into the audience-safe API state shape', () => {
    expect(
      toLiveSessionApiState({
        id: 'row-id',
        slug: 'today',
        current_href: '/John/3/16',
        reference: '요한복음 3장 16절',
        book_slug: 'John',
        chapter: 3,
        verse: 16,
        ordinal: 16,
        number: 16,
        text: '공개 테스트용 문장입니다',
        current_text_snapshot: '공개 테스트용 문장입니다',
        translation_code: 'krv',
        translation_id: null,
        current_verse_id: null,
        preview_verse_id: null,
        state_version: 7,
        presenter_client_id: null,
        last_heartbeat_at: null,
        blackout: false,
        service_plan_id: null,
        created_at: '2026-05-24T00:00:00Z',
        updated_at: '2026-05-24T00:00:01Z',
      }),
    ).toEqual({
      href: '/John/3/16',
      reference: '요한복음 3장 16절',
      ordinal: 16,
      number: 16,
      text: '공개 테스트용 문장입니다',
      blackout: false,
      updatedAt: '2026-05-24T00:00:01Z',
    })
  })

  it('rejects malformed presenter hrefs before they reach Supabase', () => {
    expect(() =>
      toLiveSessionUpsertRow('today', {
        href: '/not-a-real-ref',
        reference: 'bad',
        ordinal: 1,
        number: 1,
        text: 'bad',
        blackout: false,
      }),
    ).toThrow('Invalid live session href')
  })
})
