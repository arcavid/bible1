import { NextResponse } from 'next/server'

import { readLiveSession, upsertLiveSession } from '@/lib/live-session-store'
import type { LiveSessionBroadcastState } from '@/lib/live-session'

export const dynamic = 'force-dynamic'

type Params = { id: string }

function isSafeSlug(value: string): boolean {
  return /^[a-zA-Z0-9][a-zA-Z0-9_-]{0,127}$/.test(value)
}

function parseLiveSessionBody(body: unknown): LiveSessionBroadcastState | null {
  if (!body || typeof body !== 'object') return null
  const candidate = body as Record<string, unknown>
  if (
    typeof candidate['href'] !== 'string' ||
    typeof candidate['reference'] !== 'string' ||
    typeof candidate['ordinal'] !== 'number' ||
    typeof candidate['number'] !== 'number' ||
    typeof candidate['text'] !== 'string' ||
    typeof candidate['blackout'] !== 'boolean'
  ) {
    return null
  }

  return {
    href: candidate['href'],
    reference: candidate['reference'],
    ordinal: candidate['ordinal'],
    number: candidate['number'],
    text: candidate['text'],
    blackout: candidate['blackout'],
  }
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<Params> },
): Promise<NextResponse> {
  const { id } = await params
  if (!isSafeSlug(id)) {
    return NextResponse.json(
      { ok: false, error: 'Invalid session id' },
      { status: 400 },
    )
  }

  try {
    const result = await readLiveSession(id)
    if (!result.configured) {
      return NextResponse.json({ ok: true, configured: false, state: null })
    }

    return NextResponse.json({
      ok: true,
      configured: true,
      state: result.state,
    })
  } catch {
    return NextResponse.json(
      { ok: false, error: 'Unable to read live session' },
      { status: 500 },
    )
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<Params> },
): Promise<NextResponse> {
  const { id } = await params
  if (!isSafeSlug(id)) {
    return NextResponse.json(
      { ok: false, error: 'Invalid session id' },
      { status: 400 },
    )
  }

  const state = parseLiveSessionBody(await request.json().catch(() => null))
  if (!state) {
    return NextResponse.json(
      { ok: false, error: 'Invalid live session payload' },
      { status: 400 },
    )
  }

  try {
    const result = await upsertLiveSession(id, state)
    if (!result.configured) {
      return NextResponse.json({ ok: true, configured: false, state: null })
    }

    return NextResponse.json({
      ok: true,
      configured: true,
      state: result.state,
    })
  } catch {
    return NextResponse.json(
      { ok: false, error: 'Unable to save live session' },
      { status: 500 },
    )
  }
}
