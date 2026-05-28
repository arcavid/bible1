'use client'

import { useEffect, useState } from 'react'

import {
  LIVE_SESSION_DEFAULT_SLUG,
  LIVE_SESSION_POLL_INTERVAL_MS,
  type LiveSessionApiState,
} from '@/lib/live-session'

import type { BroadcastVerse } from './slide-controller.client'

type AudienceState = BroadcastVerse

export function AudienceStage({
  initial,
  sessionSlug = LIVE_SESSION_DEFAULT_SLUG,
}: {
  initial: AudienceState
  sessionSlug?: string
}): React.JSX.Element {
  const [state, setState] = useState(initial)

  useEffect(() => {
    const channel = new BroadcastChannel('bible1-live')
    function onMessage(
      event: MessageEvent<{ type: string; payload: AudienceState }>,
    ): void {
      if (event.data.type === 'verse') setState(event.data.payload)
    }
    channel.addEventListener('message', onMessage)
    return () => channel.close()
  }, [])

  useEffect(() => {
    let cancelled = false

    async function pollLiveSession(): Promise<void> {
      let payload: unknown = null
      try {
        const response = await fetch(`/api/live-sessions/${sessionSlug}`, {
          cache: 'no-store',
        })
        if (response.ok) payload = (await response.json()) as unknown
      } catch {
        payload = null
      }

      if (cancelled) return
      if (isLiveSessionResponse(payload)) {
        setState(toAudienceState(payload.state))
      }
    }

    void pollLiveSession()
    const interval = window.setInterval(() => {
      void pollLiveSession()
    }, LIVE_SESSION_POLL_INTERVAL_MS)

    return () => {
      cancelled = true
      window.clearInterval(interval)
    }
  }, [sessionSlug])

  if (state.blackout) {
    return (
      <main
        className="h-dvh bg-black"
        data-blackout="true"
        aria-label="blackout"
      />
    )
  }

  return (
    <main
      className="projection-stage h-dvh overflow-hidden bg-black"
      aria-hidden="true"
      data-blackout="false"
      data-projection-live
    >
      <div className="projection-transition stage-text projection-live-canvas flex h-full flex-col justify-between">
        <div className="projection-live-content flex min-h-0 items-start">
          <div className="projection-verse-number projection-live-number shrink-0 font-bold opacity-80">
            {state.number}
          </div>
          <div
            className="projection-live-text min-w-0 font-semibold"
            data-projection-verse-text
          >
            {state.text}
          </div>
        </div>
        <div className="projection-live-reference flex justify-end font-semibold opacity-60">
          {state.reference}
        </div>
      </div>
    </main>
  )
}

function isLiveSessionResponse(payload: unknown): payload is {
  ok: true
  configured: true
  state: LiveSessionApiState
} {
  if (!payload || typeof payload !== 'object') return false
  const candidate = payload as Record<string, unknown>
  const state = candidate['state'] as Record<string, unknown> | null

  return (
    candidate['ok'] === true &&
    candidate['configured'] === true &&
    Boolean(state) &&
    typeof state?.['href'] === 'string' &&
    typeof state['reference'] === 'string' &&
    typeof state['ordinal'] === 'number' &&
    typeof state['number'] === 'number' &&
    typeof state['text'] === 'string' &&
    typeof state['blackout'] === 'boolean'
  )
}

function toAudienceState(state: LiveSessionApiState): AudienceState {
  return {
    href: state.href,
    reference: state.reference,
    ordinal: state.ordinal,
    number: state.number,
    text: state.text,
    blackout: state.blackout,
  }
}
