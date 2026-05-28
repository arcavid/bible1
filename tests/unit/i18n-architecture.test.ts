import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'

import { describe, expect, it } from 'vitest'

const repoRoot = process.cwd()

function file(pathname: string): string {
  return readFileSync(path.join(repoRoot, pathname), 'utf8')
}

function exists(pathname: string): boolean {
  return existsSync(path.join(repoRoot, pathname))
}

describe('Next.js i18n architecture', () => {
  it('uses next-intl as the App Router i18n dependency and plugin', () => {
    const pkg = JSON.parse(file('package.json')) as {
      dependencies?: Record<string, string>
    }
    expect(pkg.dependencies?.['next-intl']).toMatch(/^4\./)

    const config = file('next.config.ts')
    expect(config).toContain('next-intl/plugin')
    expect(config).toContain('createNextIntlPlugin')
    expect(config).toContain('withNextIntl(nextConfig)')
  })

  it('defines URL/proxy-based locale routing for Korean default and English secondary', () => {
    const routing = file('src/i18n/routing.ts')
    expect(routing).toContain('defineRouting')
    expect(routing).toContain("locales: ['ko', 'en']")
    expect(routing).toContain("defaultLocale: 'ko'")
    expect(routing).toContain("localePrefix: 'as-needed'")

    const proxy = file('src/proxy.ts')
    expect(proxy).toContain('next-intl/middleware')
    expect(proxy).toContain('createMiddleware(routing)')
    expect(proxy).toContain('_next')
    expect(proxy).toContain('_vercel')
    expect(proxy).toContain('.*\\\\..*')
  })

  it('loads messages through next-intl request config and locale navigation helpers', () => {
    const request = file('src/i18n/request.ts')
    expect(request).toContain('getRequestConfig')
    expect(request).toContain('requestLocale')
    expect(request).toContain('../../messages/${locale}.json')

    const navigation = file('src/i18n/navigation.ts')
    expect(navigation).toContain('createNavigation')
    expect(navigation).toContain('export const { Link')
    expect(navigation).toContain('useRouter')
    expect(navigation).toContain('usePathname')
  })

  it('moves app UI under a locale root layout with a NextIntl provider', () => {
    const localeLayoutPath = 'src/app/[locale]/layout.tsx'
    expect(exists(localeLayoutPath)).toBe(true)

    const localeLayout = file(localeLayoutPath)
    expect(localeLayout).toContain('NextIntlClientProvider')
    expect(localeLayout).toContain('setRequestLocale(locale)')
    expect(localeLayout).toContain('getMessages()')
    expect(localeLayout).toContain('lang={locale}')

    expect(exists('src/app/[locale]/page.tsx')).toBe(true)
    expect(exists('src/app/[locale]/[book]/[chapter]/page.tsx')).toBe(true)
    expect(exists('src/app/[locale]/[book]/[chapter]/[verse]/page.tsx')).toBe(
      true,
    )
  })

  it('stores Korean-source and English UI copy in message catalogs', () => {
    const ko = JSON.parse(file('messages/ko.json')) as {
      Home?: { title?: string }
      Search?: { label?: string }
      Language?: { label?: string }
    }
    const en = JSON.parse(file('messages/en.json')) as {
      Home?: { title?: string }
      Search?: { label?: string }
      Language?: { label?: string }
    }

    expect(ko.Home?.title).toBe('본문을 바로 찾고,\n예배 화면에 띄우세요.')
    expect(ko.Search?.label).toContain('성경 본문 검색')
    expect(ko.Language?.label).toBe('화면 언어')

    expect(en.Home?.title).toBe('Find the passage,\nand put it on screen.')
    expect(en.Search?.label).toContain('Bible passage search')
    expect(en.Language?.label).toBe('Display language')
  })

  it('removes the ad-hoc client dictionary/localStorage language provider', () => {
    expect(exists('src/components/language-provider.client.tsx')).toBe(false)

    const sourceFiles = [
      'src/components/home-experience.client.tsx',
      'src/components/command-center.client.tsx',
      'src/components/chrome-utility-links.client.tsx',
      'src/components/app-chrome.tsx',
      'src/app/[locale]/layout.tsx',
    ]

    for (const pathname of sourceFiles) {
      const source = file(pathname)
      expect(source).not.toContain('LanguageProvider')
      expect(source).not.toContain('useLanguage')
      expect(source).not.toContain('bible1-locale')
      expect(source).not.toContain('document.documentElement.lang')
    }
  })
})
