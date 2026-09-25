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

test('the showStreak setting is removed from Settings and the series sheet', () => {
  assert.ok(!settingsSource.includes('Показывать серию'), 'тумблер удалён из Настроек')
  assert.ok(!seriesBadgesSource.includes('Показывать серию'), 'тумблер удалён из шторки серии')
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

test('streak is 0 with no check-ins, 1 after the first check-in of the day, unchanged after redo', async () => {
  const { currentCheckinStreak } = await import('../../src/lib/series.js')

  // До первого чек-ина — 0: огонёк есть, цифры нет.
  assert.equal(currentCheckinStreak([]), 0)

  // Первый чек-ин дня — «1».
  assert.equal(currentCheckinStreak([{ date: dayKey(0), mood: 3, energy: 2 }]), 1)

  // «Пройти заново» не увеличивает число: тот же день, та же запись.
  assert.equal(
    currentCheckinStreak([
      { date: dayKey(0), mood: 4, energy: 3, updated_at: `${dayKey(0)}T09:30:00Z` },
    ]),
    1
  )

  // Redo поверх истории не добавляет новых дней подряд.
  assert.equal(
    currentCheckinStreak([
      { date: dayKey(-1), review_completed_at: `${dayKey(-1)}T20:00:00Z` },
      { date: dayKey(0), mood: 3 },
      { date: dayKey(0), mood: 5, updated_at: `${dayKey(0)}T10:00:00Z` },
    ]),
    2
  )
})

test('preferences source keeps only the badges visibility toggle', () => {
  assert.ok(!preferencesSource.includes("saveSeriesPreference(user?.id, 'showStreak'"))
  assert.match(preferencesSource, /showBadges: parsed\?\.showBadges !== false/)
  assert.match(preferencesSource, /return \{ showBadges: true \}/)
})
