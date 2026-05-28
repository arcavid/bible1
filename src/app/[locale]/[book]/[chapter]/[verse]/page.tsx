import type { Metadata } from 'next'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { notFound } from 'next/navigation'

import { AppChrome } from '@/components/app-chrome'
import { CopyVerseButton } from '@/components/copy-verse-button.client'
import { SlideController } from '@/components/slide-controller.client'
import { SlideStage } from '@/components/slide-stage'
import { Link } from '@/i18n/navigation'
import { getBookBySlug } from '@/lib/bible/books'
import { getNeighborRefs, getVerse, loadChapter } from '@/lib/bible/corpus'
import {
  chapterHref,
  formatKoreanRef,
  liveHref,
  parseSegmentedRef,
  verseHref,
} from '@/lib/bible/reference'

type Params = { locale: string; book: string; chapter: string; verse: string }

export const dynamic = 'force-dynamic'
export const dynamicParams = true

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>
}): Promise<Metadata> {
  const resolved = await params
  const ref = parseSegmentedRef(resolved.book, resolved.chapter, resolved.verse)
  if (!ref?.verse) return {}
  const chapter = await loadChapter(ref)
  const verse = getVerse(chapter, ref.verse)
  if (!verse) return {}
  return {
    title: formatKoreanRef(ref),
    description: verse.text.slice(0, 150),
  }
}

