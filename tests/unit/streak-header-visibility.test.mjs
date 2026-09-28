import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

/** Локальный YYYY-MM-DD относительно сегодняшнего дня. */
function dayKey(offset = 0) {
  const d = new Date()
  d.setDate(d.getDate() + offset)
  const pad = v => String(v).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

const todaySource = await readFile(new URL('../../src/screens/Today.jsx', import.meta.url), 'utf8')
const settingsSource = await readFile(new URL('../../src/screens/Settings.jsx', import.meta.url), 'utf8')
const seriesBadgesSource = await readFile(
  new URL('../../src/screens/SeriesBadges.jsx', import.meta.url),
  'utf8'
)
const preferencesSource = await readFile(
  new URL('../../src/lib/seriesPreferences.js', import.meta.url),
  'utf8'
)

/*
 * Решение владельца от 24.09.2026: огонёк серии в шапке «Сегодня» виден
 * всегда, настройки «Показывать серию» больше нет.
 *
 * - при серии 0 огонёк отрисован, цифры нет;
 * - при серии ≥ 1 рядом с огоньком число;
 * - после первого чек-ина дня — «1», после «Пройти заново» число
 *   не меняется.
 */
test('streak flame is always rendered in the Today header', () => {
  assert.match(todaySource, /function TodayWorkspaceHeader\(/)
  assert.ok(!todaySource.includes('showStreak'), 'условие showStreak удалено из шапки')
  assert.ok(
    !todaySource.includes('mx-demo-today-streak-spacer'),
    'заглушка-спейсер вместо огонька удалена'
  )

  // Огонёк рисуется безусловно, цифра — только при серии ≥ 1.
  assert.match(todaySource, /<ReferenceFlame \/>/)
  assert.match(todaySource, /\{streak > 0 && <strong>\{streak\}<\/strong>\}/)

  // Шапка остаётся на экране и во время загрузки дня — с актуальным streak.
  const headerCalls = todaySource.match(/<TodayWorkspaceHeader[\s\S]*?\/>/g) || []
  assert.ok(headerCalls.length >= 3, 'шапка рендерится во всех состояниях Today')
  for (const call of headerCalls) {
    assert.match(call, /streak=\{streak\}/, 'каждая шапка получает актуальную серию')
  }
})

test('the showStreak setting is removed from Settings and the series page', () => {
  assert.ok(!settingsSource.includes('Показывать серию'), 'тумблер удалён из Настроек')
  assert.ok(!seriesBadgesSource.includes('Показывать серию'), 'тумблер удалён со страницы серии')
  assert.ok(!settingsSource.includes('showStreak'), 'в Настройках нет showStreak')
})

test('seriesPreferences ignores and strips the legacy showStreak value', async () => {
  const storage = new Map()
  globalThis.localStorage = {
    getItem: key => (storage.has(key) ? storage.get(key) : null),
    setItem: (key, value) => storage.set(key, String(value)),
    removeItem: key => storage.delete(key),
  }

  storage.set('mx-series-preferences:7', '{"showStreak":false,"showBadges":true}')

  const { getSeriesPreferences, saveSeriesPreference } = await import(
    '../../src/lib/seriesPreferences.js'
  )

  const preferences = getSeriesPreferences(7)
  assert.equal(preferences.showBadges, true)
  assert.equal('showStreak' in preferences, false, 'showStreak не возвращается вовсе')

  const stored = JSON.parse(storage.get('mx-series-preferences:7'))
  assert.equal('showStreak' in stored, false, 'старое поле удаляется при чтении')

  const next = saveSeriesPreference(7, 'showBadges', false)
  assert.equal(next.showBadges, false)
  assert.equal('showStreak' in next, false)

  delete globalThis.localStorage
})

test('число огонька приходит с сервера: 0 — без цифры, 1 — после первого чек-ина', async () => {
  const { readCanonicalCurrentStreak } = await import('../../src/lib/canonicalStreak.js')

  // Серверная серия 0 — валидное значение: огонёк отрисован, цифры нет.
  assert.equal(readCanonicalCurrentStreak({ current_streak: 0 }), 0)

  // Первый чек-ин дня — сервер отвечает «1».
  assert.equal(readCanonicalCurrentStreak({ current_streak: 1 }), 1)

  // «Пройти заново» не увеличивает число: сервер считает уникальные дни,
  // клиент не пересчитывает серию из истории.
  assert.equal(readCanonicalCurrentStreak({ current_streak: 1 }), 1)

  // Нет корректных данных — null, не 0: цифра не подменяется расчётом.
  assert.equal(readCanonicalCurrentStreak({}), null)
  assert.equal(readCanonicalCurrentStreak({ current_streak: -1 }), null)
})

test('preferences source keeps only the badges visibility toggle', () => {
  assert.ok(!preferencesSource.includes("saveSeriesPreference(user?.id, 'showStreak'"))
  assert.match(preferencesSource, /showBadges: parsed\?\.showBadges !== false/)
  assert.match(preferencesSource, /return \{ showBadges: true \}/)
})
