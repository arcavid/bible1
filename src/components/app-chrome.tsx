import { getTranslations } from 'next-intl/server'

import { Link } from '@/i18n/navigation'

import { ChromeUtilityLinks } from './chrome-utility-links.client'

type AppChromeTone = 'dark' | 'light'

export async function AppChrome({
  eyebrow,
  title,
  actions,
  tone = 'dark',
}: {
  eyebrow?: string
  title: string
  actions?: React.ReactNode
  tone?: AppChromeTone
}): Promise<React.JSX.Element> {
  const t = await getTranslations('Chrome')
  const isLight = tone === 'light'
  const shellClass = isLight
    ? 'border-amber-900/15 bg-[#f8f5ee]/95 text-slate-950'
    : 'border-white/10 text-white'
  const brandMutedClass = isLight ? 'text-slate-500' : 'text-slate-400'
  const navClass = isLight ? 'text-slate-700' : 'text-slate-300'

  return (
    <header
      className={`grid grid-cols-1 items-center gap-3 border-b px-4 py-4 md:grid-cols-[minmax(0,1fr)_minmax(0,auto)_minmax(0,1fr)] md:px-8 ${shellClass}`}
    >
      <Link
        href="/"
        className="justify-self-start rounded-full px-2 py-1 focus-visible:ring-4 focus-visible:ring-blue-400/70"
        aria-label={t('homeAria')}
      >
        <span>
          <span
            className={`block text-xs tracking-[0.35em] uppercase ${brandMutedClass}`}
          >
            bible1
          </span>
          <span className="block text-sm font-semibold">
            {t('brandSubtitle')}
          </span>
        </span>
      </Link>
      <div className="min-w-0 justify-self-center text-center">
        {eyebrow ? (
          <p className="text-xs tracking-[0.3em] text-blue-400 uppercase">
            {eyebrow}
          </p>
        ) : null}
        <h1 className="truncate text-xl font-bold md:text-2xl">{title}</h1>
      </div>
      <nav
        className={`flex flex-wrap items-center justify-end gap-2 justify-self-end text-sm ${navClass}`}
        aria-label={t('navigationLabel')}
      >
        {actions}
        <ChromeUtilityLinks tone={tone} />
      </nav>
    </header>
  )
}
