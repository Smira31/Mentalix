import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const source = await readFile(
  new URL('../../src/screens/GuidedJournals.jsx', import.meta.url),
  'utf8'
)

const archiveViewer = source
  .split('function CompletedSessionViewer')[1]
  .split('function TemplateBuilder')[0]

test('guided session archive fetches completed sessions without obsolete active status', () => {
  assert.match(source, /sessions\(user\.id, 'draft'\)/)
  assert.match(source, /sessions\(user\.id, 'completed'\)/)
  assert.doesNotMatch(source, /sessions\(user\.id, 'active'\)/)
})

test('completed session viewer renders persisted answers read-only', () => {
  assert.match(archiveViewer, /<ReadOnlyAnswer step=\{step\} value=\{completedSession\.answers\?\.\[step\.id\]\} \/>/)
  assert.doesNotMatch(archiveViewer, /<StepInput/)
  assert.doesNotMatch(archiveViewer, /onChange=/)
  assert.match(archiveViewer, /useFullscreenSurface\(\)/)
})

test('archive copy does not claim automatic Journey or History integration', () => {
  assert.match(source, /не создаёт записи в Journey/)
  assert.match(source, /не интегрирован с History/)
  assert.match(source, /Она не станет отдельной записью в Journey автоматически/)
})


test('completed answers are rendered as text rather than raw HTML', () => {
  assert.match(source, /whitespace-pre-wrap break-words/)
  assert.doesNotMatch(archiveViewer, /dangerouslySetInnerHTML/)
})
