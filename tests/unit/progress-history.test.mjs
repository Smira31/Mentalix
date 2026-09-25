import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

import {
  formatDayLabel,
  formatEntryDateCaps,
  extractTime,
  buildEntriesByDay,
  entryListName,
  entryScreenTitle,
  ENTRY_TYPES,
} from '../../src/screens/progress/progressHistoryUtils.js'

// ── Вкладка по умолчанию — «Аналитика» ──

test('Analytics: вкладка по умолчанию — «Аналитика»', () => {
  const source = readFileSync(
    new URL('../../src/screens/Analytics.jsx', import.meta.url),
    'utf8'
  )
  // useState('analytics') — начальное значение activeTab
  assert.match(source, /useState\('analytics'\)/)
  // Сегмент содержит «Аналитика» и «История»
  assert.match(source, /Аналитика/)
  assert.match(source, /История/)
  // data-testid для вкладок
  assert.match(source, /progress-tab-analytics/)
  assert.match(source, /progress-tab-history/)
})

// ── Группировка записей по дням ──

test('buildEntriesByDay: группирует записи по дням', () => {
  const checkins = [
    { date: '2026-09-25', mood: 4, note: 'Утро', created_at: '2026-09-25T08:30:00Z' },
    { date: '2026-09-24', review_completed_at: '2026-09-24T20:00:00Z' },
  ]
  const moodPractices = [
    { recorded_at: '2026-09-25T15:00:00Z', mood: 5, emotion: 'радость' },
  ]
  const journalEntries = [
    { date: '2026-09-24', phases: [{ key: 'newStep', label: 'Новый шаг', text: 'Текст' }] },
  ]

  const days = buildEntriesByDay(checkins, moodPractices, journalEntries, [])

  // Два дня
  assert.equal(days.length, 2)

  // 25 сентября — новее, идёт первым
  assert.equal(days[0].date, '2026-09-25')
  // Две записи: настроение (15:00) + утренний чек-ин (08:30) — новые сверху
  assert.equal(days[0].entries.length, 2)
  assert.equal(days[0].entries[0].type, ENTRY_TYPES.MOOD)
  assert.equal(days[0].entries[1].type, ENTRY_TYPES.MORNING)

  // 24 сентября — вторая группа
  assert.equal(days[1].date, '2026-09-24')
  // Две записи: вечерний разбор (20:00) + дневник (без времени — в конце)
  assert.equal(days[1].entries.length, 2)
  assert.equal(days[1].entries[0].type, ENTRY_TYPES.EVENING)
  assert.equal(days[1].entries[1].type, ENTRY_TYPES.JOURNAL)
})

test('buildEntriesByDay: пустые данные → пустой массив', () => {
  assert.deepEqual(buildEntriesByDay([], [], [], []), [])
  assert.deepEqual(buildEntriesByDay(null, null, null, null), [])
})

test('buildEntriesByDay: чек-ин без review_completed_at не создаёт вечернюю запись', () => {
  const days = buildEntriesByDay(
    [{ date: '2026-09-25', mood: 4, note: 'Утро' }],
    [],
    [],
    []
  )
  assert.equal(days.length, 1)
  assert.equal(days[0].entries.length, 1)
  assert.equal(days[0].entries[0].type, ENTRY_TYPES.MORNING)
})

// ── Формат дат ──

test('formatDayLabel: «Сегодня» для текущего дня', () => {
  const today = new Date().toISOString().slice(0, 10)
  assert.equal(formatDayLabel(today), 'Сегодня')
})

test('formatDayLabel: «Вчера, 24 сент» для вчерашнего дня', () => {
  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)
  const iso = yesterday.toISOString().slice(0, 10)
  const d = new Date(iso + 'T00:00:00')
  const monthShort = ['янв', 'фев', 'мар', 'апр', 'мая', 'июн', 'июл', 'авг', 'сент', 'окт', 'ноя', 'дек']
  const expected = `Вчера, ${d.getDate()} ${monthShort[d.getMonth()]}`
  assert.equal(formatDayLabel(iso), expected)
})

test('formatDayLabel: «Пятница, 24 июл» для старого дня в текущем году', () => {
  // Используем фиксированную дату в текущем году
  const now = new Date()
  const currentYear = now.getFullYear()
  const iso = `${currentYear}-07-24`
  // 2025-07-24 — это четверг, 2026-07-24 — это пятница
  const d = new Date(iso + 'T00:00:00')
  const weekdays = ['Воскресенье', 'Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота']
  const expected = `${weekdays[d.getDay()]}, 24 июл`
  assert.equal(formatDayLabel(iso), expected)
})

test('formatDayLabel: год добавляется только если не текущий', () => {
  const now = new Date()
  const currentYear = now.getFullYear()
  const pastYear = currentYear - 1
  const iso = `${pastYear}-07-24`
  const label = formatDayLabel(iso)
  // Должен содержать прошлый год
  assert.match(label, new RegExp(String(pastYear)))
  // Текущий год не должен добавляться
  const currentYearIso = `${currentYear}-07-24`
  const currentYearLabel = formatDayLabel(currentYearIso)
  assert.doesNotMatch(currentYearLabel, new RegExp(` ${currentYear}$`))
})

// ── Вспомогательные функции ──

test('extractTime: извлекает HH:MM из ISO datetime', () => {
  assert.equal(extractTime('2026-09-25T20:46:00Z'), '20:46')
  assert.equal(extractTime('2026-09-25T08:30:00+03:00'), '08:30')
  assert.equal(extractTime('2026-09-25'), '')
  assert.equal(extractTime(''), '')
  assert.equal(extractTime(null), '')
})

test('entryListName: правильные названия для строки списка', () => {
  assert.equal(entryListName(ENTRY_TYPES.MORNING), 'Утренний чек-ин')
  assert.equal(entryListName(ENTRY_TYPES.EVENING), 'Вечерний разбор')
  assert.equal(entryListName(ENTRY_TYPES.MOOD), 'Настроение')
  assert.equal(entryListName(ENTRY_TYPES.JOURNAL), 'Дневник')
})

test('entryScreenTitle: заголовки экрана записи строчными с точкой', () => {
  assert.equal(entryScreenTitle(ENTRY_TYPES.MORNING), 'утро.')
  assert.equal(entryScreenTitle(ENTRY_TYPES.EVENING), 'вечер.')
  assert.equal(entryScreenTitle(ENTRY_TYPES.MOOD), 'настроение.')
  assert.equal(entryScreenTitle(ENTRY_TYPES.JOURNAL), 'дневник.')
})

test('formatEntryDateCaps: дата капителью для экрана записи', () => {
  const today = new Date().toISOString().slice(0, 10)
  assert.equal(formatEntryDateCaps(today, '08:30'), 'СЕГОДНЯ В 08:30')

  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)
  const yIso = yesterday.toISOString().slice(0, 10)
  assert.equal(formatEntryDateCaps(yIso, '20:46'), 'ВЧЕРА В 20:46')
})
