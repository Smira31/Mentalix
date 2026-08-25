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
