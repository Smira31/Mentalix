import assert from 'node:assert/strict'
import test from 'node:test'

import { readFile } from 'node:fs/promises'

import {
  moodPracticeDate,
  groupMoodPracticesByDate,
} from '../../src/lib/moodPracticeLogic.js'
import { readCanonicalStreakStats } from '../../src/lib/canonicalStreak.js'

const seriesSource = await readFile(new URL('../../src/lib/series.js', import.meta.url), 'utf8')

/** Локальный YYYY-MM-DD относительно сегодняшнего дня. */
function dayKey(offset = 0) {
  const d = new Date()
  d.setDate(d.getDate() + offset)
  const pad = v => String(v).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

test('moodPracticeDate извлекает YYYY-MM-DD из recorded_at', () => {
  assert.equal(
    moodPracticeDate({ recorded_at: `${dayKey(0)}T15:30:00.000Z` }),
    dayKey(0)
  )
  assert.equal(
    moodPracticeDate({ date: dayKey(-1) }),
    dayKey(-1)
  )
  assert.equal(moodPracticeDate({}), null)
  assert.equal(moodPracticeDate(null), null)
})

test('groupMoodPracticesByDate группирует записи по дню', () => {
  const practices = [
    { id: 1, recorded_at: `${dayKey(0)}T08:00:00.000Z`, mood: 3, emotion: 'ровно' },
    { id: 2, recorded_at: `${dayKey(0)}T15:30:00.000Z`, mood: 2, emotion: 'устал' },
    { id: 3, recorded_at: `${dayKey(-1)}T10:00:00.000Z`, mood: 4, emotion: 'бодро' },
  ]
  const grouped = groupMoodPracticesByDate(practices)
  assert.deepEqual(Object.keys(grouped).sort(), [dayKey(-1), dayKey(0)].sort())
  assert.equal(grouped[dayKey(0)].length, 2)
  assert.equal(grouped[dayKey(-1)].length, 1)
})

test('groupMoodPracticesByDate: день без чек-ина, только с записями «Настроения»', () => {
  const practices = [
    { id: 1, recorded_at: `${dayKey(1)}T12:00:00.000Z`, mood: 3, emotion: 'спокойно' },
  ]
  const grouped = groupMoodPracticesByDate(practices)
  // День есть только в mood practices — нет чек-ина
  assert.ok(grouped[dayKey(1)])
  assert.equal(grouped[dayKey(1)].length, 1)
})

test('groupMoodPracticesByDate: пустой ввод → пустой объект', () => {
  assert.deepEqual(groupMoodPracticesByDate([]), {})
  assert.deepEqual(groupMoodPracticesByDate(null), {})
  assert.deepEqual(groupMoodPracticesByDate(undefined), {})
})

// ── Мягкая серия: учёт «любой активности» — на сервере ──

test('записи «Настроения» не пересчитываются в серию на клиенте', () => {
  // По решению от 27.09 серия мягкая: день засчитывается по любой
  // активности, и считает её сервер (GET /api/streak). Клиент больше
  // не собирает activityDays из mood practices — утилита удалена.
  assert.doesNotMatch(seriesSource, /collectActivityDays/)
  assert.doesNotMatch(seriesSource, /moodPracticeDate/)
})

test('серия за день только с записью «Настроения» приходит с сервера', () => {
  // Сервер засчитывает день с mood-практикой: клиент получает уже
  // посчитанные current_streak / total_active_days и флаги, не выводя
  // их из истории записей. Проверяем контракт: любое число серии
  // из ответа проходит без пересчёта.
  const stats = readCanonicalStreakStats({
    current_streak: 2,
    longest_streak: 2,
    total_active_days: 2,
    is_active_today: true,
  })
  assert.equal(stats.currentStreak, 2)
  assert.equal(stats.activeDays, 2)
  assert.equal(stats.isActiveToday, true)
})
