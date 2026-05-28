export type ProjectionSettings = {
  showVerseNumber: boolean
  warmWhite: boolean
  transition: 'none' | 'crossfade'
}

export const PROJECTION_SETTINGS_KEY = 'bible1:settings'

export const PROJECTION_SETTINGS_CHANGED_EVENT = 'bible1:settings-changed'

export const DEFAULT_PROJECTION_SETTINGS: ProjectionSettings = {
  showVerseNumber: true,
  warmWhite: false,
  transition: 'crossfade',
}

const TRANSITIONS: ProjectionSettings['transition'][] = ['none', 'crossfade']

export function parseProjectionSettings(
  raw: string | null,
): ProjectionSettings {
  if (!raw) return DEFAULT_PROJECTION_SETTINGS

  try {
    const parsed = JSON.parse(raw) as unknown
    return normalizeProjectionSettings(parsed)
  } catch {
    return DEFAULT_PROJECTION_SETTINGS
  }
}

export function normalizeProjectionSettings(
  value: unknown,
): ProjectionSettings {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return DEFAULT_PROJECTION_SETTINGS
  }

  const candidate = value as Partial<Record<keyof ProjectionSettings, unknown>>
  return {
    showVerseNumber:
      typeof candidate.showVerseNumber === 'boolean'
        ? candidate.showVerseNumber
        : DEFAULT_PROJECTION_SETTINGS.showVerseNumber,
    warmWhite:
      typeof candidate.warmWhite === 'boolean'
        ? candidate.warmWhite
        : DEFAULT_PROJECTION_SETTINGS.warmWhite,
    transition: TRANSITIONS.includes(
      candidate.transition as ProjectionSettings['transition'],
    )
      ? (candidate.transition as ProjectionSettings['transition'])
      : DEFAULT_PROJECTION_SETTINGS.transition,
  }
}

export function serializeProjectionSettings(
  settings: ProjectionSettings,
): string {
  return JSON.stringify(settings)
}
