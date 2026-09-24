import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const todaySource = await readFile(new URL('../../src/screens/Today.jsx', import.meta.url), 'utf8')
const checkinSource = await readFile(new URL('../../src/screens/CheckIn.jsx', import.meta.url), 'utf8')
const preferencesSource = await readFile(
  new URL('../../src/lib/seriesPreferences.js', import.meta.url),
  'utf8'
)

/*
 * Огонёк серии живёт в шапке «Сегодня». Он обязан быть виден при серии ≥ 1
 * независимо от локального снапшота: отсутствующие или битые настройки
 * localStorage не должны прятать серию по умолчанию.
 */
test('streak flame is visible in the Today header at series ≥ 1', () => {
  // После завершённого чек-ина серия считается от 1, а не от 0.
  assert.ok(
    (checkinSource.match(/Math\.max\(1, currentCheckinStreak\(/g) || []).length >= 2,
    'утренний и вечерний флоу считают серию от 1'
  )

  // Шапка рисует огонёк, пока настройка не выключена явно.
  assert.match(todaySource, /function TodayWorkspaceHeader\(/)
  assert.match(todaySource, /\{showStreak \? \(/)
  assert.match(todaySource, /<ReferenceFlame \/>/)

  // Шапка остаётся на экране и во время загрузки дня — с актуальным streak.
  const headerCalls = todaySource.match(/<TodayWorkspaceHeader[\s\S]*?\/>/g) || []
  assert.ok(headerCalls.length >= 3, 'шапка рендерится во всех состояниях Today')
  for (const call of headerCalls) {
    assert.match(call, /streak=\{streak\}/, 'каждая шапка получает актуальную серию')
  }

  // Настройки по умолчанию: без сохранённых значений огонёк виден,
  // битый JSON в localStorage тоже не прячет серию.
  assert.match(preferencesSource, /showStreak: parsed\?\.showStreak !== false/)
  assert.match(preferencesSource, /return \{ showStreak: true, showBadges: true \}/)
})
