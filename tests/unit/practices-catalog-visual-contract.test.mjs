import assert from 'node:assert/strict'
import test from 'node:test'
import { readFile } from 'node:fs/promises'

const source = await readFile(
  new URL('../../src/components/PracticeCatalogV2.jsx', import.meta.url),
  'utf8'
)

test('MXL-525 (G2): hero-копия соответствует Guided Self-Discovery', () => {
  assert.match(source, /Разбери день на части/)
  assert.match(source, /Семь простых вопросов, чтобы увидеть главное/)
  assert.doesNotMatch(source, /Собери день в четыре шага/)
  assert.doesNotMatch(source, /Идея, действие, анализ и новый шаг/)
})

test('MXL-525 (G7): функциональное меню «…» с «Открыть» на rail-карточках', () => {
  assert.match(source, /mx-layered-catalog__rail-menu/)
  assert.match(source, /Открыть/)
  assert.doesNotMatch(source, /•••/)
})
