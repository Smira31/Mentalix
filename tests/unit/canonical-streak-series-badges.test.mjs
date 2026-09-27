import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'
import { readCanonicalCurrentStreak, readCanonicalStreakStats } from '../../src/lib/canonicalStreak.js'

const source = await readFile(new URL('../../src/screens/SeriesBadges.jsx', import.meta.url), 'utf8')

test('canonical stats: current, longest and total active days are read together', () => {
  assert.deepEqual(
    readCanonicalStreakStats({ current_streak: 2, longest_streak: 9, total_active_days: 12 }),
    { currentStreak: 2, bestStreak: 9, activeDays: 12 }
  )
  assert.match(source, /api\.streak\(user\.id\)/)
  assert.match(source, /readCanonicalStreakStats\(payload\)/)
  assert.match(source, /const \{ currentStreak, bestStreak, activeDays \} = canonicalStats \?\? model/)
  assert.match(source, /\['Текущая серия', formatDays\(currentStreak\)\]/)
  assert.match(source, /\['Всего завершённых дней', activeDays\]/)
  assert.match(source, /\['Самая длинная серия', formatDays\(bestStreak\)\]/)
  assert.match(source, /<strong>\{activeDays\}<\/strong>/)
})

test('canonical stats: zero is valid, including current streak', () => {
  assert.deepEqual(
    readCanonicalStreakStats({ current_streak: 0, longest_streak: 0, total_active_days: 0 }),
    { currentStreak: 0, bestStreak: 0, activeDays: 0 }
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
  assert.match(source, /canonicalStats \?\? model/)
})

test('canonical network error and loading retain legacy stats without blocking badges', () => {
  assert.match(source, /api\.streak\(user\.id\)[\s\S]*?\.catch\(\(\) => \{\s*if \(active\) setCanonicalStats\(\{ userId: user\.id, value: null \}\)/)
  assert.match(source, /canonicalStats\?\.userId === user\.id \? canonicalStats\.value : null/)
  assert.match(source, /const next = buildSeriesViewModel\(\{ stats, checkins, rituals, ascezas \}\)/)
  assert.match(source, /<AwardsView\s+model=\{visibleModel\}/)
  assert.match(source, /badges: model\.badges/)
  assert.match(source, /\['Дней с чек-ином', model\.activeDays\]/)
  assert.doesNotMatch(source, /rememberSeriesSnapshot\(user\.id, canonicalStats\)/)
})
