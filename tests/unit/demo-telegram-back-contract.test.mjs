import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const app = await readFile(new URL('../../src/App.jsx', import.meta.url), 'utf8')
const mentalix = await readFile(new URL('../../src/screens/Mentalix.jsx', import.meta.url), 'utf8')
const today = await readFile(new URL('../../src/screens/Today.jsx', import.meta.url), 'utf8')
const practices = await readFile(
  new URL('../../src/screens/Practices.jsx', import.meta.url),
  'utf8'
)

test('Demo Telegram chrome — эмуляция без пропсов, левая пилюля живёт внутри компонента', () => {
  assert.match(app, /import DemoTelegramChrome from '\.\/components\/DemoTelegramChrome'/)
  // Навигационное состояние пилюли не прокидывается из App: компонент
  // сам читает стек useBackButton (тот же источник, что BackButton).
  assert.doesNotMatch(app, /<DemoTelegramChrome [^/]*onBack/)
  assert.doesNotMatch(app, /aria-label="Закрыть превью"/)
  // Вложенная Библиотека владеет своей шапкой; остальные вкладки как раньше.
  assert.match(
    app,
    /!libraryInputMode\s*&&\s*shouldRenderDemoTelegramChrome\(\{\s*previewDemoMode,\s*platformName,\s*realPhone,\s*deviceFrameMode,\s*\}\)\s*&&\s*<DemoTelegramChrome \/>/
  )
})

test('вложенные экраны регистрируют системный back, chrome его не дублирует', () => {
  assert.match(app, /onRegisterBack=\{register(Today|Practices|Mentor)Back\}/)
  assert.match(mentalix, /onRegisterBack\?\.\(persona \? exitConversation : null\)/)
  assert.match(today, /onRegisterBack\?\.\(handler\)/)
  // Practices не регистрирует back через onRegisterBack: каждый экран держит один useBackButton.
  assert.doesNotMatch(practices, /onRegisterBack\?\.\(/)
})
