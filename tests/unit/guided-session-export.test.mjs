import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const settings = await readFile(
  new URL('../../src/screens/Settings.jsx', import.meta.url),
  'utf8'
)
const privacyNotice = await readFile(
  new URL('../../src/screens/PrivacyNotice.jsx', import.meta.url),
  'utf8'
)
const noticeText = privacyNotice.replace(/\s+/g, ' ')

test('JSON export entry honestly names completed guided sessions', () => {
  assert.match(settings, /title="Экспорт JSON"/)
  assert.match(settings, /Сохранённые данные и завершённые направленные записи/)
})

test('privacy disclosure keeps completed guided sessions separate from Journey and History', () => {
  assert.match(noticeText, /JSON export также содержит завершённые направленные записи с сохранёнными вопросами и ответами как отдельный архив/)
  assert.match(noticeText, /не как записи Journey или History/)
  assert.doesNotMatch(noticeText, /автоматически становятся записью Journey/)
})

test('privacy disclosure does not equate JSON archive with Markdown or metrics-only CSV', () => {
  assert.match(noticeText, /Markdown и CSV не являются эквивалентным экспортом этого архива/)
  assert.match(noticeText, /CSV остаётся форматом только для метрик/)
})
