import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'

const flow = readFileSync(new URL('../../src/screens/GuidedSelfDiscoveryFlow.jsx', import.meta.url), 'utf8')
const storage = readFileSync(
  new URL('../../src/lib/guidedSelfDiscoveryDraft.js', import.meta.url),
  'utf8'
)
const practices = readFileSync(new URL('../../src/screens/Practices.jsx', import.meta.url), 'utf8')
const css = readFileSync(new URL('../../src/screens/GuidedSelfDiscoveryFlow.css', import.meta.url), 'utf8')
const canvasCss = readFileSync(
  new URL('../../src/components/PracticeWritingCanvas.css', import.meta.url),
  'utf8'
)

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

test('MXL-SELF-DISCOVERY-001 keeps the existing Practices routing contract', () => {
  assert.match(practices, /if \(sub === 'journal'\) \{[\s\S]*<GuidedSelfDiscoveryFlow userId=\{user\.id\} onClose=\{\(\) => setSub\(null\)\} \/>/)
  assert.match(practices, /sub === 'self-discovery'/)
  assert.match(practices, /if \(sub === 'self-discovery'\) \{[\s\S]*onClose=\{\(\) => setSub\(null\)\}/)
  assert.doesNotMatch(practices, /onOpenGuided=/)
  assert.doesNotMatch(practices, /onOpenPractice\([^)]*self-discovery/)
})

test('MXL-SELF-DISCOVERY-001 uses the shared typography scale and chevron CTA', () => {
  assert.match(css, /guided-self-discovery__intro-title[\s\S]*font-size: clamp\(1\.375rem, 5\.6vw, 1\.75rem\)/)
  assert.match(css, /practice-writing-canvas__question[\s\S]*font-size: clamp\(1\.375rem, 5\.6vw, 1\.75rem\)/)
  assert.match(css, /guided-self-discovery__completion-title[\s\S]*font-size: clamp\(1\.375rem, 5\.6vw, 1\.75rem\)/)
  assert.match(css, /guided-self-discovery__hero[\s\S]*justify-content: center/)
  assert.match(css, /guided-self-discovery__hero[\s\S]*min-height: clamp\(180px, 30dvh, 260px\)/)
  assert.match(css, /guided-self-discovery__intro-title[\s\S]*line-height: 1\.12/)
  assert.match(css, /guided-self-discovery__completion-title[\s\S]*line-height: 1\.12/)
  assert.match(flow, /guided-self-discovery__chevron[\s\S]*viewBox="0 0 20 20"/)
  assert.match(css, /guided-self-discovery__chevron[\s\S]*width: 20px[\s\S]*stroke-width: 2\.4/)
  assert.match(canvasCss, /practice-writing-canvas__submit svg[\s\S]*width: 20px[\s\S]*stroke-width: 2\.4/)
  assert.match(canvasCss, /practice-writing-canvas__submit:disabled[\s\S]*opacity: 0\.42/)
  assert.doesNotMatch(`${css}\n${canvasCss}`, /content: '[→›]'/)
})
