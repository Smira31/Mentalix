import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'

const source = readFileSync(new URL('../../src/screens/JournalFlow.jsx', import.meta.url), 'utf8')
const css = readFileSync(new URL('../../src/screens/JournalFlow.css', import.meta.url), 'utf8')

test('JournalFlow uses the canonical fullscreen/header/writing surface', () => {
  assert.match(source, /useFullscreenSurface/)
  assert.match(source, /FULLSCREEN_HEADER_SLOT_CLASS/)
  assert.match(source, /PracticeWritingCanvas/)
  assert.match(source, /JournalArt/)
  assert.doesNotMatch(source, /SceneLayout|JournalProgress|BookOpen/)
  assert.doesNotMatch(source, /JournalTextarea/)
})

test('JournalFlow keeps the four phases, copy, and reverse writing navigation', () => {
  assert.deepEqual(
    [...source.matchAll(/key: '(idea|action|analysis|newStep)'/g)].map(match => match[1]),
    ['idea', 'action', 'analysis', 'newStep']
  )
  assert.match(source, /if \(stage === 'writing' && phaseIndex > 0\)/)
  assert.match(source, /setPhaseIndex\(index => index - 1\)/)
  assert.match(source, /setStage\('intro'\)/)
  assert.match(source, /Сохранить и завершить/)
  assert.match(source, /Цикл сохранён/)
})

test('JournalFlow preserves Journal storage behavior and error handling', () => {
  for (const contract of [
    'mx-journal-v2',
    'saveJournalPhase',
    'hasLegacyJournalData',
    'migrateLegacyJournalToUser',
    'storageErrorMessage',
    'role="alert"',
  ]) {
    if (contract === 'mx-journal-v2') continue
    assert.match(source, new RegExp(contract.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')))
  }
  assert.match(source, /readJournalEntry\(todayKey\(\), userId\)/)
})

test('JournalFlow visual contract mirrors GSD geometry without changing GSD', () => {
  assert.match(css, /--journal-inset: clamp\(20px, 6vw, 28px\)/)
  assert.match(css, /min-height: clamp\(150px, 24dvh, 220px\)/)
  assert.match(css, /min-height: 110px/)
  assert.match(css, /font-size: clamp\(2rem, 8\.5vw, 3rem\)/)
  assert.match(css, /width: 56px/)
  const writingRoot = css.match(/\.journal-flow__writing \{([\s\S]*?)\n\}/)?.[1] || ''
  assert.doesNotMatch(writingRoot, /transform:\s*translateY\(-52px\)/)
  assert.equal(
    (css.match(/practice-writing-canvas__(?:question|description|field) \{[\s\S]*?position: relative;[\s\S]*?top: -52px;/g) || []).length,
    3
  )
  assert.match(css, /max-width: 20rem/)
  assert.match(css, /font-size: clamp\(2rem, 8\.6vw, 2\.75rem\)/)
  assert.match(css, /scroll-padding-bottom: 104px/)
  assert.match(css, /right: max\(16px, var\(--app-safe-right/)
  assert.match(css, /appearance: none;/)
  assert.match(css, /-webkit-appearance: none;/)
  assert.match(css, /journal-flow__topbar[\s\S]*justify-content: flex-end/)
})

test('JournalFlow keeps Self-Discovery secondary and outside the lower primary CTA zone', () => {
  assert.match(
    source,
    /journal-flow__intro-copy[\s\S]*journal-flow__guided-action[\s\S]*Разобраться в ситуации/
  )
  assert.match(source, /journal-flow__intro-actions[\s\S]*journal-flow__intro-cta/)
  assert.match(css, /journal-flow__guided-action \{[\s\S]*min-height: 44px/)
  assert.equal((source.match(/journal-flow__intro-cta/g) || []).length, 1)
})

test('JournalFlow completion keeps only the two owner-approved actions', () => {
  assert.match(source, /Вернуться к практикам/)
  assert.match(source, /Открыть запись/)
  assert.doesNotMatch(source, /Начать заново|Помогло ли это\?|feedback|restart/)
})
