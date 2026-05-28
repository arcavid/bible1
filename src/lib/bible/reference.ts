import { BOOKS, BOOK_ALIASES, getBookBySlug, type BookSlug } from './books'
import type { BibleRef, SearchResult } from './types'

const CHOSEONG = [
  'ㄱ',
  'ㄲ',
  'ㄴ',
  'ㄷ',
  'ㄸ',
  'ㄹ',
  'ㅁ',
  'ㅂ',
  'ㅃ',
  'ㅅ',
  'ㅆ',
  'ㅇ',
  'ㅈ',
  'ㅉ',
  'ㅊ',
  'ㅋ',
  'ㅌ',
  'ㅍ',
  'ㅎ',
] as const

export function getInitialConsonants(input: string): string {
  return Array.from(input.normalize('NFC'))
    .map((char) => {
      const code = char.charCodeAt(0)
      if (code < 0xac00 || code > 0xd7a3) return char
      const index = Math.floor((code - 0xac00) / 588)
      return CHOSEONG[index] ?? char
    })
    .join('')
}

export function chapterHref(ref: Pick<BibleRef, 'book' | 'chapter'>): string {
  return `/${ref.book}/${ref.chapter}`
}

export function verseHref(ref: Required<BibleRef>): string {
  return `/${ref.book}/${ref.chapter}/${ref.verse}`
}

export function liveHref(ref: Required<BibleRef>): string {
  return `/${ref.book}/${ref.chapter}/${ref.verse}/live`
}

export function readHref(ref: Pick<BibleRef, 'book' | 'chapter'>): string {
  return `/read/${ref.book}/${ref.chapter}`
}

export function formatKoreanRef(ref: BibleRef): string {
  const book = getBookBySlug(ref.book)
  const name = book?.korean ?? ref.book
  if (ref.verse === undefined) return `${name} ${ref.chapter}장`
  return `${name} ${ref.chapter}장 ${ref.verse}절`
}

export function parseReference(input: string): BibleRef | null {
  const compact = input
    .normalize('NFC')
    .trim()
    .replace(/\s+/g, '')
    .replace(/[：]/g, ':')
    .replace(/[.]/g, ':')

  if (compact.length === 0) return null

  const lowered = compact.toLowerCase()
  const matched = BOOK_ALIASES.find(({ normalized }) =>
    lowered.startsWith(normalized),
  )
  if (!matched) return null

  const restRaw = compact.slice(matched.alias.length)
  const rest = restRaw
    .replace(/[장편]/g, ':')
    .replace(/절/g, '')
    .replace(/:+/g, ':')
    .replace(/:$/g, '')

  const refMatch = /^(\d{1,3})(?::(\d{1,3}))?(?:-(\d{1,3}))?$/.exec(rest)
  if (!refMatch) return null

  const chapter = Number(refMatch[1])
  const verse = refMatch[2] === undefined ? undefined : Number(refMatch[2])
  if (
    !Number.isInteger(chapter) ||
    chapter < 1 ||
    chapter > matched.book.chapters
  ) {
    return null
  }
  if (verse !== undefined && (!Number.isInteger(verse) || verse < 1)) {
    return null
  }

  return verse === undefined
    ? { book: matched.book.slug, chapter }
    : { book: matched.book.slug, chapter, verse }
}

export function parseSegmentedRef(
  book: string,
  chapter: string,
  verse?: string,
): BibleRef | null {
  const found = getBookBySlug(book)
  if (!found) return null
  const chapterNumber = Number(chapter)
  if (
    !Number.isInteger(chapterNumber) ||
    chapterNumber < 1 ||
    chapterNumber > found.chapters
  ) {
    return null
  }
  if (verse === undefined) return { book: found.slug, chapter: chapterNumber }
  const verseNumber = Number(verse)
  if (!Number.isInteger(verseNumber) || verseNumber < 1) return null
  return { book: found.slug, chapter: chapterNumber, verse: verseNumber }
}

