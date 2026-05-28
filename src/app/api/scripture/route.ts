import { NextResponse } from 'next/server'

import { getVerse, loadChapter } from '@/lib/bible/corpus'
import { isBookSlug } from '@/lib/bible/books'

function parsePositiveInteger(value: string | null): number | null {
  if (!value) return null
  const parsed = Number(value)
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null
}

function normalizeVerseText(text: string): string {
  return text.trim().replace(/\s+/g, ' ')
}

export async function GET(request: Request): Promise<NextResponse> {
  const url = new URL(request.url)
  const book = url.searchParams.get('book')
  const chapter = parsePositiveInteger(url.searchParams.get('chapter'))
  const startVerse = parsePositiveInteger(url.searchParams.get('startVerse'))
  const endVerse = parsePositiveInteger(url.searchParams.get('endVerse'))

  if (!book || !isBookSlug(book) || !chapter) {
    return NextResponse.json(
      { ok: false, reason: 'Invalid Scripture reference' },
      { status: 400 },
    )
  }

  try {
    const loadedChapter = await loadChapter({ book, chapter })
    const selectedVerses = (() => {
      if (!startVerse) return loadedChapter.verses
      const finalVerse = endVerse ?? startVerse
      if (finalVerse < startVerse) return []
      return loadedChapter.verses.filter(
        (verse) => verse.ordinal >= startVerse && verse.ordinal <= finalVerse,
      )
    })()

    if (selectedVerses.length === 0) {
      return NextResponse.json(
        { ok: false, reason: 'Verse range not found' },
        { status: 404 },
      )
    }

    if (startVerse && !getVerse(loadedChapter, startVerse)) {
      return NextResponse.json(
        { ok: false, reason: 'Start verse not found' },
        { status: 404 },
      )
    }

    if (endVerse && !getVerse(loadedChapter, endVerse)) {
      return NextResponse.json(
        { ok: false, reason: 'End verse not found' },
        { status: 404 },
      )
    }

    const text = selectedVerses
      .map((verse) => normalizeVerseText(verse.text))
      .join('\n')

    return NextResponse.json({
      ok: true,
      text,
      verseCount: selectedVerses.length,
    })
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        reason:
          error instanceof Error
            ? error.message
            : 'Unable to load Scripture text',
      },
      { status: 503 },
    )
  }
}
