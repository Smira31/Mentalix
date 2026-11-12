import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const flow = await readFile(
  new URL('../../src/screens/Daimon/DaimonFlow.jsx', import.meta.url),
  'utf8'
)
const demo = await readFile(new URL('../../src/lib/demoMode.js', import.meta.url), 'utf8')

/*
 * Pro без лимита (mentalix-bot #254): throws_limit = null, throws_unlimited = true.
 * Старый ответ без поля и с числом должен остаться прежним.
 */

test('без лимита распознаётся по throws_unlimited === true или throws_limit == null', () => {
  assert.match(
    flow,
    /const throwsUnlimited = Boolean\(\s*gameState\?\.game &&[\s\S]*?gameState\.game\.throws_unlimited === true \|\| gameState\.game\.throws_limit == null/
  )
})

test('кнопка броска активна без лимита, но остаётся блокируемой при rolling', () => {
  assert.match(flow, /disabled=\{\(!throwsUnlimited && throwsLeft <= 0\) \|\| rolling\}/)
})

test('строка остатка без лимита — «Сегодня без лимита бросков»', () => {
  assert.match(flow, /throwsUnlimited\s*\?\s*'Сегодня без лимита бросков'/)
})

test('с числовым лимитом остаток и блокировка остались прежними', () => {
  assert.match(flow, /`Осталось бросков сегодня: \$\{throwsLeft\}`/)
  assert.match(flow, /'На сегодня всё\. Возвращайся завтра — Даймон подождёт\.'/)
  assert.match(
    flow,
    /const throwsLeft =\s*gameState\?\.game && !throwsUnlimited\s*\?\s*gameState\.game\.throws_limit - gameState\.game\.throws_today\s*:\s*0/
  )
})

test('HelpView без лимита показывает формулировку без числа', () => {
  assert.match(flow, /Бросков в день — без лимита/)
  assert.match(flow, /unlimited=\{throwsUnlimited\}/)
})

test('демо-режим содержит Pro без лимита, Free остаётся с тремя бросками', () => {
  assert.match(demo, /'proUnlimited'/)
  assert.match(
    demo,
    /mode === 'proUnlimited'\)\s*\{\s*return \{ \.\.\.base, throws_today: 7, throws_limit: null, throws_unlimited: true \}/
  )
  // Создание обычной игры (Free) по-прежнему с лимитом 3.
  assert.match(demo, /throws_today: 0,\s*throws_limit: 3,/)
})

test('демо-бросок не блокируется дневным счётчиком при безлимите', () => {
  assert.match(
    demo,
    /const unlimitedThrows = game\.throws_unlimited === true \|\| game\.throws_limit == null/
  )
  assert.match(demo, /if \(!unlimitedThrows && game\.throws_today >= game\.throws_limit\)/)
})
