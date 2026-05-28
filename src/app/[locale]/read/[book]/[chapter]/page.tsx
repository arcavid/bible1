import { getTranslations, setRequestLocale } from 'next-intl/server'
import { notFound } from 'next/navigation'

import { AppChrome } from '@/components/app-chrome'
import { loadChapter } from '@/lib/bible/corpus'
import { parseSegmentedRef } from '@/lib/bible/reference'

type Params = { locale: string; book: string; chapter: string }
export const dynamic = 'force-dynamic'
export const dynamicParams = true

export default async function ReadPage({
  params,
}: {
  params: Promise<Params>
}): Promise<React.JSX.Element> {
  const resolved = await params
  setRequestLocale(resolved.locale)
  const ref = parseSegmentedRef(resolved.book, resolved.chapter)
  if (!ref) notFound()
  const chapter = await loadChapter(ref)
  const t = await getTranslations('Chapter')

  return (
    <main className="min-h-dvh bg-[#f8f5ee] text-slate-950">
      <AppChrome
        eyebrow={t('readingEyebrow')}
        title={`${chapter.korean} ${chapter.chapter}장`}
        tone="light"
      />
      <article className="mx-auto my-8 max-w-3xl rounded-[2rem] border border-amber-900/10 bg-white/75 px-6 py-8 text-xl leading-9 shadow-xl shadow-amber-950/5 md:px-10 md:py-12 md:text-2xl md:leading-10">
        {chapter.verses.map((verse) => (
          <p key={verse.ordinal} className="mb-5 break-keep last:mb-0">
            <sup className="mr-2 font-mono text-sm text-amber-700">
              {verse.number}
            </sup>
            {verse.text}
          </p>
        ))}
      </article>
    </main>
  )
}
