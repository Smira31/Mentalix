import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

import { demoTelegramPillState } from '../../src/lib/demoChrome.js'

const chrome = await readFile(
  new URL('../../src/components/DemoTelegramChrome.jsx', import.meta.url),
  'utf8'
)
const hooks = await readFile(new URL('../../src/platform/telegram.hooks.js', import.meta.url), 'utf8')
const css = await readFile(new URL('../../src/index.css', import.meta.url), 'utf8')

test('пилюля показывает «Назад», когда приложение показало BackButton (стек непуст)', () => {
  const pill = demoTelegramPillState(true)

  assert.equal(pill.mode, 'back')
  assert.equal(pill.label, 'Назад')
  // По тапу вызывается тот же обработчик, что у системной BackButton.
  assert.match(chrome, /onClick=\{invokeBackAction\}/)
})

test('пилюля показывает «Закрыть», когда BackButton скрыта (главные вкладки), тап ничего не делает', () => {
  const pill = demoTelegramPillState(false)

  assert.equal(pill.mode, 'close')
  assert.equal(pill.label, 'Закрыть')
  // В состоянии «Закрыть» это span, а не кнопка: кликабельной цели нет.
  assert.match(chrome, /pill\.mode === 'back'/)
  assert.match(chrome, /aria-hidden="true"/)
})

test('пилюля подписана на стек useBackButton — тот же источник, что BackButton.show()', () => {
  assert.match(chrome, /subscribeBackStack/)
  assert.match(chrome, /getCurrentBackAction/)
  assert.match(hooks, /export function subscribeBackStack/)
  assert.match(hooks, /export function invokeBackAction/)
  assert.match(hooks, /notifyBackStack\(\)/)
})

test('Home Indicator в эмуляции Telegram отсутствует', () => {
  assert.doesNotMatch(chrome, /mx-demo-telegram-chrome__home/)
  assert.doesNotMatch(css, /mx-demo-telegram-chrome__home/)
})

test('правая пилюля не кликабельна, левая — кликабельна только в состоянии «Назад»', () => {
  assert.match(css, /button\.mx-demo-telegram-chrome__pill[\s\S]*pointer-events: auto/)
  // Правая пилюля — span без обработчиков.
  assert.doesNotMatch(chrome, /pill--menu[\s\S]{0,200}onClick/)
})
