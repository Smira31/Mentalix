import assert from 'node:assert/strict'
import test from 'node:test'
import { readFile } from 'node:fs/promises'

const source = await readFile(
  new URL('../../src/components/PracticeCatalogV2.jsx', import.meta.url),
  'utf8'
)

test('MXL-PRACTICES-CATALOG-POLISH-001 (G2): hero-копия соответствует Guided Self-Discovery', () => {
  assert.match(source, /Разбери день на части/)
  assert.match(source, /Семь простых вопросов: от того, что происходит, — к одному маленькому шагу\./)
  assert.doesNotMatch(source, /Собери день в четыре шага/)
  assert.doesNotMatch(source, /Идея, действие, анализ и новый шаг/)
})

test('MXL-PRACTICES-CATALOG-POLISH-001 (G2): eyebrow и CTA не меняются', () => {
  assert.match(source, /ЖУРНАЛ · СЕГОДНЯ/)
  assert.match(source, /Открыть журнал/)
})
