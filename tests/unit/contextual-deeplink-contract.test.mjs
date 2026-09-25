import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'
import { parseContextualDeepLink, resolveContextualCheckin } from '../../src/lib/contextualDeepLink.js'

const app = readFileSync(new URL('../../src/App.jsx', import.meta.url), 'utf8')
const today = readFileSync(new URL('../../src/screens/Today.jsx', import.meta.url), 'utf8')

// Фиксируем поведение по локальному времени относительно текущего дня, а не календарную дату.
const todayAt = (hour, minute = 0) => {
  const date = new Date()
  date.setHours(hour, minute, 0, 0)
  return date
}

test('только известные contextual-ссылки открывают вложенный экран Сегодня', () => {
  assert.deepEqual(parseContextualDeepLink('?action=checkin', ''), {
    sub: 'contextualCheckin', returnFlow: null,
  })
  assert.deepEqual(parseContextualDeepLink('?action=evening', ''), {
    sub: 'evening', returnFlow: null,
  })
  assert.deepEqual(parseContextualDeepLink('?action=breathing', ''), {
    sub: 'breathing', returnFlow: null,
  })
  assert.deepEqual(parseContextualDeepLink('?action=unknown', ''), {
    sub: null, returnFlow: null,
  })
  assert.deepEqual(parseContextualDeepLink('?action=checkin-extra', ''), {
    sub: null, returnFlow: null,
  })
  assert.deepEqual(parseContextualDeepLink('', ''), { sub: null, returnFlow: null })
})

test('morning_v1 открывает утро и имеет приоритет над обычным action', () => {
  assert.deepEqual(parseContextualDeepLink('?action=breathing', 'morning_v1'), {
    sub: 'checkin', returnFlow: 'morning_v1',
  })
  assert.deepEqual(parseContextualDeepLink('', 'morning_v1'), {
    sub: 'checkin', returnFlow: 'morning_v1',
  })
  assert.deepEqual(parseContextualDeepLink('', 'other'), { sub: null, returnFlow: null })
})

test('checkin ведёт в вечер только после пройденного утра и наступления времени разбора', () => {
  const morning = { mood: 3, energy: 2 }
  assert.equal(resolveContextualCheckin({ now: todayAt(18, 59), reviewHour: 19, checkin: morning }), 'checkin')
  assert.equal(resolveContextualCheckin({ now: todayAt(19), reviewHour: 19, checkin: null }), 'checkin')
  assert.equal(resolveContextualCheckin({ now: todayAt(19), reviewHour: 19, checkin: morning }), 'evening')
  assert.equal(resolveContextualCheckin({ now: todayAt(20), reviewHour: 21, checkin: morning }), 'checkin')
  assert.equal(resolveContextualCheckin({ now: todayAt(19), reviewHour: 19, checkin: { ...morning, review_completed_at: new Date().toISOString() } }), 'checkin')
})

test('контекстный экран использует существующую навигацию Сегодня и нативную кнопку назад', () => {
  assert.match(app, /parseContextualDeepLink\(/)
  assert.match(app, /initialSub=\{initialTodaySub\}/)
  assert.match(today, /resolveContextualCheckin\(/)
  assert.match(today, /onRegisterBack\?\.\(handler\)/)
  assert.match(today, /<BreathingPractice onBack=\{\(\) => changeSub\(null\)\}/)
  assert.match(today, /mode=\{resolveCheckInMode\(\{ sub: activeSub, initialSub \}\)\}/)
})
