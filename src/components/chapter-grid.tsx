import { getTranslations } from 'next-intl/server'

import { Link } from '@/i18n/navigation'
import { verseHref } from '@/lib/bible/reference'
import type { Chapter } from '@/lib/bible/types'

import { VerseGridKeyboard } from './verse-grid-keyboard.client'

export async function ChapterGrid({
  chapter,
}: {
  chapter: Chapter
}): Promise<React.JSX.Element> {
  const t = await getTranslations('Chapter')
  const reference = `${chapter.korean} ${chapter.chapter}장`

  return (
    <section className="mx-auto w-full max-w-screen-2xl px-5 py-8 md:px-8">
      <VerseGridKeyboard />
      <div
        data-verse-grid
        className="grid grid-cols-2 gap-4 rounded-[2rem] border border-white/10 bg-black/35 p-4 sm:grid-cols-3 md:grid-cols-5 md:gap-5 md:p-6 xl:grid-cols-10"
        aria-label={t('verseGridLabel', { reference })}
      >
        {chapter.verses.map((verse) => (
          <Link
            data-verse-link
            key={verse.ordinal}
            href={verseHref({
              book: chapter.book,
              chapter: chapter.chapter,
              verse: verse.ordinal,
            })}
            className="group flex min-h-36 flex-col items-center justify-start rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-center font-semibold text-slate-200 transition hover:border-blue-300 hover:bg-blue-500/15 focus-visible:bg-blue-500/20"
            aria-label={t('verseTileLabel', {
              reference,
              ordinal: verse.ordinal,
              number: verse.number,
            })}
          >
            <span className="font-mono text-3xl tabular-nums">
              {verse.ordinal}
            </span>
            {verse.number !== verse.ordinal ? (
              <span className="mt-1 rounded bg-amber-400/15 px-1.5 py-0.5 text-[0.65rem] text-amber-200">
                {t('sourceVerse', { number: verse.number })}
              </span>
            ) : null}
            <span className="verse-preview-clamp mt-3 h-12 w-full text-sm leading-6 font-normal text-slate-400">
              {verse.text}
            </span>
          </Link>
        ))}
      </div>
    </section>
  )
}
