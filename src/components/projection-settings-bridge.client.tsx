'use client'

import { useEffect } from 'react'

import {
  parseProjectionSettings,
  PROJECTION_SETTINGS_CHANGED_EVENT,
  PROJECTION_SETTINGS_KEY,
  type ProjectionSettings,
} from '@/lib/projection-settings'

function applyProjectionSettings(settings: ProjectionSettings): void {
  const root = document.documentElement
  root.dataset['bible1VerseNumbers'] = settings.showVerseNumber
    ? 'show'
    : 'hide'
  root.dataset['bible1Tone'] = settings.warmWhite ? 'warm' : 'white'
  root.dataset['bible1Transition'] = settings.transition
}

function loadProjectionSettings(): ProjectionSettings {
  return parseProjectionSettings(
    window.localStorage.getItem(PROJECTION_SETTINGS_KEY),
  )
}

export function ProjectionSettingsBridge(): null {
  useEffect(() => {
    const sync = () => applyProjectionSettings(loadProjectionSettings())

    sync()

    function onStorage(event: StorageEvent): void {
      if (event.key === null || event.key === PROJECTION_SETTINGS_KEY) sync()
    }

    window.addEventListener('storage', onStorage)
    window.addEventListener(PROJECTION_SETTINGS_CHANGED_EVENT, sync)
    return () => {
      window.removeEventListener('storage', onStorage)
      window.removeEventListener(PROJECTION_SETTINGS_CHANGED_EVENT, sync)
    }
  }, [])

  return null
}
