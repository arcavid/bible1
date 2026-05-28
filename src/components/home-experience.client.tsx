'use client'

import { useTranslations } from 'next-intl'

import { Link } from '@/i18n/navigation'

import { CommandCenter } from './command-center.client'
import { LanguageSwitch } from './language-switch.client'

export function HomeExperience(): React.JSX.Element {
  const home = useTranslations('Home')
  const nav = useTranslations('Navigation')

  return (
    <main className="grid min-h-dvh grid-rows-[auto_1fr_auto] overflow-x-hidden px-5 py-5 text-white md:px-8">
      <header className="mx-auto flex w-full max-w-5xl flex-wrap items-center justify-between gap-3">
        <Link
          className="text-sm font-semibold tracking-tight text-slate-300 hover:text-white"
          href="/"
        >
          bible1
        </Link>
        <nav className="flex flex-wrap items-center justify-end gap-1 text-sm text-slate-300">
          <Link
            className="rounded-full px-3 py-2 hover:bg-white/10 hover:text-white"
            href="/service/today"
          >
            {nav('service')}
          </Link>
          <Link
            className="rounded-full px-3 py-2 hover:bg-white/10 hover:text-white"
            href="/help"
          >
            {nav('help')}
          </Link>
          <Link
            className="rounded-full px-3 py-2 hover:bg-white/10 hover:text-white"
            href="/settings"
          >
            {nav('settings')}
          </Link>
          <LanguageSwitch />
        </nav>
      </header>

      <section
        className="mx-auto flex w-full max-w-4xl flex-col items-center justify-center py-10"
        data-home-command-shell
      >
        <p className="text-xs font-semibold tracking-[0.38em] text-blue-300 uppercase">
          {home('eyebrow')}
        </p>
        <h1 className="mt-5 max-w-3xl text-center text-4xl leading-[1.05] font-semibold tracking-[-0.08em] whitespace-pre-line text-white md:text-6xl">
          {home('title')}
        </h1>
        <p className="mt-4 max-w-2xl text-center text-base leading-7 text-slate-400 md:text-lg">
          {home('subtitle')}
        </p>
        <div className="mt-10 w-full">
          <CommandCenter />
        </div>
        <p className="mt-5 text-center text-sm text-slate-500">
          {home('prompt')}
        </p>
      </section>

      <footer className="mx-auto w-full max-w-5xl py-3 text-center text-xs text-slate-500">
        {home('privacy')}
      </footer>
    </main>
  )
}
