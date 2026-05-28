import { getTranslations } from 'next-intl/server'

import { Link } from '@/i18n/navigation'

export default async function NotFound(): Promise<React.JSX.Element> {
  const t = await getTranslations('NotFound')

  return (
    <main className="grid min-h-dvh place-items-center bg-black p-6 text-center text-white">
      <div>
        <p className="text-sm tracking-[0.4em] text-blue-300 uppercase">404</p>
        <h1 className="mt-3 text-4xl font-black">{t('title')}</h1>
        <p className="mt-4 text-slate-400">{t('description')}</p>
        <Link
          className="mt-8 inline-flex rounded-full bg-white px-5 py-3 font-semibold text-black"
          href="/"
        >
          {t('returnHome')}
        </Link>
      </div>
    </main>
  )
}