export function searchChapters(query: string, limit = 24): SearchResult[] {
  const parsed = parseReference(query)
  if (parsed) {
    const book = getBookBySlug(parsed.book)
    if (!book) return []
    return [
      {
        key: `${parsed.book}-${parsed.chapter}-${parsed.verse ?? 'chapter'}`,
        href:
          parsed.verse === undefined
            ? chapterHref(parsed)
            : verseHref(parsed as Required<BibleRef>),
        label: formatKoreanRef(parsed),
        detail:
          parsed.verse === undefined
            ? `${parsed.book} ${parsed.chapter}`
            : `${parsed.book} ${parsed.chapter}:${parsed.verse}`,
        book: parsed.book,
        chapter: parsed.chapter,
        ...(parsed.verse === undefined ? {} : { verse: parsed.verse }),
      },
    ]
  }

  const normalized = query
    .normalize('NFC')
    .trim()
    .replace(/\s+/g, '')
    .toLowerCase()
  if (normalized.length === 0) return popularChapters(limit)

  const initialChapterMatch = /^([ㄱ-ㅎ]+)(\d{1,3})$/.exec(normalized)
  if (initialChapterMatch) {
    const initials = initialChapterMatch[1]
    const chapter = Number(initialChapterMatch[2])
    const book = BOOKS.find(
      (candidate) => getInitialConsonants(candidate.korean) === initials,
    )
    if (
      book &&
      Number.isInteger(chapter) &&
      chapter >= 1 &&
      chapter <= book.chapters
    ) {
      return [
        {
          key: `${book.slug}-${chapter}`,
          href: chapterHref({ book: book.slug, chapter }),
          label: `${book.korean} ${chapter}장`,
          detail: `${book.slug} ${chapter} · ${book.abbreviation}`,
          book: book.slug,
          chapter,
        },
      ]
    }
  }

  const initialQuery = getInitialConsonants(normalized)

  const matchedBooks = BOOKS.filter((book) => {
    const haystacks = [
      book.slug.toLowerCase(),
      book.korean,
      book.abbreviation,
      getInitialConsonants(book.korean),
      ...book.aliases.map((alias) => alias.toLowerCase()),
      ...book.aliases.map(getInitialConsonants),
    ]
    return haystacks.some(
      (value) => value.includes(normalized) || value.includes(initialQuery),
    )
  })

  return matchedBooks
    .flatMap((book) => {
      const maxChapters = Math.min(
        book.chapters,
        Math.ceil(limit / Math.max(1, matchedBooks.length)),
      )
      return Array.from({ length: maxChapters }, (_, index) => {
        const chapter = index + 1
        return {
          key: `${book.slug}-${chapter}`,
          href: chapterHref({ book: book.slug, chapter }),
          label: `${book.korean} ${chapter}장`,
          detail: `${book.slug} ${chapter} · ${book.abbreviation}`,
          book: book.slug,
          chapter,
        }
      })
    })
    .slice(0, limit)
}

function popularChapters(limit: number): SearchResult[] {
  const defaults: Array<Pick<BibleRef, 'book' | 'chapter'>> = [
    { book: 'Psalms', chapter: 23 },
    { book: 'John', chapter: 3 },
    { book: 'Romans', chapter: 8 },
    { book: 'Genesis', chapter: 1 },
    { book: 'Matthew', chapter: 5 },
    { book: 'Revelation', chapter: 22 },
  ]
  return defaults.slice(0, limit).map((ref) => ({
    key: `${ref.book}-${ref.chapter}`,
    href: chapterHref(ref),
    label: formatKoreanRef(ref),
    detail: `${ref.book} ${ref.chapter}`,
    book: ref.book,
    chapter: ref.chapter,
  }))
}

export function isBookSlugForClient(value: string): value is BookSlug {
  return BOOKS.some((book) => book.slug === value)
}
