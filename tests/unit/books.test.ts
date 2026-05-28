import { describe, expect, it } from 'vitest'

import {
  BOOKS,
  TOTAL_CHAPTERS,
  getBookByAlias,
  getBookBySlug,
} from '@/lib/bible/books'

describe('book metadata', () => {
  it('contains the 66-book Protestant canon', () => {
    expect(BOOKS).toHaveLength(66)
    expect(TOTAL_CHAPTERS).toBe(1189)
  })

  it('uses corrected Korean spelling for Nehemiah', () => {
    expect(getBookBySlug('Nehemiah')?.korean).toBe('느헤미야')
  })

  it('resolves Korean and English aliases', () => {
    expect(getBookByAlias('시')?.slug).toBe('Psalms')
    expect(getBookByAlias('1cor')?.slug).toBe('1Corinthians')
  })
})
