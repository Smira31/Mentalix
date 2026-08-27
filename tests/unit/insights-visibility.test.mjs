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
  assert.match(normalizedAnalytics, /Персональные описательные наблюдения скрыты\. Твои сохранённые данные и обычные цифры ниже не удалены\./)
  assert.match(analytics, /\{insightsEnabled \? \(/)
})

test('Analytics reads a persisted preference and falls back to shown observations on error', () => {
  assert.match(analytics, /api\.profile\s*\.getSettings\(user\.id\)/)
  assert.match(analytics, /settings\?\.insights_enabled !== false/)
  assert.match(normalizedAnalytics, /Наблюдения показаны по умолчанию\./)
})

test('visibility setting remains separate from AI consent and diagnostic claims', () => {
  assert.doesNotMatch(settings, /ai_context_enabled: nextEnabled/)
  assert.match(normalizedSettings, /не являются диагнозом/)
  assert.match(normalizedAnalytics, /не диагнозы и не доказанные причины/)
})
