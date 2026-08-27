import assert from 'node:assert/strict'
import test from 'node:test'
import { readFile } from 'node:fs/promises'

const source = await readFile(
  new URL('../../src/screens/GuidedJournals.jsx', import.meta.url),
  'utf8'
)
const apiSource = await readFile(new URL('../../src/lib/api.js', import.meta.url), 'utf8')

test('Guided Journals запрашивает только поддерживаемые draft sessions для resume hub', () => {
  assert.match(source, /journalTemplates\s*\.sessions\(user\.id,\s*'draft'\)/)
  assert.doesNotMatch(source, /journalTemplates\s*\.sessions\(user\.id,\s*'active'\)/)
})

test('Guided Journals закрывает private API для legacy web-ID до server-side sessions', () => {
  assert.match(
    source,
    /const canUseGuidedJournals = platformName === 'telegram' && Number\(user\?\.id\) > 0/
  )
  assert.match(source, /if \(!canUseGuidedJournals\) return undefined/)
  assert.match(
    source,
    /Личные шаблоны и сохранённые ответы доступны в Telegram Mini App с проверенной подписью\./
  )
  assert.match(source, /пока для неё не появятся server-side\s+sessions\./)
})

test('private template builder использует update contract и объясняет versioning', () => {
  assert.match(source, /api\.journalTemplates\.update\(initialTemplate\.id, user\.id, draft\)/)
  assert.match(source, /Сохранить новую версию/)
  assert.match(source, /начатые сессии\s+сохраняют прежний набор вопросов/)
  assert.match(apiSource, /update: \(templateId, userId, template\)/)
})

test('private template detail требует подтверждение soft delete и сохраняет draft sessions', () => {
  assert.match(source, /Удалить личный шаблон\? Он исчезнет из каталога/)
  assert.match(source, /начатые сессии сохранят свой набор вопросов/)
  assert.match(source, /api\.journalTemplates\.remove\(selected\.id, user\.id\)/)
  assert.match(source, /Редактировать шаблон/)
  assert.match(source, /Удалить шаблон/)
  assert.doesNotMatch(source, /setActiveSessions\(current => current\.filter/)
})

test('completion text честно не обещает появления template session в Journey', () => {
  assert.match(source, /не станет отдельной записью в Journey автоматически/)
})
