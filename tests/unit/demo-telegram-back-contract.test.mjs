import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const app = await readFile(new URL('../../src/App.jsx', import.meta.url), 'utf8')
const mentalix = await readFile(new URL('../../src/screens/Mentalix.jsx', import.meta.url), 'utf8')
const today = await readFile(new URL('../../src/screens/Today.jsx', import.meta.url), 'utf8')
const practices = await readFile(new URL('../../src/screens/Practices.jsx', import.meta.url), 'utf8')

test('Demo Telegram chrome — эмуляция без пропсов, левая пилюля живёт внутри компонента', () => {
  assert.match(app, /import DemoTelegramChrome from '\.\/components\/DemoTelegramChrome'/)
  // Навигационное состояние пилюли не прокидывается из App: компонент
  // сам читает стек useBackButton (тот же источник, что BackButton).
  assert.doesNotMatch(app, /<DemoTelegramChrome [^/]*onBack/)
  assert.doesNotMatch(app, /aria-label="Закрыть превью"/)
  // Рендерится всегда, когда нужна эмуляция (без условий overlay/series/flow).
  assert.match(
    app,
    /shouldRenderDemoTelegramChrome\(\{\s*previewDemoMode,\s*platformName,\s*realPhone,\s*deviceFrameMode,\s*\}\) && \(\s*<DemoTelegramChrome \/>/
  )
})

test('вложенные экраны регистрируют системный back, chrome его не дублирует', () => {
  assert.match(app, /onRegisterBack=\{register(Today|Practices|Mentor)Back\}/)
  assert.match(mentalix, /onRegisterBack\?\.\(persona \? exitConversation : null\)/)
  assert.match(today, /onRegisterBack\?\.\(handler\)/)
  assert.match(practices, /onRegisterBack\?\.\(handler\)/)
})
