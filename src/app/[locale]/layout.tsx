import { hasLocale, NextIntlClientProvider } from 'next-intl'
import { getMessages, setRequestLocale } from 'next-intl/server'
import type { Metadata, Viewport } from 'next'
import { notFound } from 'next/navigation'
import { Analytics } from '@vercel/analytics/next'

import { ProjectionSettingsBridge } from '@/components/projection-settings-bridge.client'
import { routing } from '@/i18n/routing'

import '../globals.css'

type LocaleParams = { locale: string }
type MetadataMessages = { Metadata: { title: string; description: string } }
type MetadataMessagesModule = { default: MetadataMessages }

export function generateStaticParams(): LocaleParams[] {
  return routing.locales.map((locale) => ({ locale }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<LocaleParams>
}): Promise<Metadata> {
  const { locale: requestedLocale } = await params
  const locale = hasLocale(routing.locales, requestedLocale)
    ? requestedLocale
    : routing.defaultLocale
  const messagesModule = (await import(
    `../../../messages/${locale}.json`
  )) as unknown as MetadataMessagesModule
  const messages = messagesModule.default

  return {
    metadataBase: new URL('https://bible1.app'),
    title: {
      default: messages.Metadata.title,
      template: '%s — bible1',
    },
    description: messages.Metadata.description,
    applicationName: 'bible1',
    manifest: '/manifest.webmanifest',
  }
}

export const viewport: Viewport = {
  themeColor: '#000000',
  colorScheme: 'dark',
}

export default async function LocaleLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode
  params: Promise<LocaleParams>
}>): Promise<React.JSX.Element> {
  const { locale } = await params
  if (!hasLocale(routing.locales, locale)) notFound()

  setRequestLocale(locale)
  const messages = await getMessages()

  return (
    <html lang={locale}>
      <body>
        <NextIntlClientProvider messages={messages}>
          <ProjectionSettingsBridge />
          {children}
          <Analytics />
        </NextIntlClientProvider>
      </body>
    </html>
  )
}
