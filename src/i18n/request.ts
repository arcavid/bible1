import { hasLocale } from 'next-intl'
import { getRequestConfig } from 'next-intl/server'

import { routing } from './routing'

type MessagesModule = { default: Record<string, unknown> }

export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale
  const locale = hasLocale(routing.locales, requested)
    ? requested
    : routing.defaultLocale

  const messagesModule = (await import(
    `../../messages/${locale}.json`
  )) as unknown as MessagesModule

  return {
    locale,
    messages: messagesModule.default,
  }
})
