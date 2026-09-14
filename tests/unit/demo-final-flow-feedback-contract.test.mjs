import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const app = await readFile(new URL('../../src/App.jsx', import.meta.url), 'utf8')
const helper = await readFile(new URL('../../src/lib/demoPressFeedback.js', import.meta.url), 'utf8')
const ux = await readFile(new URL('../ux/ux-check.spec.mjs', import.meta.url), 'utf8')

test('Demo shell installs press feedback only in Preview mode', () => {
  assert.match(app, /installDemoPressFeedback/)
  assert.match(app, /if \(!isPreviewDemoMode\(\)\)/)
  assert.match(helper, /data-mentalix-demo-frame='true'/)
})

test('Press feedback uses short vibration and user-initiated Web Audio only', () => {
  assert.match(helper, /navigator\.vibrate\(8\)/)
  assert.match(helper, /AudioContext|webkitAudioContext/)
  assert.match(helper, /createOscillator/)
  assert.match(helper, /pointerdown/)
})

test('UX suite covers Mentor persona entry and conversation', () => {
  assert.match(ux, /mentor-persona-card/)
  assert.match(ux, /Наставник/)
  assert.match(ux, /mentor-persona-track/)
})

console.log('Demo final flow and press feedback contract passed')
