'use client'

import { useTranslations } from 'next-intl'
import { useEffect, useMemo, useRef, useState } from 'react'

import { useRouter } from '@/i18n/navigation'
import {
  parseServicePlanInput,
  servicePlanItemHref,
  servicePlanItemLabel,
  type ServicePlanItem,
} from '@/lib/service-plan'

import { CopyVerseButton } from './copy-verse-button.client'

type SyncState = 'loading' | 'local' | 'synced' | 'saving' | 'error'
type PassageTextState =
  | { status: 'loading'; text: '' }
  | { status: 'ready'; text: string }
  | { status: 'error'; text: '' }

function serviceItemKey(item: ServicePlanItem): string {
  return [
    item.book,
    item.chapter,
    item.startVerse ?? 'chapter',
    item.endVerse ?? item.startVerse ?? 'all',
  ].join(':')
}

function buildScriptureApiPath(item: ServicePlanItem): string {
  const params = new URLSearchParams({
    book: item.book,
    chapter: String(item.chapter),
  })
  if (item.startVerse !== null) {
    params.set('startVerse', String(item.startVerse))
  }
  if (item.endVerse !== null) {
    params.set('endVerse', String(item.endVerse))
  }
  return `/api/scripture?${params.toString()}`
}

async function fetchPassageText(
  item: ServicePlanItem,
  signal: AbortSignal,
): Promise<PassageTextState> {
  const response = await fetch(buildScriptureApiPath(item), {
    cache: 'no-store',
    signal,
  })
  if (!response.ok) return { status: 'error', text: '' }

  const payload = (await response.json()) as { ok?: boolean; text?: string }
  if (payload.ok !== true || typeof payload.text !== 'string') {
    return { status: 'error', text: '' }
  }

  const text = payload.text.trim()
  return text ? { status: 'ready', text } : { status: 'error', text: '' }
}

export function ServicePlaylist({
  serviceId,
}: {
  serviceId: string
}): React.JSX.Element {
  const t = useTranslations('Service')
  const storageKey = `bible1:service:${serviceId}`
  const [raw, setRaw] = useState(() => t('defaultInput'))
  const [syncState, setSyncState] = useState<SyncState>('loading')
  const [passageTextByKey, setPassageTextByKey] = useState<
    Record<string, PassageTextState>
  >({})
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

  useEffect(() => {
    const controller = new AbortController()
    const keys = items.map(serviceItemKey)

    setPassageTextByKey((current) =>
      Object.fromEntries(
        keys.map((key) => [
          key,
          current[key]?.status === 'ready'
            ? current[key]
            : ({ status: 'loading', text: '' } satisfies PassageTextState),
        ]),
      ),
    )

    void Promise.all(
      items.map(async (item) => {
        const key = serviceItemKey(item)
        try {
          return [key, await fetchPassageText(item, controller.signal)] as const
        } catch (error) {
          if (error instanceof DOMException && error.name === 'AbortError') {
            return [key, null] as const
          }
          return [
            key,
            { status: 'error', text: '' } satisfies PassageTextState,
          ] as const
        }
      }),
    ).then((results) => {
      if (controller.signal.aborted) return
      setPassageTextByKey((current) => {
        const next = { ...current }
        for (const [key, result] of results) {
          if (result) next[key] = result
        }
        return next
      })
    })

    return () => controller.abort()
  }, [items])

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
      <div className="mt-6 grid gap-3">
        {items.map((item) => {
          const key = serviceItemKey(item)
          const passageText = passageTextByKey[key] ?? {
            status: 'loading',
            text: '',
          }
          const label = servicePlanItemLabel(item)

          return (
            <article
              key={key}
              className="rounded-3xl border border-white/10 bg-white/[0.04] p-4 shadow-lg shadow-black/10"
              data-service-plan-item
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <button
                  type="button"
                  className="inline-flex min-h-12 items-center justify-center rounded-2xl border border-blue-300/30 bg-blue-500/10 px-4 py-2 text-center font-semibold text-blue-100 hover:bg-blue-500/20 sm:justify-start"
                  onClick={() => router.push(servicePlanItemHref(item))}
                >
                  {label}
                </button>
                <div className="sm:w-44 sm:shrink-0">
                  <CopyVerseButton
                    text={passageText.text}
                    disabled={passageText.status !== 'ready'}
                    className="inline-flex w-full items-center justify-center rounded-2xl bg-white px-4 py-3 text-sm font-bold text-slate-950 transition hover:bg-blue-50 focus-visible:ring-4 focus-visible:ring-blue-200/70 disabled:cursor-not-allowed disabled:opacity-50"
                  />
                </div>
              </div>
              <p
                className="mt-3 rounded-2xl border border-white/10 bg-black/25 p-3 text-sm leading-6 whitespace-pre-line text-slate-300"
                data-service-plan-copy-text
              >
                {passageText.status === 'ready'
                  ? passageText.text
                  : passageText.status === 'loading'
                    ? t('copyLoading')
                    : t('copyUnavailable')}
              </p>
            </article>
          )
        })}
      </div>
    </section>
  )
}
