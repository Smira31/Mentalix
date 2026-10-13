import assert from 'node:assert/strict'
import test from 'node:test'

import {
  DAILY_JOURNAL_PAGE_SIZE,
  diaryPageCursor,
  diaryPageHasMore,
  mergeDiaryEntries,
  normalizeDiaryEntry,
  normalizeDiaryPage,
} from '../../src/lib/dailyJournalHistory.js'

/*
 * JOURNAL-001 — записи настоящего дневника (api.dailyJournal) в «Прогресс →
 * История». Здесь проверяется только нормализация ответа и слияние страниц:
 * без дублей при повторной загрузке, без схлопывания разных записей одного
 * дня по дате, без записи куда-либо. Сам экран читает данные существующим
 * API (GET), поэтому локальное хранилище не участвует.
 *
 * Даты здесь — фиксированные строки контракта, а не «сегодня»: модуль ничего
 * не знает о текущем дне, он только приводит поля ответа.
 */

function rawEntry(overrides = {}) {
  return {
    id: 41,
    date: '2026-09-25',
    day_number: 12,
    stream_text: 'Выпишу всё из головы',
    prompt_text: 'Что дальше?',
    prompt_answer: 'Сделать шаг',
    created_at: '2026-09-25T21:00:00Z',
    ...overrides,
  }
}

test('normalizeDiaryEntry: сохраняет текст, дату и профильный id', () => {
  const entry = normalizeDiaryEntry(rawEntry())
  assert.deepEqual(entry, {
    id: '41',
    date: '2026-09-25',
    dayNumber: 12,
    streamText: 'Выпишу всё из головы',
    promptText: 'Что дальше?',
    promptAnswer: 'Сделать шаг',
    createdAt: '2026-09-25T21:00:00Z',
  })
})

test('normalizeDiaryEntry: запись без id или даты бесполезна и отбрасывается', () => {
  assert.equal(normalizeDiaryEntry(rawEntry({ id: undefined })), null)
  assert.equal(normalizeDiaryEntry(rawEntry({ id: null })), null)
  assert.equal(normalizeDiaryEntry(rawEntry({ id: '   ' })), null)
  assert.equal(normalizeDiaryEntry(rawEntry({ date: undefined })), null)
  assert.equal(normalizeDiaryEntry(rawEntry({ date: '' })), null)
  assert.equal(normalizeDiaryEntry(null), null)
  assert.equal(normalizeDiaryEntry('не запись'), null)
})

test('normalizeDiaryEntry: пустая запись без потока и ответа не показывается', () => {
  assert.equal(normalizeDiaryEntry(rawEntry({ stream_text: '', prompt_answer: '' })), null)
  assert.equal(normalizeDiaryEntry(rawEntry({ stream_text: '   ', prompt_answer: '  ' })), null)
  // Достаточно одного из двух: ответ на вопрос без потока — тоже запись.
  const answerOnly = normalizeDiaryEntry(rawEntry({ stream_text: '', prompt_answer: 'Один шаг' }))
  assert.equal(answerOnly.promptAnswer, 'Один шаг')
  assert.equal(answerOnly.streamText, '')
})

test('normalizeDiaryEntry: дата приводится к календарному дню, id — к строке', () => {
  const withTime = normalizeDiaryEntry(rawEntry({ date: '2026-09-25T21:00:00Z', id: 7 }))
  assert.equal(withTime.date, '2026-09-25')
  assert.equal(withTime.id, '7')
})

test('normalizeDiaryPage: не-массив и мусор не ломают нормализацию', () => {
  assert.deepEqual(normalizeDiaryPage(undefined), [])
  assert.deepEqual(normalizeDiaryPage(null), [])
  assert.deepEqual(normalizeDiaryPage('nope'), [])
  const page = normalizeDiaryPage([rawEntry(), { id: 1 }, null, rawEntry({ id: 42 })])
  assert.deepEqual(
    page.map(entry => entry.id),
    ['41', '42']
  )
})

test('mergeDiaryEntries: повторная загрузка той же страницы не даёт дублей', () => {
  const page = normalizeDiaryPage([
    rawEntry({ id: 2, date: '2026-09-25' }),
    rawEntry({ id: 1, date: '2026-09-24' }),
  ])

  const once = mergeDiaryEntries([], page)
  const twice = mergeDiaryEntries(once, page)
  const threeTimes = mergeDiaryEntries(twice, page)

  assert.deepEqual(twice.map(e => e.id), ['2', '1'])
  assert.deepEqual(threeTimes, twice)
  assert.equal(threeTimes.length, 2)
})

test('mergeDiaryEntries: следующая страница добавляется без пропусков и дублей', () => {
  const first = normalizeDiaryPage([rawEntry({ id: 3, date: '2026-09-25' })])
  // Вторая страница частично пересекается с первой — как может отдать курсор.
  const second = normalizeDiaryPage([
    rawEntry({ id: 3, date: '2026-09-25' }),
    rawEntry({ id: 2, date: '2026-09-24' }),
    rawEntry({ id: 1, date: '2026-09-23' }),
  ])

  const merged = mergeDiaryEntries(first, second)
  assert.deepEqual(merged.map(e => e.id), ['3', '2', '1'])
})

test('mergeDiaryEntries: разные записи одного дня остаются разными строками', () => {
  const merged = mergeDiaryEntries([], [
    { id: 'a', date: '2026-09-25', streamText: 'Вечер' },
    { id: 'b', date: '2026-09-25', streamText: 'Утро' },
    { id: 'c', date: '2026-09-25', streamText: 'Днём' },
  ])
  assert.equal(merged.length, 3)
  assert.deepEqual(merged.map(e => e.id), ['a', 'b', 'c'])
})

test('diaryPageHasMore: полнота ленты не заявляется на неполной странице', () => {
  assert.equal(diaryPageHasMore(Array.from({ length: DAILY_JOURNAL_PAGE_SIZE }, () => ({}))), true)
  assert.equal(diaryPageHasMore(Array.from({ length: DAILY_JOURNAL_PAGE_SIZE - 1 }, () => ({}))), false)
  assert.equal(diaryPageHasMore([]), false)
  assert.equal(diaryPageHasMore(undefined), false)
})

test('diaryPageCursor: курсор — дата последней загруженной записи', () => {
  assert.equal(
    diaryPageCursor([{ id: '2', date: '2026-09-25' }, { id: '1', date: '2026-09-24' }]),
    '2026-09-24'
  )
  assert.equal(diaryPageCursor([]), undefined)
  assert.equal(diaryPageCursor(null), undefined)
})
