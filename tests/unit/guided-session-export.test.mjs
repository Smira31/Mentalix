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
  assert.match(settings, /Часть данных: профиль, чек-ины, завершённые направленные записи/)
})

test('privacy disclosure keeps completed guided sessions separate from Journey and History', () => {
  assert.match(noticeText, /JSON включает профиль, чек-ины, завершённые направленные записи с вопросами и ответами/)
  assert.match(noticeText, /Направленные записи представлены отдельно от пути и истории/)
  assert.doesNotMatch(noticeText, /автоматически становятся записью пути/)
})

test('privacy disclosure limits Markdown and CSV to check-in data', () => {
  assert.match(noticeText, /Markdown и CSV содержат только данные чек-инов, а не этот архив/)
  assert.doesNotMatch(noticeText, /CSV остаётся форматом только для метрик/)
})
