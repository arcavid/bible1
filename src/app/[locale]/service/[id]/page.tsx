import { getTranslations, setRequestLocale } from 'next-intl/server'

import { AppChrome } from '@/components/app-chrome'
import { ServicePlaylist } from '@/components/service-playlist.client'

type Params = { locale: string; id: string }

export const dynamic = 'force-dynamic'

export default async function ServicePage({
  params,
}: {
  params: Promise<Params>
}): Promise<React.JSX.Element> {
  const { id, locale } = await params
  setRequestLocale(locale)
  const t = await getTranslations('Service')

  return (
    <main className="bg-presenter-bg min-h-dvh">
      <AppChrome eyebrow={t('eyebrow')} title={t('title', { id })} />
      <ServicePlaylist serviceId={id} />
    </main>
  )
}
