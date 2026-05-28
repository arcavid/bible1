'use client'

import { useTranslations } from 'next-intl'

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error
  reset: () => void
}): React.JSX.Element {
  const t = useTranslations('Error')

  return (
    <main className="grid min-h-dvh place-items-center bg-black p-6 text-center text-white">
      <div>
        <p className="text-sm tracking-[0.4em] text-red-300 uppercase">
          {t('eyebrow')}
        </p>
        <h1 className="mt-3 text-4xl font-black">{t('title')}</h1>
        <p className="mt-4 max-w-xl text-slate-400">{error.message}</p>
        <button
          className="mt-8 rounded-full bg-white px-5 py-3 font-semibold text-black"
          type="button"
          onClick={reset}
        >
          {t('retry')}
        </button>
      </div>
    </main>
  )
}
