import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'

const source = readFileSync(new URL('../../src/screens/JournalFlow.jsx', import.meta.url), 'utf8')

test('JournalFlow keeps its content left-aligned', () => {
  assert.doesNotMatch(source, /\n\s+centered\n/)
  assert.doesNotMatch(source, /mx-auto mt-8 flex h-\[96px\]/)
  assert.doesNotMatch(source, /text-center text-\[12px\] font-semibold text-faint/)
  assert.match(source, /editorClassName="pb-24"/)
  assert.match(source, /floatingToolbar/)
})

test('JournalFlow does not render the weekly-theme card', () => {
  assert.doesNotMatch(source, /Тема недели/)
  assert.doesNotMatch(source, /theme-card/)
})

test('JournalFlow preserves its four phases and completion action', () => {
  assert.match(source, /const PHASES = \[/)
  assert.match(source, /Сохранить и завершить/)
  assert.match(source, /Цикл сохранён/)
})

// This static contract test intentionally covers the active Practices -> JournalFlow path.
// Today’s separate weekly-theme card is outside the Journal flow and remains unchanged.
