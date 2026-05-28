import type { Metadata } from 'next'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { notFound } from 'next/navigation'

import { AppChrome } from '@/components/app-chrome'
import { ChapterGrid } from '@/components/chapter-grid'
import { Link } from '@/i18n/navigation'
import { getBookBySlug } from '@/lib/bible/books'
import { loadChapter } from '@/lib/bible/corpus'
import { chapterHref, parseSegmentedRef, readHref } from '@/lib/bible/reference'

type Params = { locale: string; book: string; chapter: string }
export const dynamic = 'force-dynamic'
export const dynamicParams = true

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>
}): Promise<Metadata> {
  const resolved = await params
  const ref = parseSegmentedRef(resolved.book, resolved.chapter)
  if (!ref) return {}
  const book = getBookBySlug(ref.book)
  const reference = `${book?.korean ?? ref.book} ${ref.chapter}장`
  const t = await getTranslations({
    locale: resolved.locale,
    namespace: 'Chapter',
  })

  return {
    title: reference,
    description: t('metadataDescription', { reference }),
  }
}

export default async function ChapterPage({
  params,
}: {
  params: Promise<Params>
}): Promise<React.JSX.Element> {
  const resolved = await params
  setRequestLocale(resolved.locale)
  const ref = parseSegmentedRef(resolved.book, resolved.chapter)
  if (!ref) notFound()
  const chapter = await loadChapter(ref)
  const book = getBookBySlug(chapter.book)
  if (!book) notFound()
  const t = await getTranslations('Chapter')
  const nav = await getTranslations('Navigation')
  const previousChapter =
    ref.chapter > 1 ? { book: ref.book, chapter: ref.chapter - 1 } : null
  const nextChapter =
    ref.chapter < book.chapters
      ? { book: ref.book, chapter: ref.chapter + 1 }
      : null

  return (
    <main className="bg-presenter-bg min-h-dvh">
      <AppChrome
        eyebrow={t('gridEyebrow')}
        title={`${chapter.korean} ${chapter.chapter}장`}
        actions={
          <>
            <Link
              className="rounded-full border border-white/10 px-3 py-2 hover:bg-white/10"
              href={readHref(ref)}
            >
              {nav('read')}
            </Link>
            <Link
              className="rounded-full border border-white/10 px-3 py-2 hover:bg-white/10"
              href="/service/today"
            >
              {nav('service')}
            </Link>
          </>
        }
      />
      <nav
        className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-5 pt-6 text-sm text-slate-300 md:px-8"
        aria-label={t('navigationLabel')}
      >
        {previousChapter ? (
          <Link
            className="rounded-full border border-white/10 px-4 py-2 hover:bg-white/10"
            href={chapterHref(previousChapter)}
          >
            {t('previous')}
          </Link>
        ) : (
          <span />
        )}
        <p className="rounded-full bg-white/10 px-4 py-2">
          {t('operatorHint')}
        </p>
        {nextChapter ? (
          <Link
            className="rounded-full border border-white/10 px-4 py-2 hover:bg-white/10"
            href={chapterHref(nextChapter)}
          >
            {t('next')}
          </Link>
        ) : (
          <span />
        )}
      </nav>
      <ChapterGrid chapter={chapter} />
    </main>
  )
}
