import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const checkinSource = await readFile(new URL('../../src/screens/CheckIn.jsx', import.meta.url), 'utf8')
const demoModeSource = await readFile(new URL('../../src/lib/demoMode.js', import.meta.url), 'utf8')
const apiSource = await readFile(new URL('../../src/lib/api.js', import.meta.url), 'utf8')


test('the morning visual flow is the default check-in entry point', () => {
  assert.match(checkinSource, /function MorningCheckInFlow\(\{ user, onDone \}\)/)
  assert.match(checkinSource, /if \(mode !== 'evening'\) \{\s*return <MorningCheckInFlow user=\{user\} onDone=\{onDone\} \/>/s)
  assert.doesNotMatch(checkinSource, /if \(previewDemoMode && mode !== 'evening'\)/)
})

test('the legacy core remains available for evening review and rollback', () => {
  assert.match(checkinSource, /function CheckInCore\(\{ user, onDone, mode = 'checkin', existing = null \}\)/)
  assert.match(checkinSource, /return <CheckInCore user=\{user\} onDone=\{onDone\} mode=\{mode\} existing=\{existing\} \/>/)
})

test('the default morning flow persists real user data through the check-in API', () => {
  const morningFlow = checkinSource.slice(
    checkinSource.indexOf('function MorningCheckInFlow'),
    checkinSource.indexOf('// ── Чек-ин и вечерний')
  )
  assert.match(morningFlow, /api\.checkin\.save\(user\.id, \{/)
  assert.match(morningFlow, /mood: values\.mood \|\| 3/)
  assert.match(morningFlow, /energy: values\.energy \|\| 3/)
  assert.match(morningFlow, /focus: values\.focus \|\| 3/)
  assert.match(morningFlow, /note: note\.trim\(\) \|\| undefined/)
  assert.match(morningFlow, /api\.checkin\.history\(user\.id, 90\)/)
  assert.match(apiSource, /checkin: \{[\s\S]*?save: \(/)
  assert.match(apiSource, /request\('\/checkin', \{[\s\S]*?method: 'POST'/)
})

test('seeded demo state remains opt-in and isolated in the API wrapper', () => {
  assert.match(demoModeSource, /const demoRequested = params\.get\('demo'\) === '1'/)
  assert.match(demoModeSource, /const pwaDemoRequested = params\.get\('source'\) === 'pwa'/)
  assert.match(demoModeSource, /return \(\s*\(demoRequested \|\| pwaDemoRequested\)/s)
  assert.match(apiSource, /if \(isPreviewDemoMode\(\)\) return demoRequest\(path, options\)/)
})
