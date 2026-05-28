import { describe, expect, it } from 'vitest'

import {
  buildRuntimeSmokeTargets,
  isSafeSmokeSlug,
  normalizeBaseUrl,
  validateApiSmokeResponse,
} from '@/lib/migration/runtime-smoke'

describe('migration runtime smoke planning', () => {
  it('normalizes base URLs and builds critical bible1 route targets', () => {
    const targets = buildRuntimeSmokeTargets('https://preview.example.com///')

    expect(normalizeBaseUrl('https://preview.example.com///')).toBe(
      'https://preview.example.com',
    )
    expect(targets.map((target) => target.url)).toEqual([
      'https://preview.example.com/',
      'https://preview.example.com/Psalms/23',
      'https://preview.example.com/Psalms/23/5',
      'https://preview.example.com/Psalms/23/5/live',
      'https://preview.example.com/read/Psalms/23',
      'https://preview.example.com/service/today',
      'https://preview.example.com/api/service-plans/migration-smoke',
      'https://preview.example.com/api/live-sessions/migration-smoke',
    ])
    expect(targets.filter((target) => target.kind === 'api')).toHaveLength(2)
  })

  it('keeps smoke write slugs constrained', () => {
    expect(isSafeSmokeSlug('migration-smoke')).toBe(true)
    expect(isSafeSmokeSlug('migration-smoke-2026')).toBe(true)
    expect(isSafeSmokeSlug('../prod')).toBe(false)
    expect(isSafeSmokeSlug('today')).toBe(false)
  })

  it('validates fallback and configured API response shapes without requiring secrets', () => {
    expect(
      validateApiSmokeResponse({ ok: true, configured: false, plan: null }),
    ).toEqual({
      ok: true,
    })
    expect(
      validateApiSmokeResponse({ ok: true, configured: true, state: null }),
    ).toEqual({
      ok: true,
    })
    expect(validateApiSmokeResponse({ ok: false, error: 'boom' })).toEqual({
      ok: false,
      reason: 'API returned ok=false',
    })
    expect(validateApiSmokeResponse({ configured: false })).toEqual({
      ok: false,
      reason: 'API response missing ok=true',
    })
  })
})
