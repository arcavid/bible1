'use client'

import { useTranslations } from 'next-intl'
import { useEffect, useMemo, useRef, useState } from 'react'

import { useRouter } from '@/i18n/navigation'
import {
  parseServicePlanInput,
  servicePlanItemHref,
  servicePlanItemLabel,
} from '@/lib/service-plan'

type SyncState = 'loading' | 'local' | 'synced' | 'saving' | 'error'

export function ServicePlaylist({
  serviceId,
}: {
  serviceId: string
}): React.JSX.Element {
  const t = useTranslations('Service')
  const storageKey = `bible1:service:${serviceId}`
  const [raw, setRaw] = useState(() => t('defaultInput'))
  const [syncState, setSyncState] = useState<SyncState>('loading')
  const didHydrate = useRef(false)
  const router = useRouter()

  useEffect(() => {
    const saved = window.localStorage.getItem(storageKey)
    if (saved) setRaw(saved)

    let cancelled = false
    void fetch(`/api/service-plans/${encodeURIComponent(serviceId)}`, {
      cache: 'no-store',
    })
      .then((response) => (response.ok ? response.json() : null))
      .then(
        (
          payload: {
            ok?: boolean
            configured?: boolean
            plan?: { rawInput?: string } | null
          } | null,
        ) => {
          if (cancelled) return
          if (payload?.ok && payload.configured && payload.plan?.rawInput) {
            setRaw(payload.plan.rawInput)
            setSyncState('synced')
          } else {
            setSyncState('local')
          }
        },
      )
      .catch(() => {
        if (!cancelled) setSyncState('local')
      })
      .finally(() => {
        didHydrate.current = true
      })

    return () => {
      cancelled = true
    }
  }, [serviceId, storageKey])

  useEffect(() => {
    window.localStorage.setItem(storageKey, raw)
    if (!didHydrate.current) return

    const controller = new AbortController()
    const timeout = window.setTimeout(() => {
      setSyncState((state) => (state === 'local' ? 'local' : 'saving'))
      void fetch(`/api/service-plans/${encodeURIComponent(serviceId)}`, {
        method: 'PUT',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          rawInput: raw,
          title: t('titleForSave', { id: serviceId }),
        }),
        signal: controller.signal,
      })
        .then((response) => (response.ok ? response.json() : null))
        .then((payload: { ok?: boolean; configured?: boolean } | null) => {
          if (payload?.ok && payload.configured) {
            setSyncState('synced')
          } else if (payload?.ok && payload.configured === false) {
            setSyncState('local')
          } else {
            setSyncState('error')
          }
        })
        .catch((error: unknown) => {
          if (error instanceof DOMException && error.name === 'AbortError')
            return
          setSyncState('error')
        })
    }, 450)

    return () => {
      controller.abort()
      window.clearTimeout(timeout)
    }
  }, [raw, serviceId, storageKey, t])

  const items = useMemo(() => parseServicePlanInput(raw), [raw])

  return (
    <section className="mx-auto max-w-4xl px-5 py-10">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <label
          htmlFor="service-refs"
          className="block text-sm font-medium text-slate-300"
        >
          {t('inputLabel')}
        </label>
        <p className="rounded-full border border-white/10 px-3 py-1 text-xs text-slate-400">
          {t(`sync.${syncState}`)}
        </p>
      </div>
      <textarea
        id="service-refs"
        value={raw}
        onChange={(event) => setRaw(event.target.value)}
        className="mt-3 min-h-40 w-full rounded-3xl border border-white/10 bg-black/50 p-5 text-xl text-white"
      />
      <div className="mt-6 flex flex-wrap gap-3">
        {items.map((item) => (
          <button
            key={`${item.book}-${item.chapter}-${item.startVerse ?? 'chapter'}-${item.endVerse ?? 'single'}`}
            type="button"
            className="rounded-full border border-blue-300/30 bg-blue-500/10 px-4 py-2 text-blue-100 hover:bg-blue-500/20"
            onClick={() => router.push(servicePlanItemHref(item))}
          >
            {servicePlanItemLabel(item)}
          </button>
        ))}
      </div>
    </section>
  )
}
