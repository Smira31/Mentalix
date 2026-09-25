import test from 'node:test'
import assert from 'node:assert/strict'

import { buildTomorrowTeaser } from '../../src/lib/tomorrowTeaser.js'

/*
 * Локальный YYYY-MM-DD относительно сегодняшнего дня — тесты серии
 * зависят от «вчера/сегодня», жёстко зашитые даты ломаются при смене дня.
 */
function dayKey(offset = 0) {
  const d = new Date()
  d.setDate(d.getDate() + offset)
  const pad = v => String(v).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

function makeCheckin(offset, completed = true) {
  const date = dayKey(offset)
  return completed
    ? { date, review_completed_at: `${date}T20:00:00Z` }
    : { date }
}

// ── Ветка (а): значок серии через 1 день ──

test('(а) 4 чек-ина → завтра 5-й, значок «Голос услышан» — teaser про новый значок', () => {
  const checkins = [
    makeCheckin(-3),
    makeCheckin(-2),
    makeCheckin(-1),
    makeCheckin(0),
  ]
  const teaser = buildTomorrowTeaser({ streak: 4, checkins, isEvening: false })
  assert.equal(teaser, 'Завтра — 5-й день подряд и новый значок')
})

test('(а) 6 уникальных дней → завтра 7-й, значок «Неделя пути»', () => {
  const checkins = [
    makeCheckin(-5),
    makeCheckin(-4),
    makeCheckin(-3),
    makeCheckin(-2),
    makeCheckin(-1),
    makeCheckin(0),
  ]
  const teaser = buildTomorrowTeaser({ streak: 6, checkins, isEvening: false })
  assert.equal(teaser, 'Завтра — 7-й день подряд и новый значок')
})

test('(а) 29 уникальных дней → завтра 30-й, значок «Месяц пути»', () => {
  const checkins = Array.from({ length: 29 }, (_, i) => makeCheckin(i - 28))
  const teaser = buildTomorrowTeaser({ streak: 29, checkins, isEvening: false })
  assert.equal(teaser, 'Завтра — 30-й день подряд и новый значок')
})

test('(а) streak = 0 — значок не показывается, нет серии', () => {
  const teaser = buildTomorrowTeaser({ streak: 0, checkins: [], isEvening: false })
  assert.equal(teaser, 'Вечером — короткий разбор дня')
})

test('(а) значок уже получен (5 чек-инов) — не срабатывает, следующий приоритет', () => {
  const checkins = [
    makeCheckin(-4),
    makeCheckin(-3),
    makeCheckin(-2),
    makeCheckin(-1),
    makeCheckin(0),
  ]
  // 5 чек-инов → voice-heard уже done, week-on-path: 5 дней, до 7 ещё 2 дня
  const teaser = buildTomorrowTeaser({ streak: 5, checkins, isEvening: false })
  assert.equal(teaser, 'Вечером — короткий разбор дня')
})

// ── Ветка (б): активная аскеза ──

test('(б) активная аскеза streak 2 → «день 3 из 7 аскезы «…»»', () => {
  const ascezas = [
    { id: 1, name: 'Без Reels после 22:00', today_status: 'held', streak: 2 },
  ]
  const teaser = buildTomorrowTeaser({
    streak: 1,
    checkins: [makeCheckin(0)],
    ascezas,
    isEvening: false,
  })
  assert.equal(teaser, 'Завтра — день 3 из 7 аскезы «Без Reels после 22:00»')
})

test('(б) аскеза streak 5 → «день 6 из 7» (значок ещё не близко)', () => {
  const ascezas = [
    { id: 1, name: 'Без сахара', today_status: 'held', streak: 5 },
  ]
  const teaser = buildTomorrowTeaser({
    streak: 1,
    checkins: [makeCheckin(0)],
    ascezas,
    isEvening: false,
  })
  assert.equal(teaser, 'Завтра — день 6 из 7 аскезы «Без сахара»')
})

test('(а) аскеза streak 6 → значок «Аскеза — сила» 1 день, (а) бьёт (б)', () => {
  const ascezas = [
    { id: 1, name: 'Без сахара', today_status: 'held', streak: 6 },
  ]
  const teaser = buildTomorrowTeaser({
    streak: 1,
    checkins: [makeCheckin(0)],
    ascezas,
    isEvening: false,
  })
  assert.equal(teaser, 'Завтра — 2-й день подряд и новый значок')
})

test('(б) аскеза streak 7 (значок получен) → не срабатывает, переход к (в)', () => {
  const ascezas = [
    { id: 1, name: 'Без сахара', today_status: 'held', streak: 7 },
  ]
  const teaser = buildTomorrowTeaser({
    streak: 1,
    checkins: [makeCheckin(0)],
    ascezas,
    isEvening: false,
  })
  assert.equal(teaser, 'Вечером — короткий разбор дня')
})

test('(б) аскеза без today_status=held → не активна, переход к (в)', () => {
  const ascezas = [
    { id: 1, name: 'Без сахара', today_status: null, streak: 3 },
  ]
  const teaser = buildTomorrowTeaser({
    streak: 1,
    checkins: [makeCheckin(0)],
    ascezas,
    isEvening: false,
  })
  assert.equal(teaser, 'Вечером — короткий разбор дня')
})

test('(б) аскеза streak 0 → не активна', () => {
  const ascezas = [
    { id: 1, name: 'Без сахара', today_status: 'held', streak: 0 },
  ]
  const teaser = buildTomorrowTeaser({
    streak: 1,
    checkins: [makeCheckin(0)],
    ascezas,
    isEvening: false,
  })
  assert.equal(teaser, 'Вечером — короткий разбор дня')
})

// ── Ветка (б): активный ритуал ──

test('(б) активный ритуал streak 4 → «день 5 из 7 ритуала «…»»', () => {
  const rituals = [
    { id: 1, name: 'Утренний спорт', today_level: 'optimal', streak: 4 },
  ]
  const teaser = buildTomorrowTeaser({
    streak: 1,
    checkins: [makeCheckin(0)],
    rituals,
    isEvening: false,
  })
  assert.equal(teaser, 'Завтра — день 5 из 7 ритуала «Утренний спорт»')
})

test('(б) ритуал без today_level → не активен', () => {
  const rituals = [
    { id: 1, name: 'Утренний спорт', today_level: null, streak: 4 },
  ]
  const teaser = buildTomorrowTeaser({
    streak: 1,
    checkins: [makeCheckin(0)],
    rituals,
    isEvening: false,
  })
  assert.equal(teaser, 'Вечером — короткий разбор дня')
})

// ── Ветка (в): запасной вариант ──

test('(в) утро, нет данных → «Вечером — короткий разбор дня»', () => {
  const teaser = buildTomorrowTeaser({
    streak: 1,
    checkins: [makeCheckin(0)],
    isEvening: false,
  })
  assert.equal(teaser, 'Вечером — короткий разбор дня')
})

test('(в) вечер, нет данных → «Утром — новый вопрос дня»', () => {
  const teaser = buildTomorrowTeaser({
    streak: 0,
    checkins: [],
    isEvening: true,
  })
  assert.equal(teaser, 'Утром — новый вопрос дня')
})

test('(в) пустой вызов → запас по умолчанию (утро)', () => {
  assert.equal(buildTomorrowTeaser(), 'Вечером — короткий разбор дня')
  assert.equal(buildTomorrowTeaser({}), 'Вечером — короткий разбор дня')
  assert.equal(buildTomorrowTeaser({ isEvening: true }), 'Утром — новый вопрос дня')
})

// ── Приоритет: (а) > (б) > (в) ──

test('приоритет: (а) бьёт (б) — есть и значок, и аскеза', () => {
  const checkins = [makeCheckin(-3), makeCheckin(-2), makeCheckin(-1), makeCheckin(0)]
  const ascezas = [
    { id: 1, name: 'Без Reels', today_status: 'held', streak: 2 },
  ]
  const teaser = buildTomorrowTeaser({ streak: 4, checkins, ascezas, isEvening: false })
  assert.equal(teaser, 'Завтра — 5-й день подряд и новый значок')
})

test('приоритет: (б) бьёт (в) — есть аскеза, но нет значка рядом', () => {
  const ascezas = [
    { id: 1, name: 'Без Reels', today_status: 'held', streak: 2 },
  ]
  const teaser = buildTomorrowTeaser({
    streak: 1,
    checkins: [makeCheckin(0)],
    ascezas,
    isEvening: true,
  })
  assert.equal(teaser, 'Завтра — день 3 из 7 аскезы «Без Reels»')
})

test('приоритет: аскеза бьёт ритуал (аскеза проверяется первой)', () => {
  const ascezas = [
    { id: 1, name: 'Аскеза', today_status: 'held', streak: 2 },
  ]
  const rituals = [
    { id: 2, name: 'Ритуал', today_level: 'min', streak: 3 },
  ]
  const teaser = buildTomorrowTeaser({
    streak: 1,
    checkins: [makeCheckin(0)],
    ascezas,
    rituals,
    isEvening: false,
  })
  assert.equal(teaser, 'Завтра — день 3 из 7 аскезы «Аскеза»')
})

// ── Тон: без восклицательных знаков ──

test('ни один вариант не содержит восклицательного знака', () => {
  const variants = [
    buildTomorrowTeaser({
      streak: 4,
      checkins: [makeCheckin(-3), makeCheckin(-2), makeCheckin(-1), makeCheckin(0)],
    }),
    buildTomorrowTeaser({
      streak: 1,
      checkins: [makeCheckin(0)],
      ascezas: [{ name: 'Тест', today_status: 'held', streak: 2 }],
    }),
    buildTomorrowTeaser({
      streak: 1,
      checkins: [makeCheckin(0)],
      rituals: [{ name: 'Тест', today_level: 'min', streak: 2 }],
    }),
    buildTomorrowTeaser({ streak: 1, checkins: [makeCheckin(0)], isEvening: false }),
    buildTomorrowTeaser({ streak: 0, checkins: [], isEvening: true }),
  ]
  for (const text of variants) {
    assert.ok(!text.includes('!'), `тезер содержит «!»: «${text}»`)
  }
})
