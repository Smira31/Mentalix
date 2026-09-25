import { isPreviewDemoMode } from './demoMode.js'

const KEY = 'mentalix:demo-clock:v1'
export const CLOCK_PRESETS = ['07:00', '12:00', '19:30', '01:00']

export function readDemoClock() {
  try {
    const value = JSON.parse(sessionStorage.getItem(KEY) || '{}')
    return {
      preset: CLOCK_PRESETS.includes(value.preset) ? value.preset : null,
      days: Number.isInteger(value.days) && Math.abs(value.days) < 366 ? value.days : 0,
    }
  } catch {
    return { preset: null, days: 0 }
  }
}

export function setDemoClock(preset, days = 0) {
  if (!CLOCK_PRESETS.includes(preset) && preset !== null) return
  sessionStorage.setItem(KEY, JSON.stringify({ preset, days }))
  sessionStorage.removeItem('mentalix:today:snapshot:v1:900001')
}

export function now(real = new Date(), demoEnabled = typeof window !== 'undefined' && isPreviewDemoMode()) {
  if (!demoEnabled || (typeof window !== 'undefined' && (window.__MX_TG_SHELL || window.Telegram?.WebApp?.initData))) return real
  const { preset, days } = readDemoClock()
  if (!preset && !days) return real
  const result = new Date(real)
  result.setDate(result.getDate() + days)
  if (preset) {
    const [hour, minute] = preset.split(':').map(Number)
    result.setHours(hour, minute, 0, 0)
  }
  return result
}
