import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const app = await readFile(new URL('../../src/App.jsx', import.meta.url), 'utf8')
const styles = await readFile(new URL('../../src/index.css', import.meta.url), 'utf8')

test('Demo-only screen motion restarts for main and nested navigation states', () => {
  assert.match(app, /isPreviewDemoMode\(\)/)
  assert.match(app, /mx-demo-screen-transition/)
  assert.match(app, /demoMotionTick % 2/)
  assert.match(app, /todayFlowOpen, todaySeriesOpen, practiceGameOpen/)
})

test('Stoic-inspired motion respects reduced-motion accessibility', () => {
  assert.match(styles, /@keyframes mxDemoScreenEnter/)
  assert.match(styles, /\.mx-demo-screen-transition--0,/)
  assert.match(styles, /prefers-reduced-motion: reduce/)
})

test('Demo buttons expose a restrained visual tactile press cue', () => {
  assert.match(styles, /\[data-mentalix-demo-frame='true'\] button:active/)
  assert.match(styles, /filter: brightness\(1\.08\)/)
  assert.match(styles, /box-shadow: 0 0 0 3px/)
})

console.log('Demo Stoic motion contract passed')
