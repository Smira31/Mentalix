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
const checkInCompletionCss = readFileSync(
  new URL('../../src/components/CheckInCompletion.css', import.meta.url),
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

test('MXL-SELF-DISCOVERY-002 blurs active field and waits for viewport before completion', () => {
  // The completion transition must blur the focused field first so the
  // soft keyboard closes, then wait for visualViewport to stabilise —
  // no arbitrary fixed delay, driven by the real resize event.
  assert.match(flow, /useEffect/)
  assert.match(flow, /pendingComplete/)
  assert.match(flow, /active\.blur/)
  assert.match(flow, /visualViewport/)
  assert.match(flow, /addEventListener\('resize'/)
  assert.match(flow, /setStage\('complete'\)/)
  // The submit button must be disabled during the pending transition
  // to prevent a double-tap from re-entering continueFlow.
  assert.match(flow, /disabled=\{!answered\(value\) \|\| pendingComplete\}/)
})

test('MXL-SELF-DISCOVERY-002 uses approved CTA «Вернуться в журнал»', () => {
  assert.match(flow, /Вернуться в журнал/)
  assert.doesNotMatch(flow, /Вернуться в дневник/)
})

test('MXL-SELF-DISCOVERY-001 uses the shared typography scale and round CTA', () => {
  // Intro title uses the clamp scale
  assert.match(css, /guided-self-discovery__intro-title[\s\S]*font-size: clamp\(1\.375rem, 5\.6vw, 1\.75rem\)/)
  // Intro art container replaces the old hero
  assert.match(css, /guided-self-discovery__intro-art[\s\S]*justify-content: center/)
  assert.match(css, /guided-self-discovery__intro-art[\s\S]*min-height: clamp\(180px, 30dvh, 260px\)/)
  // Intro title line-height
  assert.match(css, /guided-self-discovery__intro-title[\s\S]*line-height: 1\.12/)
  // Question uses JournalField at 24px / weight 700
  assert.match(css, /guided-self-discovery__field-group \.mx-journal-field__question[\s\S]*font-size: 24px[\s\S]*font-weight: 700/)
  // Writing field: 16px / 1.5 line-height (no custom placeholder font-size)
  assert.match(css, /guided-self-discovery__field[\s\S]*font-size: 16px[\s\S]*line-height: 1\.5/)
  assert.doesNotMatch(css, /guided-self-discovery__field::placeholder\s*\{[^}]*font-size/)
  // CTA is a RoundNextButton with lucide icon, not a text chevron
  assert.match(flow, /RoundNextButton/)
  // Completion uses CheckInCompletion (same as evening review #967)
  assert.match(flow, /CheckInCompletion/)
  assert.match(flow, /TrackerArtComplete/)
  assert.match(checkInCompletionCss, /mx-completion__title[\s\S]*font-size: 28px/)
  assert.match(canvasCss, /practice-writing-canvas__submit svg[\s\S]*width: 20px[\s\S]*stroke-width: 2\.4/)
  assert.match(canvasCss, /practice-writing-canvas__submit:disabled[\s\S]*opacity: 0\.42/)
  assert.doesNotMatch(`${css}\n${canvasCss}`, /content: '[→›]'/)
})
