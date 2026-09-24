import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const checkinSource = await readFile(new URL('../../src/screens/CheckIn.jsx', import.meta.url), 'utf8')
const demoModeSource = await readFile(new URL('../../src/lib/demoMode.js', import.meta.url), 'utf8')
const apiSource = await readFile(new URL('../../src/lib/api.js', import.meta.url), 'utf8')


test('the morning visual flow is the default check-in entry point', () => {
  assert.match(checkinSource, /function MorningCheckInFlow\(\{ user, onDone, redo = false \}\)/)
  assert.match(checkinSource, /if \(mode !== 'evening'\) \{\s*return <MorningCheckInFlow user=\{user\} onDone=\{onDone\} redo=\{redo\} \/>/s)
  assert.doesNotMatch(checkinSource, /if \(previewDemoMode && mode !== 'evening'\)/)
})

test('the legacy core remains available for evening review and rollback', () => {
  assert.match(checkinSource, /function CheckInCore\(\{ user, onDone, mode = 'checkin', existing = null \}\)/)
  assert.match(checkinSource, /return <CheckInCore user=\{user\} onDone=\{onDone\} mode=\{mode\} existing=\{existing\} \/>/)
})

test('evening first text step has no pre-declaration question access', () => {
  const core = checkinSource.slice(
    checkinSource.indexOf('function CheckInCore'),
    checkinSource.indexOf('function CheckIn({')
  )
  const compactStepDisabled = core.slice(
    core.indexOf('const compactStepDisabled'),
    core.indexOf('const streakDays')
  )
  const eveningQuestionDeclaration = core.indexOf('const eveningQuestion =')
  const firstEveningQuestionUse = core.indexOf('eveningQuestion', eveningQuestionDeclaration + 1)
  const questionTitleDeclaration = core.indexOf('const questionTitle =')
  const firstQuestionTitleUse = core.indexOf('questionTitle', questionTitleDeclaration + 1)

  assert.doesNotMatch(compactStepDisabled, /eveningQuestion/)
  assert.ok(eveningQuestionDeclaration >= 0)
  assert.ok(firstEveningQuestionUse > eveningQuestionDeclaration)
  assert.ok(questionTitleDeclaration >= 0)
  assert.ok(firstQuestionTitleUse > questionTitleDeclaration)
})

test('the default morning flow persists real user data through the check-in API', () => {
  const morningFlow = checkinSource.slice(
    checkinSource.indexOf('function MorningCheckInFlow'),
    checkinSource.indexOf('// ── Чек-ин и вечерний')
  )
  assert.match(morningFlow, /const saveApi = redo \? api\.checkin\.redo : api\.checkin\.save/)
  assert.match(morningFlow, /saveApi\(user\.id, \{/)
  assert.match(morningFlow, /mood: values\.mood \|\| 3/)
  assert.match(morningFlow, /energy: values\.energy \|\| 3/)
  assert.match(morningFlow, /focus: values\.focus \|\| 3/)
  assert.match(morningFlow, /note: note\.trim\(\) \|\| undefined/)
  assert.match(morningFlow, /api\.checkin\.history\(user\.id, 90\)/)
  assert.match(apiSource, /checkin: \{[\s\S]*?save: \(/)
  assert.match(apiSource, /request\('\/checkin', \{[\s\S]*?method: 'POST'/)
  assert.match(apiSource, /request\('\/checkin\/today', \{[\s\S]*?method: 'PUT'/)
})

test('seeded demo state remains opt-in and isolated in the API wrapper', () => {
  assert.match(demoModeSource, /const demoRequested = params\.get\('demo'\) === '1'/)
  assert.match(demoModeSource, /const pwaDemoRequested = params\.get\('source'\) === 'pwa'/)
  assert.match(demoModeSource, /return \(\s*\(demoRequested \|\| pwaDemoRequested\)/s)
  assert.match(apiSource, /if \(isPreviewDemoMode\(\)\) return demoRequest\(path, options\)/)
})

test('morning flow keeps the visual viewport height when the keyboard opens', () => {
  const morningFlow = checkinSource.slice(
    checkinSource.indexOf('function MorningCheckInFlow'),
    checkinSource.indexOf('// ── Чек-ин и вечерний')
  )
  assert.match(morningFlow, /const \{ style: viewportStyle \} = useFullscreenSurface\(\)/)
  assert.match(morningFlow, /const demoSurfaceStyle = \{[\s\S]*\.\.\.viewportStyle[\s\S]*paddingTop: 0/)
  assert.match(checkinSource, /className="mx-demo-checkin__editor-scene"/)
})

test('morning completion uses design-system SVG art instead of the raster bird', () => {
  assert.match(checkinSource, /function CheckInCompletionArt\(\)/)
  assert.match(checkinSource, /<CheckInCompletionArt \/>/)
  assert.match(checkinSource, /rgb\(var\(--c-(text|gold|muted|bg)\)\)/)
  assert.doesNotMatch(checkinSource, /checkin-bird-reference\.png/)
})

test('morning streak screen uses the shared Telegram BackButton and sprout flower', () => {
  const morningFlow = checkinSource.slice(
    checkinSource.indexOf('function MorningCheckInFlow'),
    checkinSource.indexOf('// ── Чек-ин и вечерний')
  )
  assert.match(morningFlow, /<BackButton onClick=\{handleBack\} label="Сегодня" \/>/)
  assert.match(checkinSource, /function StreakFlower\(\)/)
  assert.match(checkinSource, /stroke="rgb\(var\(--c-gold\)\)"/)
})
