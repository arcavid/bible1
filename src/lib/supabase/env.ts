type EnvLike = Record<string, string | undefined>

export type PublicSupabaseConfig =
  | { configured: false }
  | { configured: true; url: string; anonKey: string }

export type ServerSupabaseConfig =
  | { configured: false }
  | {
      configured: true
      url: string
      serviceRoleKey: string
      databaseUrl?: string
    }

function readEnv(env: EnvLike, key: string): string | undefined {
  const value = env[key]?.trim()
  return value && value.length > 0 ? value : undefined
}

export function getPublicSupabaseConfig(
  env: EnvLike = process.env,
): PublicSupabaseConfig {
  const url = readEnv(env, 'NEXT_PUBLIC_SUPABASE_URL')
  const anonKey = readEnv(env, 'NEXT_PUBLIC_SUPABASE_ANON_KEY')

  if (!url || !anonKey) return { configured: false }
  return { configured: true, url, anonKey }
}

export function getServerSupabaseConfig(
  env: EnvLike = process.env,
): ServerSupabaseConfig {
  const url =
    readEnv(env, 'SUPABASE_URL') ?? readEnv(env, 'NEXT_PUBLIC_SUPABASE_URL')
  const serviceRoleKey = readEnv(env, 'SUPABASE_SERVICE_ROLE_KEY')
  const databaseUrl = readEnv(env, 'DATABASE_URL') ?? readEnv(env, 'DIRECT_URL')

  if (!url || !serviceRoleKey) return { configured: false }
  return databaseUrl
    ? { configured: true, url, serviceRoleKey, databaseUrl }
    : { configured: true, url, serviceRoleKey }
}

export function maskSupabaseConfigForStatus(config: ServerSupabaseConfig): {
  configured: boolean
  hasUrl: boolean
  hasServiceRoleKey: boolean
  hasDatabaseUrl: boolean
} {
  return {
    configured: config.configured,
    hasUrl: config.configured,
    hasServiceRoleKey: config.configured,
    hasDatabaseUrl: config.configured && Boolean(config.databaseUrl),
  }
}
