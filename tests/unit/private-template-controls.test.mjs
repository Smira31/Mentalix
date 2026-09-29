import assert from 'node:assert/strict'
import test from 'node:test'
import { readFile } from 'node:fs/promises'

const source = await readFile(
  new URL('../../src/screens/GuidedJournals.jsx', import.meta.url),
  'utf8'
)
const apiSource = await readFile(new URL('../../src/lib/api.js', import.meta.url), 'utf8')

test('Guided Journals использует локальные драфты вместо server draft sessions для resume hub', () => {
  // V3: no server draft session calls — local drafts only
  assert.doesNotMatch(source, /journalTemplates\s*\.sessions\(user\.id,\s*'draft'\)/)
  assert.doesNotMatch(source, /journalTemplates\s*\.sessions\(user\.id,\s*'active'\)/)
  assert.match(source, /listJournalDrafts/)
})

test('Guided Journals доступен в web-режиме с валидным user ID', () => {
  assert.match(
    source,
    /const canUseGuidedJournals = Number\(user\?\.id\) > 0/
  )
  assert.match(source, /if \(!canUseGuidedJournals\) return/)
  assert.match(source, /Направленные записи доступны после входа\./)
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
  // V3: no server active sessions to filter
  assert.doesNotMatch(source, /setActiveSessions\(current => current\.filter/)
})

test('запуск направленной записи использует локальный драф вместо server session', () => {
  // V3: completeSession replaces startOrResume; local draft instead of server session
  assert.match(apiSource, /completeSession: \(userId, templateId, answers, idempotencyKey\)/)
  assert.match(apiSource, /\/journal\/templates\/sessions\/complete/)
  assert.match(source, /readJournalDraft/)
  assert.match(source, /api\.journalTemplates\.completeSession/)
  assert.doesNotMatch(source, /api\.journalTemplates\.startOrResume/)
})

test('completion text честно не обещает появления template session в Journey', () => {
  // V3: completion text updated for local-draft flow
  assert.match(source, /Ответы отправлены/)
})
