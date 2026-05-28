'use client'

import { useTranslations } from 'next-intl'
import { useMemo, useState } from 'react'

import { useRouter } from '@/i18n/navigation'
import { searchChapters } from '@/lib/bible/reference'

export function CommandCenter(): React.JSX.Element {
  const [query, setQuery] = useState('')
  const [activeIndex, setActiveIndex] = useState(0)
  const router = useRouter()
  const t = useTranslations('Search')
  const results = useMemo(() => searchChapters(query, 3), [query])
  const selectedResult = results[activeIndex] ?? results[0] ?? null
  const activeOptionId = selectedResult
    ? `bible-search-result-${selectedResult.key}`
    : undefined

  function moveSelection(delta: 1 | -1): void {
    if (results.length === 0) return
    setActiveIndex(
      (current) => (current + delta + results.length) % results.length,
    )
  }

  return (
    <section
      className="mx-auto flex w-full max-w-2xl flex-col gap-4"
      aria-label={t('sectionLabel')}
    >
      <div className="rounded-[1.75rem] bg-black/75 p-3 shadow-[0_0_0_1px_rgba(255,255,255,0.10),0_24px_90px_rgba(0,0,0,0.45)] backdrop-blur-xl">
        <label
          htmlFor="bible-search"
          className="mb-3 block px-2 text-sm font-medium text-slate-300"
        >
          {t('label')}
        </label>
        <input
          id="bible-search"
          value={query}
          onChange={(event) => {
            setQuery(event.target.value)
            setActiveIndex(0)
          }}
          onKeyDown={(event) => {
            if (event.key === 'ArrowDown') {
              event.preventDefault()
              moveSelection(1)
              return
            }
            if (event.key === 'ArrowUp') {
              event.preventDefault()
              moveSelection(-1)
              return
            }
            if (event.key === 'Enter' && selectedResult) {
              event.preventDefault()
              router.push(selectedResult.href)
            }
          }}
          role="combobox"
          aria-label={t('label')}
          aria-autocomplete="list"
          aria-controls="bible-search-results"
          aria-activedescendant={activeOptionId}
          aria-expanded="true"
          placeholder={t('placeholder')}
          className="w-full rounded-2xl border border-blue-300/20 bg-slate-950/95 px-5 py-5 text-3xl font-semibold tracking-[-0.04em] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] outline-none placeholder:text-slate-600 focus-visible:ring-4 focus-visible:ring-blue-400/70"
        />
        <div
          id="bible-search-results"
          className="mt-3 h-[16.5rem] overflow-hidden rounded-2xl bg-white/[0.03] shadow-[0_0_0_1px_rgba(255,255,255,0.08)]"
          role="listbox"
          aria-label={t('resultsLabel')}
        >
          {results.length === 0 ? (
            <div className="grid h-full place-items-center px-5 py-6 text-xl text-slate-400">
              {t('empty')}
            </div>
          ) : (
            results.map((result, index) => (
              <button
                id={`bible-search-result-${result.key}`}
                key={result.key}
                type="button"
                className={`flex min-h-[4.5rem] w-full items-center justify-between gap-4 border-b border-white/10 px-5 py-4 text-left last:border-b-0 hover:bg-white/10 focus-visible:bg-blue-500/20 ${index === activeIndex ? 'bg-blue-500/20 ring-1 ring-blue-300/35' : ''}`}
                onClick={() => router.push(result.href)}
                role="option"
                aria-selected={index === activeIndex}
              >
                <span>
                  <span className="block text-2xl font-bold text-white">
                    {result.label}
                  </span>
                  <span className="mt-1 block text-sm text-slate-400">
                    {result.detail}
                  </span>
                </span>
                <span className="rounded-full bg-white/10 px-3 py-1 text-xs tracking-[0.2em] text-slate-300 uppercase">
                  {index === activeIndex ? t('enterHint') : t('open')}
                </span>
              </button>
            ))
          )}
        </div>
      </div>
    </section>
  )
}
