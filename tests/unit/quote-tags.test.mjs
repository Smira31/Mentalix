import assert from 'node:assert/strict'
import test from 'node:test'

import {
  SAVED_KIND,
  SAVED_TAG_PREFIX,
  THOUGHT_KIND,
  THOUGHT_TAG_PREFIX,
  isThoughtQuote,
  parseQuoteTag,
  savedTag,
  sortByDateDesc,
  tagForKind,
  thoughtTag,
  toQuoteItem,
  toQuoteItems,
} from '../../src/lib/quoteTags.js'

// ── сборка тегов ──

test('thoughtTag/savedTag собирают тег с датой дня', () => {
  assert.equal(thoughtTag('2026-10-01'), 'thought:2026-10-01')
  assert.equal(savedTag('2026-10-01'), 'saved:2026-10-01')
  assert.equal(THOUGHT_TAG_PREFIX, 'thought:')
  assert.equal(SAVED_TAG_PREFIX, 'saved:')
})

test('tagForKind различает мысль и сохранённую цитату', () => {
  assert.equal(tagForKind(THOUGHT_KIND, '2026-10-01'), 'thought:2026-10-01')
  assert.equal(tagForKind(SAVED_KIND, '2026-10-01'), 'saved:2026-10-01')
})

// ── разбор тегов ──

test('parseQuoteTag возвращает kind и date', () => {
  assert.deepEqual(parseQuoteTag('thought:2026-10-01'), {
    kind: THOUGHT_KIND,
    date: '2026-10-01',
  })
  assert.deepEqual(parseQuoteTag('saved:2026-10-01'), {
    kind: SAVED_KIND,
    date: '2026-10-01',
  })
})

test('parseQuoteTag игнорирует чужие и некорректные теги', () => {
  assert.equal(parseQuoteTag(undefined), null)
  assert.equal(parseQuoteTag(null), null)
  assert.equal(parseQuoteTag(''), null)
  assert.equal(parseQuoteTag('цитата'), null)
  assert.equal(parseQuoteTag('thought'), null)
  assert.equal(parseQuoteTag('thought:'), null)
  assert.equal(parseQuoteTag('thought:вчера'), null)
  assert.equal(parseQuoteTag('saved:2026-10'), null)
})

test('isThoughtQuote отсеивает обычные фразы пользователя', () => {
  assert.equal(isThoughtQuote({ tag: 'thought:2026-10-01' }), true)
  assert.equal(isThoughtQuote({ tag: 'saved:2026-10-01' }), true)
  assert.equal(isThoughtQuote({ tag: 'цитата' }), false)
  assert.equal(isThoughtQuote({ tag: null }), false)
  assert.equal(isThoughtQuote({}), false)
  assert.equal(isThoughtQuote(null), false)
})

// ── записи /quotes → элементы «Мысли дня» ──

test('toQuoteItem превращает запись /quotes в элемент мысли дня', () => {
  assert.deepEqual(toQuoteItem({ id: 7, text: 'Моя мысль', tag: 'thought:2026-10-01' }), {
    id: 7,
    text: 'Моя мысль',
    kind: THOUGHT_KIND,
    date: '2026-10-01',
  })
  assert.deepEqual(toQuoteItem({ id: 8, text: ' Цитата ', tag: 'saved:2026-09-30' }), {
    id: 8,
    text: 'Цитата',
    kind: SAVED_KIND,
    date: '2026-09-30',
  })
})

test('toQuoteItem отсеивает чужие, пустые и битые записи', () => {
  assert.equal(toQuoteItem({ id: 1, text: 'Обычная фраза', tag: 'цитата' }), null)
  assert.equal(toQuoteItem({ id: 2, text: '', tag: 'thought:2026-10-01' }), null)
  assert.equal(toQuoteItem({ id: 3, text: '   ', tag: 'thought:2026-10-01' }), null)
  assert.equal(toQuoteItem({ id: 4, tag: 'thought:2026-10-01' }), null)
  assert.equal(toQuoteItem(null), null)
})

test('toQuoteItems фильтрует список и терпит не-массив', () => {
  const items = toQuoteItems([
    { id: 1, text: 'Мысль', tag: 'thought:2026-10-01' },
    { id: 2, text: 'Обычная фраза', tag: null },
    { id: 3, text: 'Цитата', tag: 'saved:2026-09-30' },
  ])

  assert.deepEqual(
    items.map(i => i.date),
    ['2026-10-01', '2026-09-30']
  )
  assert.deepEqual(toQuoteItems(null), [])
  assert.deepEqual(toQuoteItems(undefined), [])
})

test('sortByDateDesc сортирует по дате убыванию и не мутирует вход', () => {
  const input = [
    { id: 1, date: '2026-09-30' },
    { id: 2, date: '2026-10-01' },
    { id: 3, date: '2026-09-01' },
  ]

  assert.deepEqual(
    sortByDateDesc(input).map(i => i.date),
    ['2026-10-01', '2026-09-30', '2026-09-01']
  )
  assert.equal(input[0].date, '2026-09-30')
})