export default async function VersePage({
  params,
}: {
  params: Promise<Params>
}): Promise<React.JSX.Element> {
  const resolved = await params
  setRequestLocale(resolved.locale)
  const parsed = parseSegmentedRef(
    resolved.book,
    resolved.chapter,
    resolved.verse,
  )
  if (!parsed?.verse) notFound()
  const ref = parsed as Required<typeof parsed>
  const chapter = await loadChapter(ref)
  const verse = getVerse(chapter, ref.verse)
  if (!verse) notFound()
  const neighbors = getNeighborRefs(ref, chapter.verses.length)
  const book = getBookBySlug(ref.book)
  const t = await getTranslations('Presenter')
  const nav = await getTranslations('Navigation')
  const previousChapterHref =
    ref.chapter > 1
      ? verseHref({ book: ref.book, chapter: ref.chapter - 1, verse: 1 })
      : null
  const previousChapterReference = previousChapterHref
    ? formatKoreanRef({ book: ref.book, chapter: ref.chapter - 1, verse: 1 })
    : null
  const nextChapterHref =
    book && ref.chapter < book.chapters
      ? verseHref({ book: ref.book, chapter: ref.chapter + 1, verse: 1 })
      : null
  const nextChapterReference = nextChapterHref
    ? formatKoreanRef({ book: ref.book, chapter: ref.chapter + 1, verse: 1 })
    : null
  const reference = formatKoreanRef(ref)
  const currentHref = verseHref(ref)
  const currentLiveHref = liveHref(ref)
  const previousHref = neighbors.previous ? verseHref(neighbors.previous) : null
  const nextHref = neighbors.next ? verseHref(neighbors.next) : null

  return (
    <main className="bg-presenter-bg min-h-dvh pb-20 text-white">
      <AppChrome
        eyebrow={t('eyebrow')}
        title={reference}
        actions={
          <Link
            className="rounded-full border border-white/10 px-3 py-2 hover:bg-white/10"
            href={chapterHref(ref)}
          >
            {nav('grid')}
          </Link>
        }
      />
      <span
        data-last-verse={chapter.verses.length}
        data-last-verse-marker
        className="sr-only"
      />
      <section className="grid gap-5 p-5 lg:grid-cols-[minmax(0,1fr)_24rem] lg:p-8">
        <div className="overflow-hidden rounded-[2rem] border border-white/10 bg-black shadow-2xl shadow-black/40">
          <SlideStage reference={reference} verse={verse} />
        </div>
        <aside className="space-y-5">
          <div className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-5">
            <p className="text-xs tracking-[0.3em] text-blue-300 uppercase">
              {t('nextMove')}
            </p>
            {neighbors.next ? (
              <Link
                href={verseHref(neighbors.next)}
                className="mt-3 block rounded-2xl border border-blue-300/25 bg-blue-500/10 p-4 hover:bg-blue-500/20 focus-visible:ring-4 focus-visible:ring-blue-200/60"
              >
                <span className="block text-sm font-semibold text-blue-100">
                  {t('nextVerse')}
                </span>
                <span className="mt-1 block text-lg font-bold text-white">
                  {formatKoreanRef(neighbors.next)}
                </span>
              </Link>
            ) : (
              <p className="mt-3 text-slate-400">{t('lastVerse')}</p>
            )}
            <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
              {previousChapterHref && previousChapterReference ? (
                <Link
                  href={previousChapterHref}
                  className="rounded-2xl border border-white/10 bg-white/[0.03] p-3 text-sm text-slate-300 hover:bg-white/10 focus-visible:ring-4 focus-visible:ring-blue-200/60"
                >
                  <span className="block text-xs font-semibold tracking-[0.18em] text-slate-400 uppercase">
                    {t('previousChapterCta')}
                  </span>
                  <span className="mt-1 block font-bold text-white">
                    {previousChapterReference}
                  </span>
                </Link>
              ) : null}
              {nextChapterHref && nextChapterReference ? (
                <Link
                  href={nextChapterHref}
                  className="rounded-2xl border border-blue-300/30 bg-blue-500/15 p-3 text-sm text-blue-100 hover:bg-blue-500/25 focus-visible:ring-4 focus-visible:ring-blue-200/60"
                  data-next-chapter-shortcut
                >
                  <span className="block text-xs font-semibold tracking-[0.18em] text-blue-200 uppercase">
                    {t('nextChapterCta')}
                  </span>
                  <span className="mt-1 block font-bold text-white">
                    {nextChapterReference}
                  </span>
                </Link>
              ) : null}
            </div>
          </div>
          <div
            className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-5"
            data-presenter-chapter-card
          >
            <p className="text-xs tracking-[0.3em] text-blue-300 uppercase">
              {t('chapterJump')}
            </p>
            <div className="mt-4 grid grid-cols-6 gap-2">
              {chapter.verses.map((item) => (
                <Link
                  key={item.ordinal}
                  href={verseHref({
                    book: chapter.book,
                    chapter: chapter.chapter,
                    verse: item.ordinal,
                  })}
                  aria-current={
                    item.ordinal === verse.ordinal ? 'page' : undefined
                  }
                  className={
                    item.ordinal === verse.ordinal
                      ? 'rounded-lg bg-blue-500 px-2 py-1 text-center text-white'
                      : 'rounded-lg bg-white/10 px-2 py-1 text-center text-slate-300 hover:bg-white/20'
                  }
                >
                  {item.ordinal}
                </Link>
              ))}
            </div>
          </div>

          <div
            className="rounded-[2rem] border border-blue-300/20 bg-blue-500/10 p-5 shadow-[0_0_0_1px_rgba(59,130,246,0.08)]"
            data-live-projector-card
          >
            <p className="text-xs font-bold tracking-[0.28em] text-blue-200 uppercase">
              {t('liveProjectorEyebrow')}
            </p>
            <h2 className="mt-2 text-xl font-bold text-white">
              {t('liveProjectorTitle')}
            </h2>
            <p className="mt-3 text-sm leading-6 text-slate-300">
              {t('liveProjectorBody')}
            </p>
            <Link
              href={currentLiveHref}
              target="_blank"
              rel="noreferrer"
              aria-label={t('liveProjectorAria')}
              className="mt-4 inline-flex w-full items-center justify-center rounded-xl bg-blue-700 px-4 py-3 text-sm font-bold text-white shadow-[0_10px_30px_rgba(29,78,216,0.32)] transition hover:bg-blue-600 focus-visible:ring-4 focus-visible:ring-blue-200/70"
            >
              {t('liveProjectorCta')}
              <span className="ml-2 text-blue-100">↗</span>
            </Link>
          </div>

          <div className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-5">
            <p className="text-xs font-bold tracking-[0.28em] text-blue-200 uppercase">
              {t('copyEyebrow')}
            </p>
            <h2 className="mt-2 text-xl font-bold text-white">
              {t('copyTitle')}
            </h2>
            <p className="mt-3 text-sm leading-6 text-slate-300">
              {t('copyBody')}
            </p>
            <div className="mt-4">
              <CopyVerseButton text={verse.text.trim().replace(/\s+/g, ' ')} />
            </div>
          </div>
        </aside>
      </section>
      <SlideController
        current={{
          href: currentHref,
          reference,
          ordinal: verse.ordinal,
          number: verse.number,
          text: verse.text,
        }}
        previousHref={previousHref}
        nextHref={nextHref}
        previousChapterHref={previousChapterHref}
        nextChapterHref={nextChapterHref}
        liveHref={currentLiveHref}
      />
    </main>
  )
}
