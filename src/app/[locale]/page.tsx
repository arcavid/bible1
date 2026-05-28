import { setRequestLocale } from 'next-intl/server'

import { HomeExperience } from '@/components/home-experience.client'

type Params = { locale: string }

export const dynamic = 'force-static'

export default async function HomePage({
  params,
}: {
  params: Promise<Params>
}): Promise<React.JSX.Element> {
  const { locale } = await params
  setRequestLocale(locale)
  return <HomeExperience />
}
