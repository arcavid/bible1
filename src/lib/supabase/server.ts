import 'server-only'

import { createClient, type SupabaseClient } from '@supabase/supabase-js'

import type { Database } from './types'
import { getServerSupabaseConfig } from './env'

export function getServerSupabaseClient(): SupabaseClient<Database> | null {
  const config = getServerSupabaseConfig()
  if (!config.configured) return null

  return createClient<Database>(config.url, config.serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}
