import { setRequestLocale } from 'next-intl/server'
import { notFound } from 'next/navigation'

import { AudienceStage } from '@/components/audience-stage.client'
import { getVerse, loadChapter } from '@/lib/bible/corpus'
import {
  formatKoreanRef,
  parseSegmentedRef,
  verseHref,
} from '@/lib/bible/reference'

type Params = { locale: string; book: string; chapter: string; verse: string }

export const dynamic = 'force-dynamic'
export const dynamicParams = true

export default async function LivePage({
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
  return (
    <AudienceStage
      initial={{
        href: verseHref(ref),
        reference: formatKoreanRef(ref),
        ordinal: verse.ordinal,
        number: verse.number,
        text: verse.text,
        blackout: false,
      }}
    />
  )
}
