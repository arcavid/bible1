import type { BookSlug } from './books'

export type ChapterNumber = number
export type VerseOrdinal = number
export type VerseNumber = number

export type BibleRef = {
  book: BookSlug
  chapter: ChapterNumber
  verse?: VerseOrdinal
}

export type Verse = {
  ordinal: VerseOrdinal
  number: VerseNumber
  text: string
}

export type Chapter = {
  book: BookSlug
  korean: string
  chapter: ChapterNumber
  verses: Verse[]
}

export type ChapterManifestEntry = {
  number: ChapterNumber
  verseCount: number
  hash: string
  anomalies?: string[]
}

export type BookManifestEntry = {
  slug: BookSlug
  korean: string
  abbreviation: string
  order: number
  chapters: ChapterManifestEntry[]
}

export type CorpusManifest = {
  schemaVersion: 1
  encoding: 'cp949-source-to-utf8-nfc'
  totalBooks: number
  totalChapters: number
  totalVerses: number
  anomalyCount: number
  books: BookManifestEntry[]
}

export type SearchResult = {
  key: string
  href: string
  label: string
  detail: string
  book: BookSlug
  chapter: ChapterNumber
  verse?: VerseOrdinal
}
