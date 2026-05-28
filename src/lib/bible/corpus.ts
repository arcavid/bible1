import 'server-only'

import { getServerSupabaseClient } from '@/lib/supabase/server'

import { BOOKS, getBookBySlug, type BookSlug } from './books'
import type { BibleRef, Chapter, CorpusManifest, Verse } from './types'

export const manifest: CorpusManifest = {
  schemaVersion: 1,
  encoding: 'cp949-source-to-utf8-nfc',
  totalBooks: 66,
  totalChapters: BOOKS.reduce((total, book) => total + book.chapters, 0),
  totalVerses: 0,
  anomalyCount: 0,
  books: BOOKS.map((book) => ({
    slug: book.slug,
    korean: book.korean,
    abbreviation: book.abbreviation,
    order: book.order,
    chapters: Array.from({ length: book.chapters }, (_, index) => ({
      number: index + 1,
      verseCount: 0,
      hash: 'external-corpus-not-in-public-repository',
    })),
  })),
}

export function getAllChapterRefs(): Array<Pick<BibleRef, 'book' | 'chapter'>> {
  return BOOKS.flatMap((book) =>
    Array.from({ length: book.chapters }, (_, index) => ({
      book: book.slug,
      chapter: index + 1,
    })),
  )
}

export function getAllVerseRefs(): Array<Required<BibleRef>> {
  return []
}

export function getChapterVerseCount(
  book: BookSlug,
  chapter: number,
): number | undefined {
  void book
  void chapter
  return undefined
}

type BibleVerseRow = {
  ordinal: number
  verse_number: number
  text: string
}

export async function loadChapter(
  ref: Pick<BibleRef, 'book' | 'chapter'>,
): Promise<Chapter> {
  const book = getBookBySlug(ref.book)
  if (!book) throw new Error(`Unknown Bible book: ${ref.book}`)

  const supabase = getServerSupabaseClient()
  if (!supabase) {
    throw new Error(
      'Bible corpus is not configured. This public repository is code-only; configure Supabase with an authorized corpus before opening Scripture routes.',
    )
  }

  const bookResult = await supabase
    .from('bible_books')
    .select('id,korean_name')
    .eq('slug', ref.book)
    .limit(1)
    .maybeSingle()

  if (bookResult.error) throw new Error(bookResult.error.message)
  const bookRow = bookResult.data
  if (!bookRow)
    throw new Error(`Bible book not found in corpus DB: ${ref.book}`)

  const versesResult = await supabase
    .from('bible_verses')
    .select('ordinal,verse_number,text')
    .eq('book_id', bookRow.id)
    .eq('chapter_number', ref.chapter)
    .order('ordinal', { ascending: true })

  if (versesResult.error) throw new Error(versesResult.error.message)
  const rows = (versesResult.data ?? []) as BibleVerseRow[]
  if (rows.length === 0) {
    throw new Error(
      `Bible chapter not found in corpus DB: ${ref.book} ${ref.chapter}`,
    )
  }

  const verses: Verse[] = rows.map((row) => ({
    ordinal: row.ordinal,
    number: row.verse_number,
    text: row.text,
  }))

  return {
    book: ref.book,
    korean: bookRow.korean_name ?? book.korean,
    chapter: ref.chapter,
    verses,
  }
}

export function getVerse(chapter: Chapter, ordinal: number): Verse | undefined {
  return chapter.verses.find((verse) => verse.ordinal === ordinal)
}

export function getNeighborRefs(
  ref: Required<BibleRef>,
  currentChapterVerseCount?: number,
): {
  previous: Required<BibleRef> | null
  next: Required<BibleRef> | null
} {
  const book = getBookBySlug(ref.book)
  if (!book) return { previous: null, next: null }

  const previous = (() => {
    if (ref.verse > 1) return { ...ref, verse: ref.verse - 1 }
    if (ref.chapter > 1)
      return { book: ref.book, chapter: ref.chapter - 1, verse: 1 }
    const previousBook = BOOKS.find((entry) => entry.order === book.order - 1)
    return previousBook
      ? { book: previousBook.slug, chapter: previousBook.chapters, verse: 1 }
      : null
  })()

  const next = (() => {
    if (currentChapterVerseCount && ref.verse < currentChapterVerseCount) {
      return { ...ref, verse: ref.verse + 1 }
    }
    if (ref.chapter < book.chapters)
      return { book: ref.book, chapter: ref.chapter + 1, verse: 1 }
    const nextBook = BOOKS.find((entry) => entry.order === book.order + 1)
    return nextBook ? { book: nextBook.slug, chapter: 1, verse: 1 } : null
  })()

  return { previous, next }
}
