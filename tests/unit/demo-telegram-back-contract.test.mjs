import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const app = await readFile(new URL('../../src/App.jsx', import.meta.url), 'utf8')
const mentalix = await readFile(new URL('../../src/screens/Mentalix.jsx', import.meta.url), 'utf8')
const today = await readFile(new URL('../../src/screens/Today.jsx', import.meta.url), 'utf8')
const practices = await readFile(new URL('../../src/screens/Practices.jsx', import.meta.url), 'utf8')

test('Demo Telegram chrome exposes Back for nested product screens', () => {
  assert.match(app, /function DemoTelegramChrome\(\{ onBack \}\)/)
  assert.match(app, /aria-label=\{hasBack \? 'Назад' : 'Закрыть превью'\}/)
  assert.match(app, /<DemoTelegramChrome onBack=\{demoBackAction\} \/>/)
  assert.match(app, /onRegisterBack=\{handler => \{/)
  assert.match(mentalix, /onRegisterBack\?\.\(persona \? exitConversation : null\)/)
  assert.match(today, /onRegisterBack\?\.\(handler\)/)
  assert.match(practices, /onRegisterBack\?\.\(handler\)/)
})
