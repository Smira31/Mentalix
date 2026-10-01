import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

/*
 * UI-фундамент: пилотные экраны используют <Screen> и детали из src/components/ui/.
 * Токены отступов определены в index.css.
 */

const myThoughts = await readFile(
  new URL('../../src/screens/MyThoughtsScreen.jsx', import.meta.url),
  'utf8'
)
const dailyThoughtInput = await readFile(
  new URL('../../src/screens/DailyThoughtInput.jsx', import.meta.url),
  'utf8'
)
const practiceFieldFlow = await readFile(
  new URL('../../src/components/practices/PracticeFieldFlow.jsx', import.meta.url),
  'utf8'
)
const indexCss = await readFile(
  new URL('../../src/index.css', import.meta.url),
  'utf8'
)

test('MyThoughtsScreen использует <Screen>', () => {
  assert.match(myThoughts, /import Screen from '\.\.\/components\/Screen'/)
  assert.match(myThoughts, /<Screen[\s\S]*onBack=/)
  assert.doesNotMatch(myThoughts, /createPortal/)
  assert.doesNotMatch(myThoughts, /FULLSCREEN_SHELL_CLASS/)
})

test('MyThoughtsScreen использует детали из ui/', () => {
  assert.match(myThoughts, /import PageTitle from '\.\.\/components\/ui\/PageTitle'/)
  assert.match(myThoughts, /import CapsLabel from '\.\.\/components\/ui\/CapsLabel'/)
  assert.match(myThoughts, /import Card from '\.\.\/components\/ui\/Card'/)
})

test('DailyThoughtInput использует <Screen>', () => {
  assert.match(dailyThoughtInput, /import Screen from '\.\.\/components\/Screen'/)
  assert.match(dailyThoughtInput, /<Screen[\s\S]*onBack=/)
  assert.doesNotMatch(dailyThoughtInput, /createPortal/)
  assert.doesNotMatch(dailyThoughtInput, /FULLSCREEN_SHELL_CLASS/)
})

test('DailyThoughtInput использует CapsLabel из ui/', () => {
  assert.match(dailyThoughtInput, /import CapsLabel from '\.\.\/components\/ui\/CapsLabel'/)
})

test('PracticeFieldFlow использует <Screen>', () => {
  assert.match(practiceFieldFlow, /import Screen from '\.\.\/Screen'/)
  assert.match(practiceFieldFlow, /<Screen[\s\S]*onBack=/)
  assert.doesNotMatch(practiceFieldFlow, /createPortal/)
  assert.doesNotMatch(practiceFieldFlow, /FULLSCREEN_SHELL_CLASS/)
})

test('PracticeFieldFlow использует детали из ui/', () => {
  assert.match(practiceFieldFlow, /import CapsLabel from '\.\.\/ui\/CapsLabel'/)
  assert.match(practiceFieldFlow, /import JournalField from '\.\.\/ui\/JournalField'/)
  assert.match(practiceFieldFlow, /import RoundNextButton from '\.\.\/ui\/RoundNextButton'/)
})

test('токены отступов определены в index.css', () => {
  const tokens = [
    '--mx-space-1: 4px',
    '--mx-space-2: 8px',
    '--mx-space-3: 12px',
    '--mx-space-4: 16px',
    '--mx-space-5: 20px',
    '--mx-space-6: 24px',
    '--mx-space-7: 28px',
    '--mx-space-8: 32px',
    '--mx-space-10: 40px',
    '--mx-space-12: 48px',
  ]
  for (const token of tokens) {
    assert.match(indexCss, new RegExp(token.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')))
  }
})

test('токены радиусов определены в index.css', () => {
  const tokens = [
    '--mx-radius-xs: 14px',
    '--mx-radius-control: 16px',
    '--mx-radius-md: 20px',
    '--mx-radius-card: 24px',
    '--mx-radius-lg: 28px',
    '--mx-radius-hero: 32px',
    '--mx-radius-pill: 999px',
  ]
  for (const token of tokens) {
    assert.match(indexCss, new RegExp(token.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')))
  }
})

test('токены высот кнопок определены в index.css', () => {
  assert.match(indexCss, /--mx-btn-pill-h: 54px/)
  assert.match(indexCss, /--mx-btn-round-h: 45px/)
  assert.match(indexCss, /--mx-btn-glass-h: 49px/)
})

test('токен верхнего отступа экрана определён в index.css', () => {
  assert.match(indexCss, /--mx-screen-top: calc\(var\(--app-safe-top\) \+ 56px \+ 16px\)/)
})
