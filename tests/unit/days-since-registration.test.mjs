import test from 'node:test'
import assert from 'node:assert/strict'

import { daysSinceRegistration } from '../../src/lib/badgeCatalog.js'

// ── Базовые случаи ──

test('регистрация сегодня → 1 день (первый день включён)', () => {
  const today = new Date('2026-09-29T12:00:00')
  const registered = new Date('2026-09-29T08:00:00')
  assert.equal(daysSinceRegistration(registered, today), 1)
})

test('регистрация 29 дней назад → 30 дней', () => {
  const today = new Date('2026-09-29T12:00:00')
  const registered = new Date('2026-08-31T08:00:00')
  assert.equal(daysSinceRegistration(registered, today), 30)
})

test('регистрация ровно 7 дней назад → 8 дней', () => {
  const today = new Date('2026-09-29T12:00:00')
  const registered = new Date('2026-09-22T08:00:00')
  assert.equal(daysSinceRegistration(registered, today), 8)
})

// ── Часовые пояса ──

test('часовой пояс: регистрация UTC, сегодня локальная — считается по календарным дням', () => {
  // Регистрация 2026-09-28T23:00:00Z = 2026-09-29T02:00 по Москве
  // Сегодня 2026-09-29T12:00 по Москве = 2026-09-29T09:00:00Z
  const today = new Date('2026-09-29T09:00:00Z')
  const registered = new Date('2026-09-28T23:00:00Z')
  // UTC-даты: 28 → 29, разница 1 день + 1 = 2
  assert.equal(daysSinceRegistration(registered, today), 2)
})

test('часовой пояс: разные часы в один календарный день — 1 день', () => {
  // Регистрация рано утром, «сегодня» поздно вечером — тот же день
  const today = new Date('2026-09-29T20:00:00Z')
  const registered = new Date('2026-09-29T05:00:00Z')
  assert.equal(daysSinceRegistration(registered, today), 1)
})

// ── Граничные и ошибочные случаи ──

test('отсутствует дата регистрации → null', () => {
  assert.equal(daysSinceRegistration(null), null)
  assert.equal(daysSinceRegistration(undefined), null)
  assert.equal(daysSinceRegistration(''), null)
})

test('невалидная дата → null', () => {
  assert.equal(daysSinceRegistration('not-a-date'), null)
})

test('дата регистрации в будущем → null', () => {
  const today = new Date('2026-09-29T12:00:00')
  const future = new Date('2026-10-01T08:00:00')
  assert.equal(daysSinceRegistration(future, today), null)
})

test('ISO-строка даты работает как объект Date', () => {
  const today = new Date('2026-09-29T12:00:00')
  assert.equal(daysSinceRegistration('2026-09-29', today), 1)
  assert.equal(daysSinceRegistration('2026-08-31', today), 30)
})
