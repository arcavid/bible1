'use client'

import { useTranslations } from 'next-intl'
import { useEffect, useState } from 'react'

import {
  DEFAULT_PROJECTION_SETTINGS,
  parseProjectionSettings,
  PROJECTION_SETTINGS_CHANGED_EVENT,
  PROJECTION_SETTINGS_KEY,
  serializeProjectionSettings,
  type ProjectionSettings,
} from '@/lib/projection-settings'

export function SettingsPanel(): React.JSX.Element {
  const t = useTranslations('Settings')
  const [settings, setSettings] = useState<ProjectionSettings>(
    DEFAULT_PROJECTION_SETTINGS,
  )

  useEffect(() => {
    setSettings(
      parseProjectionSettings(
        window.localStorage.getItem(PROJECTION_SETTINGS_KEY),
      ),
    )
  }, [])

  useEffect(() => {
    window.localStorage.setItem(
      PROJECTION_SETTINGS_KEY,
      serializeProjectionSettings(settings),
    )
    window.dispatchEvent(new Event(PROJECTION_SETTINGS_CHANGED_EVENT))
  }, [settings])

  return (
    <section className="mx-auto max-w-3xl px-5 py-10">
      <div className="rounded-[2rem] border border-white/10 bg-black/40 p-6">
        <h2 className="text-2xl font-bold">{t('displayTitle')}</h2>
        <p className="mt-2 text-sm leading-6 text-slate-400">
          {t('description')}
        </p>
        <label className="mt-6 flex items-center justify-between gap-4 border-t border-white/10 pt-5">
          <span>{t('showVerseNumber')}</span>
          <input
            type="checkbox"
            checked={settings.showVerseNumber}
            onChange={(event) =>
              setSettings((value) => ({
                ...value,
                showVerseNumber: event.target.checked,
              }))
            }
          />
        </label>
        <label className="mt-5 flex items-center justify-between gap-4 border-t border-white/10 pt-5">
          <span>{t('warmWhite')}</span>
          <input
            type="checkbox"
            checked={settings.warmWhite}
            onChange={(event) =>
              setSettings((value) => ({
                ...value,
                warmWhite: event.target.checked,
              }))
            }
          />
        </label>
        <label className="mt-5 block border-t border-white/10 pt-5">
          <span className="mb-2 block">{t('transition')}</span>
          <select
            className="rounded-xl bg-white px-3 py-2 text-black"
            value={settings.transition}
            onChange={(event) =>
              setSettings((value) => ({
                ...value,
                transition: event.target
                  .value as ProjectionSettings['transition'],
              }))
            }
          >
            <option value="crossfade">{t('crossfade')}</option>
            <option value="none">{t('none')}</option>
          </select>
        </label>
      </div>
    </section>
  )
}
