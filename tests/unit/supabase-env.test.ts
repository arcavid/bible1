import { describe, expect, it } from 'vitest'

import {
  getPublicSupabaseConfig,
  getServerSupabaseConfig,
  maskSupabaseConfigForStatus,
} from '@/lib/supabase/env'

describe('Supabase environment boundary', () => {
  it('reports unavailable when env vars are absent without throwing or leaking values', () => {
    expect(getPublicSupabaseConfig({})).toEqual({ configured: false })
    expect(getServerSupabaseConfig({})).toEqual({ configured: false })
  })

  it('accepts Railway/Supabase env names and exposes only safe status metadata', () => {
    const env = {
      NEXT_PUBLIC_SUPABASE_URL: 'https://example.supabase.co',
      NEXT_PUBLIC_SUPABASE_ANON_KEY: 'anon-secret',
      SUPABASE_SERVICE_ROLE_KEY: 'service-role-secret',
      DATABASE_URL: 'postgres://secret',
    }

    expect(getPublicSupabaseConfig(env)).toEqual({
      configured: true,
      url: 'https://example.supabase.co',
      anonKey: 'anon-secret',
    })
    expect(getServerSupabaseConfig(env)).toEqual({
      configured: true,
      url: 'https://example.supabase.co',
      serviceRoleKey: 'service-role-secret',
      databaseUrl: 'postgres://secret',
    })
    expect(maskSupabaseConfigForStatus(getServerSupabaseConfig(env))).toEqual({
      configured: true,
      hasUrl: true,
      hasServiceRoleKey: true,
      hasDatabaseUrl: true,
    })
  })

  it('supports server-only SUPABASE_URL when NEXT_PUBLIC_SUPABASE_URL is unavailable', () => {
    expect(
      getServerSupabaseConfig({
        SUPABASE_URL: 'https://server-only.supabase.co',
        SUPABASE_SERVICE_ROLE_KEY: 'service-role-secret',
      }),
    ).toEqual({
      configured: true,
      url: 'https://server-only.supabase.co',
      serviceRoleKey: 'service-role-secret',
      databaseUrl: undefined,
    })
  })
})
