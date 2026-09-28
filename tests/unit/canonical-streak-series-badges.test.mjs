import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'
import { readCanonicalCurrentStreak, readCanonicalStreakStats, serverSeriesBadges } from '../../src/lib/canonicalStreak.js'

const source = await readFile(new URL('../../src/screens/SeriesBadges.jsx', import.meta.url), 'utf8')

test('canonical stats: current, longest and total active days are read together', () => {
  assert.deepEqual(
    readCanonicalStreakStats({ current_streak: 2, longest_streak: 9, total_active_days: 12 }),
    {
      currentStreak: 2,
      bestStreak: 9,
      activeDays: 12,
      isActiveToday: false,
      freezeUsedThisWeek: false,
      recoverable: false,
    }
  )
  assert.match(source, /api\.streak\(user\.id\)/)
  assert.match(source, /readCanonicalStreakStats\(payload\)/)
  assert.match(source, /const \{ currentStreak, bestStreak, activeDays \} = canonicalStats/)
  assert.match(source, /\['Текущая серия', formatDays\(currentStreak\)\]/)
  assert.match(source, /\['Дней с активностью', activeDays\]/)
  assert.match(source, /\['Самая длинная серия', formatDays\(bestStreak\)\]/)
  assert.match(source, /<strong>\{activeDays\}<\/strong>/)
})

test('canonical stats: zero is valid, including current streak', () => {
  assert.deepEqual(
    readCanonicalStreakStats({ current_streak: 0, longest_streak: 0, total_active_days: 0 }),
    {
      currentStreak: 0,
      bestStreak: 0,
      activeDays: 0,
      isActiveToday: false,
      freezeUsedThisWeek: false,
      recoverable: false,
    }
  )
  assert.equal(readCanonicalCurrentStreak({ current_streak: 0 }), 0)
})

test('canonical stats: invalid or partial payload falls back as a whole', () => {
  for (const payload of [null, {}, { current_streak: 1, longest_streak: 2 },
    { current_streak: '0', longest_streak: 2, total_active_days: 3 },
    { current_streak: 1, longest_streak: -1, total_active_days: 3 },
    { current_streak: 1, longest_streak: 2, total_active_days: 1.5 },
    { current_streak: 1, longest_streak: 2, total_active_days: Infinity },
  ]) {
    assert.equal(readCanonicalStreakStats(payload), null)
  }
  // Блок «Серия» показывается только по серверным данным.
  assert.match(source, /\{canonicalStats && <StatSection title="Серия"/)
  // Значки серии пересчитываются серверной статистикой, не историей.
  assert.match(source, /serverSeriesBadges\(visibleModel\?\.badges, serverStats, registrationDays\)/)
})

test('serverSeriesBadges: значки серии берут пороги из серверной статистики', () => {
  const badges = [
    { id: 'streak-three', goal: 3, done: false, progress: 0 },
    { id: 'week-on-path', goal: 7, done: false, progress: 0 },
    { id: 'first-checkin', goal: 1, done: false, progress: 0 },
  ]
  // Серия — из bestStreak, дни пути — из дней с регистрации.
  assert.deepEqual(serverSeriesBadges(badges, { bestStreak: 3 }, 7), [
    { id: 'streak-three', goal: 3, done: true, progress: 3 },
    { id: 'week-on-path', goal: 7, done: true, progress: 7 },
    { id: 'first-checkin', goal: 1, done: false, progress: 0 },
  ])
  // Без статистики значки серии не считаются выполненными по истории.
  const untouched = serverSeriesBadges(badges, null, null)
  assert.equal(untouched[0].done, false)
  assert.equal(untouched[1].done, false)
})

test('canonical network error and loading retain legacy stats without blocking badges', () => {
  assert.match(source, /api\.streak\(user\.id\)[\s\S]*?\.catch\(\(\) => \{\s*if \(active\) setCanonicalStats\(\{ userId: user\.id, value: null \}\)/)
  assert.match(source, /canonicalStats\?\.userId === user\.id \? canonicalStats\.value : null/)
  assert.match(source, /const next = buildServerSeriesViewModel\(\{ stats, checkins, rituals, ascezas \}\)/)
  assert.match(source, /badges: serverBadges/)
  // «Дней с чек-ином» берётся из канонической серии, а не из view-model без неё.
  assert.match(source, /\['Дней с чек-ином', activeDays \?\? model\.activeDays\]/)
  assert.doesNotMatch(source, /rememberSeriesSnapshot\(user\.id, canonicalStats\)/)
})
