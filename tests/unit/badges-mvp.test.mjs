import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'
import { buildMvpBadges } from '../../src/lib/badgesMvp.js'
import { readCanonicalStreakStats } from '../../src/lib/canonicalStreak.js'

const source = await readFile(
  new URL('../../src/screens/SeriesBadges.jsx', import.meta.url),
  'utf8'
)
const byId = (options, id) => buildMvpBadges(options).find(item => item.id === id)
const canonical = (current, longest, days) =>
  readCanonicalStreakStats({
    current_streak: current,
    longest_streak: longest,
    total_active_days: days,
  })

test('каждый порог: ниже и ровно на пороге, а прогресс берётся из current', () => {
  const checks = [
    ['streak_7', 6, 7, 0, 'Дней подряд: 6 из 7'],
    ['streak_30', 29, 30, 0, 'Дней подряд: 29 из 30'],
    ['active_days_100', 99, 100, 0, 'Активных дней: 99 из 100'],
  ]
  for (const [id, below, goal, other, label] of checks) {
    const statsBelow =
      id === 'active_days_100' ? canonical(0, other, below) : canonical(below, below, other)
    const statsAt =
      id === 'active_days_100' ? canonical(0, other, goal) : canonical(goal, goal, other)
    assert.equal(byId({ canonicalStats: statsBelow }, id).done, false)
    assert.equal(byId({ canonicalStats: statsBelow }, id).progressLabel, label)
    assert.equal(byId({ canonicalStats: statsAt }, id).done, true)
  }
})

test('reset current не отбирает значки, но обнуляет прогресс серии', () => {
  const options = { canonicalStats: canonical(0, 30, 100) }
  for (const id of ['streak_7', 'streak_30', 'active_days_100'])
    assert.equal(byId(options, id).done, true)
  assert.equal(byId(options, 'streak_7').progressLabel, 'Дней подряд: 0 из 7')
  assert.equal(byId(options, 'streak_30').progressLabel, 'Дней подряд: 0 из 30')
  assert.equal(byId(options, 'active_days_100').progressLabel, 'Активных дней: 100 из 100')
})

test('валидный ноль и невалидный canonical не подменяются legacy-метриками', () => {
  const zero = buildMvpBadges({ canonicalStats: canonical(0, 0, 0) })
  assert.equal(zero.length, 5)
  assert.ok(zero.every(item => !item.done && item.progress === 0))
  assert.deepEqual(
    buildMvpBadges({ canonicalStats: null }).map(item => item.id),
    ['first_checkin', 'first_journal']
  )
})

test('первый сохранённый утренний чек-ин или завершённый разбор; черновик не подходит', () => {
  assert.equal(byId({ checkins: [{ date: '2026-01-01' }] }, 'first_checkin').done, false)
  assert.equal(byId({ totalCheckins: 1 }, 'first_checkin').done, true)
  assert.equal(byId({ totalCheckins: '1' }, 'first_checkin').done, false)
  assert.equal(byId({ checkins: [{ mood: 3, date: '2026-01-01' }] }, 'first_checkin').done, true)
  assert.equal(
    byId({ checkins: [{ review_completed_at: '2026-01-01T12:00:00Z' }] }, 'first_checkin').done,
    true
  )
})

test('первая Journal запись: final в локальной истории или completed в существующем архиве', () => {
  assert.equal(
    byId(
      { journalEntries: [{ status: 'draft' }], completedSessions: [{ status: 'in_progress' }] },
      'first_journal'
    ).done,
    false
  )
  assert.equal(byId({ journalEntries: [{ status: 'final' }] }, 'first_journal').done, true)
  assert.equal(byId({ completedSessions: [{ status: 'completed' }] }, 'first_journal').done, true)
  assert.match(source, /readJournalHistory\(user\.id\)/)
  assert.match(source, /api\.journalTemplates\s*\.sessions\(user\.id, 'completed'\)/)
  assert.match(source, /api\.checkin\.history\(user\.id, 90\)/)
  assert.match(source, /readCanonicalStreakStats\(payload\)/)
  // Каталог значков собирается из MVP и серверных значков после готовности данных.
  // Допускаем перенос строки после catalogReady (палттер).
  assert.match(source, /catalogReady\s*\?\s*buildMvpBadges\(\{/)
  assert.match(source, /const badges = \[\.\.\.mvpBadges, \.\.\.serverBadges\]/)
  // «Записей» считает записи журнала, а не чек-ины.
  assert.match(source, /\['Записей', journalEntries\.length\]/)
})

test('MVP копирайт и уникальность ID', () => {
  const locked = buildMvpBadges({ canonicalStats: canonical(0, 0, 0) })
  const earned = buildMvpBadges({
    checkins: [{ mood: 2 }],
    journalEntries: [{ status: 'final' }],
    canonicalStats: canonical(30, 30, 100),
  })
  assert.deepEqual(
    locked.map(item => [item.title, item.desc]),
    [
      ['Первый чек-ин', 'Появится после первого завершённого чек-ина.'],
      ['Первая запись', 'Появится после первой завершённой записи.'],
      ['Серия: 7 дней', 'Пока серия меньше 7 дней.'],
      ['30 дней подряд', 'Пока серия меньше 30 дней.'],
      ['100 активных дней', 'Появится после 100 активных дней.'],
    ]
  )
  assert.deepEqual(
    earned.map(item => item.desc),
    [
      'Первый чек-ин завершён.',
      'Первая запись сохранена.',
      '7 активных дней подряд.',
      '30 активных дней подряд.',
      '100 активных дней.',
    ]
  )
  assert.equal(new Set(earned.map(item => item.id)).size, 5)
})
