'use client'

import { useLocale, useTranslations } from 'next-intl'
import { useTransition } from 'react'

import { usePathname, useRouter } from '@/i18n/navigation'
import { routing, type Locale } from '@/i18n/routing'

export function LanguageSwitch({
  tone = 'dark',
}: {
  tone?: 'dark' | 'light'
}): React.JSX.Element {
  const activeLocale = useLocale() as Locale
  const pathname = usePathname()
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const t = useTranslations('Language')
  const isLight = tone === 'light'
  const shellClass = isLight
    ? 'border-slate-950/10 bg-white/70 text-slate-700'
    : 'border-white/10 bg-white/[0.06] text-slate-300'
  const activeClass = isLight
    ? 'bg-slate-950 text-white'
    : 'bg-white text-slate-950'
  const inactiveClass = isLight
    ? 'text-slate-500 hover:text-slate-950'
    : 'text-slate-400 hover:text-white'

  function selectLocale(nextLocale: Locale): void {
    if (nextLocale === activeLocale) return
    startTransition(() => {
      router.replace(pathname, { locale: nextLocale })
    })
  }

  return (
    <div
      aria-label={t('label')}
      className={`inline-flex rounded-full border p-1 text-xs font-semibold ${shellClass}`}
      data-language-switcher
      role="group"
    >
      {routing.locales.map((locale) => {
        const isActive = locale === activeLocale
        return (
          <button
            key={locale}
            type="button"
            aria-pressed={isActive}
            className={`rounded-full px-2.5 py-1 transition ${isActive ? activeClass : inactiveClass}`}
            disabled={isPending ? !isActive : false}
            onClick={() => selectLocale(locale)}
          >
            {locale === 'ko' ? t('korean') : t('english')}
          </button>
        )
      })}
    </div>
  )
}
