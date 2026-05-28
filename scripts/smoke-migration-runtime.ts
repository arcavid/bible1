import {
  buildRuntimeSmokeTargets,
  isSafeSmokeSlug,
  liveSessionSmokePayload,
  normalizeBaseUrl,
  servicePlanSmokePayload,
  validateApiSmokeResponse,
} from '@/lib/migration/runtime-smoke'

type SmokeResult = {
  label: string
  ok: boolean
  status?: number
  detail: string
}

void main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error)
  process.exit(1)
})

async function main(): Promise<void> {
  const baseUrl = readArg('--base-url=') ?? process.env['BIBLE1_BASE_URL']
  const write = process.argv.includes('--write')
  const json = process.argv.includes('--json')
  const timeoutMs = Number(readArg('--timeout-ms=') ?? 15_000)

  if (!baseUrl) {
    console.error(
      'Usage: pnpm smoke:migration -- --base-url=http://localhost:3000 [--write] [--json]',
    )
    process.exit(2)
  }

  const results: SmokeResult[] = []
  for (const target of buildRuntimeSmokeTargets(baseUrl)) {
    results.push(
      await smokeGet(target.label, target.url, target.kind, timeoutMs),
    )
  }

  if (write) {
    const slug = 'migration-smoke'
    if (!isSafeSmokeSlug(slug)) throw new Error(`Unsafe smoke slug ${slug}`)
    const normalizedBase = normalizeBaseUrl(baseUrl)
    results.push(
      await smokePut(
        'PUT /api/service-plans/migration-smoke',
        `${normalizedBase}/api/service-plans/${slug}`,
        servicePlanSmokePayload(),
        timeoutMs,
      ),
    )
    results.push(
      await smokePut(
        'PUT /api/live-sessions/migration-smoke',
        `${normalizedBase}/api/live-sessions/${slug}`,
        liveSessionSmokePayload(),
        timeoutMs,
      ),
    )
  }

  const ok = results.every((result) => result.ok)
  if (json) {
    console.log(JSON.stringify({ ok, write, results }, null, 2))
  } else {
    console.log(`bible1 runtime smoke: ${ok ? 'PASS' : 'FAIL'}`)
    for (const result of results) {
      console.log(
        `[${result.ok ? 'PASS' : 'FAIL'}] ${result.label}${result.status ? ` (${result.status})` : ''}: ${result.detail}`,
      )
    }
  }

  if (!ok) process.exit(1)
}

async function smokeGet(
  label: string,
  url: string,
  kind: 'page' | 'api',
  timeoutMs: number,
): Promise<SmokeResult> {
  try {
    const response = await fetchWithTimeout(url, { method: 'GET' }, timeoutMs)
    if (!response.ok) {
      return {
        label,
        ok: false,
        status: response.status,
        detail: response.statusText,
      }
    }
    if (kind === 'api') {
      const body = (await response.json().catch(() => null)) as unknown
      const validation = validateApiSmokeResponse(body)
      return validation.ok
        ? { label, ok: true, status: response.status, detail: 'API shape ok' }
        : {
            label,
            ok: false,
            status: response.status,
            detail: validation.reason,
          }
    }
    return {
      label,
      ok: true,
      status: response.status,
      detail: 'page reachable',
    }
  } catch (error) {
    return {
      label,
      ok: false,
      detail: error instanceof Error ? error.message : String(error),
    }
  }
}

async function smokePut(
  label: string,
  url: string,
  payload: unknown,
  timeoutMs: number,
): Promise<SmokeResult> {
  try {
    const response = await fetchWithTimeout(
      url,
      {
        method: 'PUT',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(payload),
      },
      timeoutMs,
    )
    if (!response.ok) {
      return {
        label,
        ok: false,
        status: response.status,
        detail: response.statusText,
      }
    }
    const body = (await response.json().catch(() => null)) as unknown
    const validation = validateApiSmokeResponse(body)
    return validation.ok
      ? {
          label,
          ok: true,
          status: response.status,
          detail: 'write API shape ok',
        }
      : { label, ok: false, status: response.status, detail: validation.reason }
  } catch (error) {
    return {
      label,
      ok: false,
      detail: error instanceof Error ? error.message : String(error),
    }
  }
}

async function fetchWithTimeout(
  url: string,
  init: RequestInit,
  timeoutMs: number,
): Promise<Response> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), timeoutMs)
  try {
    return await fetch(url, { ...init, signal: controller.signal })
  } finally {
    clearTimeout(timeout)
  }
}

function readArg(prefix: string): string | undefined {
  return process.argv
    .find((arg) => arg.startsWith(prefix))
    ?.slice(prefix.length)
}
