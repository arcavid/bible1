'use client'

import { useTranslations } from 'next-intl'
import { useEffect, useMemo, useState } from 'react'

import { useRouter } from '@/i18n/navigation'
import {
  LIVE_SESSION_DEFAULT_SLUG,
  type LiveSessionBroadcastState,
} from '@/lib/live-session'

export type BroadcastVerse = LiveSessionBroadcastState

export function SlideController({
  current,
  previousHref,
  nextHref,
  previousChapterHref,
  nextChapterHref,
  liveHref,
}: {
  current: Omit<BroadcastVerse, 'blackout'>
  previousHref: string | null
  nextHref: string | null
  previousChapterHref: string | null
  nextChapterHref: string | null
  liveHref: string
}): React.JSX.Element {
  const router = useRouter()
  const t = useTranslations('SlideController')
  const [blackout, setBlackout] = useState(false)
  const [help, setHelp] = useState(false)
  const [jumpBuffer, setJumpBuffer] = useState('')
  const [liveNotice, setLiveNotice] = useState('')
  const [keyboardReady, setKeyboardReady] = useState(false)
  const channel = useMemo(
    () =>
      typeof window === 'undefined'
        ? null
        : new BroadcastChannel('bible1-live'),
    [],
  )

  useEffect(() => {
    return () => channel?.close()
  }, [channel])

  useEffect(() => {
    const payload = { ...current, blackout }
    channel?.postMessage({ type: 'verse', payload })

    const controller = new AbortController()
    const timeout = window.setTimeout(() => {
      void fetch(`/api/live-sessions/${LIVE_SESSION_DEFAULT_SLUG}`, {
        method: 'PUT',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(payload),
        signal: controller.signal,
      }).catch(() => {
        // BroadcastChannel remains the local fallback when Supabase/API is absent.
      })
    }, 120)

    return () => {
      controller.abort()
      window.clearTimeout(timeout)
    }
  }, [blackout, channel, current])

  useEffect(() => {
    function openLiveProjector(): void {
      window.open(liveHref, '_blank', 'noopener,noreferrer')
      setLiveNotice(t('liveOpened'))
    }

    function onKeyDown(event: KeyboardEvent): void {
      const key = event.key.toLowerCase()
      if ((event.metaKey || event.ctrlKey) && key === 'k') {
        event.preventDefault()
        router.push('/')
        return
      }
      if ((event.metaKey || event.ctrlKey) && key === 'z') {
        event.preventDefault()
        if (previousHref) router.push(previousHref)
        return
      }
      if (/^\d$/.test(event.key)) {
        event.preventDefault()
        setJumpBuffer((value) => `${value}${event.key}`.slice(0, 3))
        return
      }
      if (event.key === 'Enter' && jumpBuffer.length > 0) {
        event.preventDefault()
        const target = Number(jumpBuffer)
        setJumpBuffer('')
        if (Number.isInteger(target) && target > 0) {
          const parts = current.href.split('/')
          router.push(`/${parts[1]}/${parts[2]}/${target}`)
        }
        return
      }
      if (
        event.key === 'ArrowRight' ||
        event.key === ' ' ||
        event.key === 'ArrowDown'
      ) {
        event.preventDefault()
        if (nextHref) router.push(nextHref)
        return
      }
      if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
        event.preventDefault()
        if (previousHref) router.push(previousHref)
        return
      }
      if (event.key === 'Home') {
        event.preventDefault()
        const parts = current.href.split('/')
        router.push(`/${parts[1]}/${parts[2]}/1`)
        return
      }
      if (event.key === 'PageDown') {
        event.preventDefault()
        if (nextChapterHref) router.push(nextChapterHref)
        return
      }
      if (event.key === 'PageUp') {
        event.preventDefault()
        if (previousChapterHref) router.push(previousChapterHref)
        return
      }
      if (event.key === 'End') {
        event.preventDefault()
        const last =
          document.querySelector<HTMLElement>('[data-last-verse]')?.dataset[
            'lastVerse'
          ]
        if (last) {
          const parts = current.href.split('/')
          router.push(`/${parts[1]}/${parts[2]}/${last}`)
        }
        return
      }
      if (key === 'b') {
        event.preventDefault()
        setBlackout((value) => !value)
        return
      }
      if (key === 'f') {
        event.preventDefault()
        if (document.fullscreenElement) {
          void document.exitFullscreen()
        } else {
          void document.documentElement.requestFullscreen()
        }
        return
      }
      if (key === 'l') {
        event.preventDefault()
        openLiveProjector()
        return
      }
      if (event.key === '?') {
        event.preventDefault()
        setHelp((value) => !value)
        return
      }
      if (event.key === 'Escape') {
        event.preventDefault()
        if (help) {
          setHelp(false)
          return
        }
        if (jumpBuffer.length > 0) {
          setJumpBuffer('')
        }
      }
    }
    window.addEventListener('keydown', onKeyDown)
    setKeyboardReady(true)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [
    current,
    help,
    jumpBuffer,
    liveHref,
    nextChapterHref,
    nextHref,
    previousChapterHref,
    previousHref,
    router,
    t,
  ])

  return (
    <>
      <div
        className="fixed right-3 bottom-3 left-3 z-20 flex max-w-[calc(100vw-1.5rem)] items-center gap-2 overflow-x-auto rounded-2xl border border-white/10 bg-black/85 px-3 py-2 text-xs text-slate-300 shadow-2xl backdrop-blur sm:right-auto sm:left-1/2 sm:w-max sm:max-w-[calc(100vw-2rem)] sm:-translate-x-1/2 sm:rounded-full sm:px-4"
        data-slide-controller
        data-slide-controller-ready={keyboardReady ? 'true' : 'false'}
      >
        {[
          t('next'),
          t('previous'),
          t('chapterMove'),
          t('blackout'),
          t('fullscreen'),
          t('liveTab'),
          t('help'),
        ].map((label) => (
          <span
            key={label}
            className="shrink-0 leading-5 whitespace-nowrap"
            data-slide-controller-item
          >
            {label}
          </span>
        ))}
        {liveNotice ? (
          <span
            className="shrink-0 rounded bg-blue-500/20 px-2 py-1 leading-5 whitespace-nowrap text-blue-100"
            data-slide-controller-item
          >
            {liveNotice}
          </span>
        ) : null}
        {jumpBuffer ? (
          <span
            className="shrink-0 rounded bg-blue-500 px-2 py-1 leading-5 whitespace-nowrap text-white"
            data-slide-controller-item
          >
            {t('jump', { buffer: jumpBuffer })}
          </span>
        ) : null}
      </div>
      {help ? (
        <div
          className="fixed inset-0 z-30 grid place-items-center bg-black/70 p-6"
          role="dialog"
          aria-modal="true"
          aria-labelledby="presenter-keyboard-help-title"
        >
          <div className="max-w-xl rounded-[2rem] border border-white/15 bg-slate-950 p-6 shadow-2xl">
            <h2
              id="presenter-keyboard-help-title"
              className="text-2xl font-bold"
            >
              {t('keyboardTitle')}
            </h2>
            <dl className="mt-4 grid grid-cols-[auto_1fr] gap-x-5 gap-y-2 text-sm text-slate-300">
              <dt>→ / Space</dt>
              <dd>{t('shortcuts.next')}</dd>
              <dt>←</dt>
              <dd>{t('shortcuts.previous')}</dd>
              <dt>숫자 + Enter</dt>
              <dd>{t('shortcuts.jump')}</dd>
              <dt>PageUp / PageDown</dt>
              <dd>{t('shortcuts.chapter')}</dd>
              <dt>B</dt>
              <dd>{t('shortcuts.blackout')}</dd>
              <dt>F</dt>
              <dd>{t('shortcuts.fullscreen')}</dd>
              <dt>L</dt>
              <dd>{t('shortcuts.live')}</dd>
              <dt>Esc</dt>
              <dd>{t('shortcuts.escape')}</dd>
            </dl>
            <button
              className="mt-6 rounded-full bg-white px-4 py-2 font-semibold text-black"
              type="button"
              onClick={() => setHelp(false)}
            >
              {t('close')}
            </button>
          </div>
        </div>
      ) : null}
    </>
  )
}
