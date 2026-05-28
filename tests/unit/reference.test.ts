import { describe, expect, it } from 'vitest'

import {
  getInitialConsonants,
  parseReference,
  searchChapters,
} from '@/lib/bible/reference'

describe('reference parsing', () => {
  it.each([
    ['시23', { book: 'Psalms', chapter: 23 }],
    ['시편 23편 5절', { book: 'Psalms', chapter: 23, verse: 5 }],
    ['요 3:16', { book: 'John', chapter: 3, verse: 16 }],
    ['Psalms23.5', { book: 'Psalms', chapter: 23, verse: 5 }],
    ['Ps 23:5', { book: 'Psalms', chapter: 23, verse: 5 }],
    ['고전13', { book: '1Corinthians', chapter: 13 }],
    ['삼상 17', { book: '1Samuel', chapter: 17 }],
  ])('parses %s', (input, expected) => {
    expect(parseReference(input)).toEqual(expected)
  })

  it('rejects impossible chapter references', () => {
    expect(parseReference('시151')).toBeNull()
    expect(parseReference('NotABook1')).toBeNull()
  })

  it('extracts Hangul initial consonants', () => {
    expect(getInitialConsonants('창세기')).toBe('ㅊㅅㄱ')
    expect(getInitialConsonants('요한복음')).toBe('ㅇㅎㅂㅇ')
  })

  it('searches by initial consonants', () => {
    const first = searchChapters('ㅊㅅㄱ 1')[0]
    expect(first?.href).toBe('/Genesis/1')
  })
})
