import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'

const flow = readFileSync(new URL('../../src/screens/GuidedSelfDiscoveryFlow.jsx', import.meta.url), 'utf8')
const storage = readFileSync(
  new URL('../../src/lib/guidedSelfDiscoveryDraft.js', import.meta.url),
  'utf8'
)
const practices = readFileSync(new URL('../../src/screens/Practices.jsx', import.meta.url), 'utf8')
const journal = readFileSync(new URL('../../src/screens/JournalFlow.jsx', import.meta.url), 'utf8')

test('MXL-SELF-DISCOVERY-001 keeps the first flow prompt-only and local-only', () => {
  assert.match(flow, /const STEPS = \[/)
  assert.match(flow, /key: 'facts'/)
  assert.match(flow, /key: 'interpretation'/)
  assert.match(flow, /key: 'unknown'/)
  assert.match(flow, /key: 'control'/)
  assert.match(flow, /key: 'experiment'/)
  assert.doesNotMatch(flow, /api\./)
  assert.doesNotMatch(flow, /invokeLLM|sendData|fetch\(/)
  assert.match(flow, /Это не тест личности и не диагноз/)
  assert.match(flow, /обратимым/)
})

test('MXL-SELF-DISCOVERY-001 stores drafts user-scoped without changing journal contracts', () => {
  assert.match(storage, /mx-guided-self-discovery-v1/)
  assert.match(storage, /:user:\$\{encodeURIComponent\(normalized\)\}/)
  assert.match(storage, /stage === 'complete' \? 'complete' : 'draft'/)
  assert.match(flow, /saveGuidedSelfDiscoveryDraft\(userId, nextAnswers\)/)
  assert.match(flow, /saveGuidedSelfDiscoveryDraft\(userId, answers, 'complete'\)/)
})

test('MXL-SELF-DISCOVERY-001 opens from Journal and returns to the existing Journal surface', () => {
  assert.match(journal, /onOpenGuided/)
  assert.match(journal, /Не понимаю, что делать → разобраться сейчас/)
  assert.match(practices, /onOpenGuided=\{\(\) => setSub\('self-discovery'\)\}/)
  assert.match(practices, /sub === 'self-discovery'/)
  assert.match(practices, /onClose=\{\(\) => setSub\('journal'\)\}/)
  assert.doesNotMatch(practices, /onOpenPractice\([^)]*self-discovery/)
})
