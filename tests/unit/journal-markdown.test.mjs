import assert from 'node:assert/strict'
import test from 'node:test'

import {
  parseInlineMarkdown,
  parseMarkdownBlocks,
  wrapMarkdownSelection,
} from '../../src/lib/journalMarkdown.js'

test('journal markdown разбирает жирный, курсив и выделение без HTML', () => {
  assert.deepEqual(parseInlineMarkdown('Это **важно**, _спокойно_ и ==главное== <script>'), [
    { type: 'text', content: 'Это ' },
    { type: 'strong', content: 'важно' },
    { type: 'text', content: ', ' },
    { type: 'emphasis', content: 'спокойно' },
    { type: 'text', content: ' и ' },
    { type: 'highlight', content: 'главное' },
    { type: 'text', content: ' <script>' },
  ])
})

test('journal markdown сохраняет абзацы и списки как структурированные блоки', () => {
  assert.deepEqual(parseMarkdownBlocks('Первая строка\nвторая строка\n\n- один\n- два'), [
    { type: 'paragraph', lines: ['Первая строка', 'вторая строка'] },
    { type: 'unordered-list', items: ['один', 'два'] },
  ])
})

test('toolbar оборачивает выделение и повторным действием снимает формат', () => {
  const wrapped = wrapMarkdownSelection('Это важно', 4, 9, '**')

  assert.deepEqual(wrapped, {
    value: 'Это **важно**',
    selectionStart: 6,
    selectionEnd: 11,
  })

  assert.deepEqual(
    wrapMarkdownSelection(wrapped.value, wrapped.selectionStart, wrapped.selectionEnd, '**'),
    {
      value: 'Это важно',
      selectionStart: 4,
      selectionEnd: 9,
    }
  )
})

test('journal presentation группирует сообщения по последовательным датам МСК', async () => {
  const { groupJournalMessages } = await import('../../src/lib/journalPresentation.js')

  // Даты — только относительно текущего дня: разделитель считает границу
  // суток по МСК и называет сегодняшний/вчерашний день словами.
  const today = new Date()
  const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000)

  const groups = groupJournalMessages([
    { role: 'user', content: 'Первый', created_at: yesterday.toISOString() },
    { role: 'assistant', content: 'Ответ', created_at: yesterday.toISOString() },
    { role: 'user', content: 'Следующий день', created_at: today.toISOString() },
  ])

  assert.equal(groups.length, 2)
  assert.equal(groups[0].messages.length, 2)
  assert.equal(groups[1].messages.length, 1)
  assert.equal(groups[0].label, 'Вчера')
  assert.equal(groups[1].label, 'Сегодня')
})

test('journal presentation сохраняет сообщения без даты в одном fallback-разделе', async () => {
  const { groupJournalMessages } = await import('../../src/lib/journalPresentation.js')

  const groups = groupJournalMessages([
    { role: 'assistant', content: 'Ответ без даты' },
    { role: 'user', content: 'Вопрос без даты' },
  ])

  assert.equal(groups.length, 1)
  assert.equal(groups[0].key, 'undated')
  assert.equal(groups[0].messages.length, 2)
})

test('journal presentation определяет длинный ответ по безопасному порогу', async () => {
  const { isLongJournalMessage } = await import('../../src/lib/journalPresentation.js')

  assert.equal(isLongJournalMessage({ content: 'a'.repeat(720) }), false)
  assert.equal(isLongJournalMessage({ content: 'a'.repeat(721) }), true)
})
