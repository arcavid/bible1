'use client'

import { useTranslations } from 'next-intl'

import { Link } from '@/i18n/navigation'

import { LanguageSwitch } from './language-switch.client'

export function ChromeUtilityLinks({
  tone = 'dark',
}: {
  tone?: 'dark' | 'light'
}): React.JSX.Element {
  const t = useTranslations('Navigation')
  const isLight = tone === 'light'
  const navItemClass = isLight
    ? 'rounded-full border border-amber-900/15 px-3 py-2 hover:bg-amber-900/10'
    : 'rounded-full border border-white/10 px-3 py-2 hover:bg-white/10'

  return (
    <>
      <Link className={navItemClass} href="/help">
        {t('help')}
      </Link>
      <Link className={navItemClass} href="/settings">
        {t('settings')}
      </Link>
      <LanguageSwitch tone={tone} />
    </>
  )
}
