import { getTranslations, setRequestLocale } from 'next-intl/server'

import { AppChrome } from '@/components/app-chrome'

type Params = { locale: string }
type Shortcut = readonly [string, string]

export const dynamic = 'force-static'

export default async function HelpPage({
  params,
}: {
  params: Promise<Params>
}): Promise<React.JSX.Element> {
  const { locale } = await params
  setRequestLocale(locale)
  const t = await getTranslations('Help')
  const shortcuts = t.raw('shortcuts') as Shortcut[]
  const serviceSteps = t.raw('serviceSteps') as string[]

  return (
    <main className="bg-presenter-bg min-h-dvh">
      <AppChrome eyebrow={t('eyebrow')} title={t('title')} />
      <section className="mx-auto grid max-w-6xl gap-6 px-5 py-10 lg:grid-cols-[minmax(0,1.1fr)_minmax(22rem,0.9fr)]">
        <div className="space-y-6">
          <GuideCard>
            <p className="text-xs font-bold tracking-[0.32em] text-blue-300 uppercase">
              {t('startEyebrow')}
            </p>
            <h2 className="mt-2 text-3xl font-black text-white">
              {t('serviceTitle')}
            </h2>
            <ol className="mt-5 space-y-4 text-base leading-7 text-slate-300">
              {serviceSteps.map((step, index) => (
                <li key={step} className="flex gap-3">
                  <span className="mt-1 grid size-6 shrink-0 place-items-center rounded-full bg-blue-500 text-xs font-black text-white">
                    {index + 1}
                  </span>
                  <span>{step}</span>
                </li>
              ))}
            </ol>
          </GuideCard>

          <GuideCard tone="blue">
            <p className="text-xs font-bold tracking-[0.32em] text-blue-100 uppercase">
              {t('importantEyebrow')}
            </p>
            <h2 className="mt-2 text-3xl font-black text-white">
              {t('liveTitle')}
            </h2>
            <p className="mt-4 text-lg leading-8 text-blue-50">
              {t('liveBody')}
            </p>
            <p className="mt-4 text-sm leading-6 text-blue-100/85">
              {t('liveNote')}
            </p>
          </GuideCard>
        </div>

        <div className="space-y-6">
          <GuideCard>
            <h2 className="text-2xl font-bold text-white">
              {t('keyboardTitle')}
            </h2>
            <dl className="mt-6 grid gap-3 md:grid-cols-[12rem_1fr]">
              {shortcuts.map(([key, value]) => (
                <div key={key} className="contents">
                  <dt className="rounded-xl bg-white/10 px-3 py-2 font-mono text-blue-100">
                    {key}
                  </dt>
                  <dd className="px-3 py-2 text-slate-300">{value}</dd>
                </div>
              ))}
            </dl>
          </GuideCard>

          <GuideCard>
            <h2 className="text-2xl font-bold text-white">{t('opsTitle')}</h2>
            <ul className="mt-4 space-y-3 text-sm leading-6 text-slate-300">
              <li>{t('publicCorpusNote')}</li>
              <li>{t('legacyNote')}</li>
              <li>{t('syncNote')}</li>
            </ul>
          </GuideCard>
        </div>
      </section>
    </main>
  )
}

function GuideCard({
  children,
  tone = 'dark',
}: {
  children: React.ReactNode
  tone?: 'dark' | 'blue'
}): React.JSX.Element {
  const className =
    tone === 'blue'
      ? 'rounded-[2rem] border border-blue-200/25 bg-blue-500/20 p-6 shadow-2xl shadow-blue-950/30'
      : 'rounded-[2rem] border border-white/10 bg-black/40 p-6'

  return <div className={className}>{children}</div>
}
