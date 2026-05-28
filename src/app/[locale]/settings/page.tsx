import { getTranslations, setRequestLocale } from 'next-intl/server'

import { AppChrome } from '@/components/app-chrome'
import { SettingsPanel } from '@/components/settings-panel.client'

type Params = { locale: string }

export const dynamic = 'force-static'

export default async function SettingsPage({
  params,
}: {
  params: Promise<Params>
}): Promise<React.JSX.Element> {
  const { locale } = await params
  setRequestLocale(locale)
  const t = await getTranslations('Settings')

  return (
    <main className="bg-presenter-bg min-h-dvh">
      <AppChrome eyebrow={t('eyebrow')} title={t('title')} />
      <SettingsPanel />
    </main>
  )
}
