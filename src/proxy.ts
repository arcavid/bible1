import createMiddleware from 'next-intl/middleware'
import { NextResponse, type NextRequest } from 'next/server'

import { routing } from './i18n/routing'
import { BOOKS } from './lib/bible/books'

const intlMiddleware = createMiddleware(routing)
const legacyBookSlugs = [...BOOKS]
  .map((book) => ({ slug: book.slug, chapters: book.chapters }))
  .sort((a, b) => b.slug.length - a.slug.length)

function hasLocalePrefix(pathname: string): boolean {
  return routing.locales.some(
    (locale) => pathname === `/${locale}` || pathname.startsWith(`/${locale}/`),
  )
}

function legacyBibleUrl(request: NextRequest): URL | null {
  const { pathname, searchParams } = request.nextUrl
  const match = /^\/(?:(en|ko)\/)?([^/]+)$/.exec(pathname)
  if (!match) return null

  const locale = match[1]
  const legacySegment = match[2]
  if (!legacySegment) return null
  const matchedBook = legacyBookSlugs.find((book) => {
    const chapterText = legacySegment.slice(book.slug.length)
    if (
      !legacySegment.startsWith(book.slug) ||
      !/^\d{1,3}$/.test(chapterText)
    ) {
      return false
    }
    const chapter = Number(chapterText)
    return Number.isInteger(chapter) && chapter >= 1 && chapter <= book.chapters
  })
  if (!matchedBook) return null

  const chapter = legacySegment.slice(matchedBook.slug.length)
  const verse = searchParams.get('v')
  const versePath = verse && /^\d{1,3}$/.test(verse) ? `/${verse}` : ''
  const localePrefix = locale === 'en' ? '/en' : ''
  const url = request.nextUrl.clone()
  url.pathname = `${localePrefix}/${matchedBook.slug}/${chapter}${versePath}`
  url.search = ''
  return url
}

export default function proxy(request: NextRequest): NextResponse {
  const { pathname } = request.nextUrl
  const canonicalLegacyUrl = legacyBibleUrl(request)
  if (canonicalLegacyUrl) return NextResponse.redirect(canonicalLegacyUrl)

  if (!hasLocalePrefix(pathname)) {
    const url = request.nextUrl.clone()
    url.pathname = pathname === '/' ? '/ko' : `/ko${pathname}`
    const response = NextResponse.rewrite(url)
    response.cookies.set('NEXT_LOCALE', routing.defaultLocale, {
      path: '/',
      sameSite: 'lax',
    })
    return response
  }

  if (pathname === '/ko' || pathname.startsWith('/ko/')) {
    const response = NextResponse.next()
    response.cookies.set('NEXT_LOCALE', routing.defaultLocale, {
      path: '/',
      sameSite: 'lax',
    })
    return response
  }

  return intlMiddleware(request)
}

export const config = {
  matcher: '/((?!api|trpc|_next|_vercel|.*\\..*).*)',
}
