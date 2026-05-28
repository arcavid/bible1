'use client'

import { useTranslations } from 'next-intl'
import { useState } from 'react'

type CopyStatus = 'idle' | 'copied' | 'error'

async function writeClipboardText(text: string): Promise<void> {
  if (!navigator.clipboard?.writeText) {
    throw new Error('Clipboard API is unavailable')
  }

  await navigator.clipboard.writeText(text)
}

export function CopyVerseButton({
  text,
  className,
  disabled = false,
}: {
  text: string
  className?: string
  disabled?: boolean
}): React.JSX.Element {
  const t = useTranslations('Copy')
  const [status, setStatus] = useState<CopyStatus>('idle')
  const normalizedText = text.trim()
  const isDisabled = disabled || normalizedText.length === 0

  async function onCopy(): Promise<void> {
    if (isDisabled) return
    try {
      await writeClipboardText(normalizedText)
      setStatus('copied')
      window.setTimeout(() => setStatus('idle'), 2500)
    } catch {
      setStatus('error')
    }
  }

  return (
    <div className="space-y-2">
      <button
        type="button"
        className={
          className ??
          'inline-flex w-full items-center justify-center rounded-xl bg-white px-4 py-3 text-sm font-bold text-slate-950 transition hover:bg-blue-50 focus-visible:ring-4 focus-visible:ring-blue-200/70 disabled:cursor-not-allowed disabled:opacity-50'
        }
        disabled={isDisabled}
        onClick={() => void onCopy()}
        data-copy-verse-button
      >
        {t('verseOnly')}
      </button>
      <p
        className="min-h-5 text-xs text-blue-100"
        aria-live="polite"
        data-copy-verse-status
      >
        {status === 'copied'
          ? t('copied')
          : status === 'error'
            ? t('failed')
            : ' '}
      </p>
    </div>
  )
}
