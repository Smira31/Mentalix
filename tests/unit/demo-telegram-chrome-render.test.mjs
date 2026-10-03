import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const chrome = await readFile(
  new URL('../../src/components/DemoTelegramChrome.jsx', import.meta.url),
  'utf8'
)
const app = await readFile(new URL('../../src/App.jsx', import.meta.url), 'utf8')

test('эмуляция Telegram рендерится в demo-режиме: статус-бар, обе пилюли, без Home Indicator', () => {
  // Статус-бар: время + системные иконки.
  assert.match(chrome, /className="mx-demo-telegram-chrome__status"/)
  assert.match(chrome, /mx-demo-telegram-chrome__time/)
  assert.match(chrome, /mx-demo-telegram-chrome__status-icons/)

  // Обе пилюли: «✕ Закрыть»/«‹ Назад» и «⌄ •••» без разделителя.
  assert.match(chrome, /className="mx-demo-telegram-chrome__pill"/)
  assert.match(chrome, /mx-demo-telegram-chrome__pill mx-demo-telegram-chrome__pill--menu/)
  assert.match(chrome, /Закрыть/)
  assert.match(chrome, /Назад/)
  assert.doesNotMatch(chrome, /mx-demo-telegram-chrome__pill-divider/)

  // Home Indicator убран полностью.
  assert.doesNotMatch(chrome, /mx-demo-telegram-chrome__home/)

  // Компонент подключён в App; вложенная Библиотека рисует его через Screen.
  assert.match(app, /import DemoTelegramChrome from '\.\/components\/DemoTelegramChrome'/)
  assert.match(
    app,
    /!libraryInputMode\s*&&\s*shouldRenderDemoTelegramChrome\(\{\s*previewDemoMode,\s*platformName,\s*realPhone,\s*deviceFrameMode,\s*\}\)\s*&&\s*<DemoTelegramChrome \/>/
  )
})
