import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const settings = await readFile(
  new URL('../../src/screens/Settings.jsx', import.meta.url),
  'utf8'
)
const analytics = await readFile(
  new URL('../../src/screens/Analytics.jsx', import.meta.url),
  'utf8'
)

const normalizedSettings = settings.replace(/\s+/g, ' ')
const normalizedAnalytics = analytics.replace(/\s+/g, ' ')

test('Settings persists descriptive Insights visibility with owner settings contract', () => {
  assert.match(settings, /setInsightsEnabled\(s\?\.insights_enabled !== false\)/)
  assert.match(settings, /api\.profile\.saveSettings\(user\.id, \{ insights_enabled: nextEnabled \}\)/)
  assert.match(settings, /title="Показывать описательные наблюдения"/)
  assert.match(settings, /role="switch"/)
})

test('opt-out explains that deterministic observations are hidden without deleting data', () => {
  assert.match(normalizedSettings, /Описательные наблюдения скрыты\. Сохранённые данные и обычные цифры не удалены\./)
  // Новый дизайн: скрытие карточек сохраняет данные (кнопка «Скрыть график»)
  assert.match(normalizedAnalytics, /Скрыть график/)
  assert.match(analytics, /readCardPreferences/)
})

test('Analytics reads a persisted preference and falls back to shown cards on error', () => {
  // Новый дизайн: настройки карточек читаются из localStorage через readCardPreferences
  assert.match(analytics, /readCardPreferences/)
  assert.match(analytics, /useState\(readCardPreferences\)/)
  // По умолчанию все карточки видимы (не в hidden)
  assert.match(normalizedAnalytics, /!cardPreferences\.hidden\.includes/)
})

test('visibility setting remains separate from AI consent and diagnostic claims', () => {
  assert.doesNotMatch(settings, /ai_context_enabled: nextEnabled/)
  assert.match(normalizedSettings, /не являются диагнозом/)
  assert.match(normalizedAnalytics, /api\.analytics\s*\.influences/)
})
