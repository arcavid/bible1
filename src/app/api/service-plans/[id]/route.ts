import { NextResponse } from 'next/server'

import { readServicePlan, upsertServicePlan } from '@/lib/service-plan-store'

export const dynamic = 'force-dynamic'

type Params = { id: string }

function isSafeSlug(value: string): boolean {
  return /^[a-zA-Z0-9][a-zA-Z0-9_-]{0,127}$/.test(value)
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<Params> },
): Promise<NextResponse> {
  const { id } = await params
  if (!isSafeSlug(id)) {
    return NextResponse.json(
      { ok: false, error: 'Invalid service id' },
      { status: 400 },
    )
  }

  try {
    const result = await readServicePlan(id)
    if (!result.configured) {
      return NextResponse.json({ ok: true, configured: false, plan: null })
    }

    return NextResponse.json({ ok: true, configured: true, plan: result.plan })
  } catch {
    return NextResponse.json(
      { ok: false, error: 'Unable to read service plan' },
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
      { ok: false, error: 'Invalid service id' },
      { status: 400 },
    )
  }

  const body = (await request.json().catch(() => null)) as {
    rawInput?: unknown
    title?: unknown
    notes?: unknown
  } | null

  const rawInput = typeof body?.rawInput === 'string' ? body.rawInput : ''
  const title =
    typeof body?.title === 'string' && body.title.trim() ? body.title : '예배'
  const notes = typeof body?.notes === 'string' ? body.notes : null

  try {
    const result = await upsertServicePlan({ slug: id, rawInput, title, notes })
    if (!result.configured) {
      return NextResponse.json({ ok: true, configured: false, plan: null })
    }

    return NextResponse.json({ ok: true, configured: true, plan: result.plan })
  } catch {
    return NextResponse.json(
      { ok: false, error: 'Unable to save service plan' },
      { status: 500 },
    )
  }
}
