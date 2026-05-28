import { describe, expect, it } from 'vitest'

import {
  DEFAULT_PROJECTION_SETTINGS,
  parseProjectionSettings,
} from '@/lib/projection-settings'

describe('projection settings parsing', () => {
  it('falls back to the live-service-safe defaults when storage is empty or malformed', () => {
    expect(parseProjectionSettings(null)).toEqual(DEFAULT_PROJECTION_SETTINGS)
    expect(parseProjectionSettings('{not-json')).toEqual(
      DEFAULT_PROJECTION_SETTINGS,
    )
  })

  it('preserves known settings and ignores unknown or unsafe values', () => {
    expect(
      parseProjectionSettings(
        JSON.stringify({
          showVerseNumber: false,
          warmWhite: true,
          transition: 'none',
          surprise: 'ignored',
        }),
      ),
    ).toEqual({
      showVerseNumber: false,
      warmWhite: true,
      transition: 'none',
    })

    expect(
      parseProjectionSettings(
        JSON.stringify({
          showVerseNumber: 'nope',
          warmWhite: 'yes',
          transition: 'spin',
        }),
      ),
    ).toEqual(DEFAULT_PROJECTION_SETTINGS)
  })
})
