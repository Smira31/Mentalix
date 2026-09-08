import assert from 'node:assert/strict'
import test from 'node:test'
import { readFile } from 'node:fs/promises'

const source = await readFile(
  new URL('../../src/components/BottomNavigation.jsx', import.meta.url),
  'utf8'
)

test('MXL-NAV-IA-001: нижняя навигация использует целевые русские названия', () => {
  const labels = ['Сегодня', 'Шаги', 'Диалог', 'Библиотека', 'Прогресс']
  for (const label of labels) {
    assert.match(source, new RegExp(`label: '${label}'`), `нет лейбла «${label}»`)
  }
})

test('MXL-NAV-IA-001: старые названия вкладок не используются как label', () => {
  assert.doesNotMatch(source, /label: 'Практики'/)
  assert.doesNotMatch(source, /label: 'Наставник'/)
  assert.doesNotMatch(source, /label: 'Тренды'/)
})

test('MXL-NAV-IA-001: ключи вкладок и порядок не меняются', () => {
  assert.match(source, /key: 'today',\s+label: 'Сегодня'/)
  assert.match(source, /key: 'practices',\s+label: 'Шаги'/)
  assert.match(source, /key: 'mentor',\s+label: 'Диалог'/)
  assert.match(source, /key: 'library',\s+label: 'Библиотека'/)
  assert.match(source, /key: 'trends',\s+label: 'Прогресс'/)
})
