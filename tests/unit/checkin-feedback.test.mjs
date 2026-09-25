import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

import {
  CHECKIN_FEEDBACK_OPTIONS,
  checkinFeedbackValue,
} from '../../src/lib/checkinFeedback.js'

test('экран завершения предлагает ровно «Нет / Немного / Да»', () => {
  assert.deepEqual(
    CHECKIN_FEEDBACK_OPTIONS.map(option => option.label),
    ['Нет', 'Немного', 'Да']
  )
  assert.deepEqual(
    CHECKIN_FEEDBACK_OPTIONS.map(option => option.value),
    ['no', 'some', 'yes']
  )
})

test('метка кнопки превращается в значение контракта, чужая метка — в null', () => {
  assert.equal(checkinFeedbackValue('Нет'), 'no')
  assert.equal(checkinFeedbackValue('Немного'), 'some')
  assert.equal(checkinFeedbackValue('Да'), 'yes')
  assert.equal(checkinFeedbackValue('Что-то ещё'), null)
  assert.equal(checkinFeedbackValue(undefined), null)
})

test('контракт эндпоинта зафиксирован во фронте и в демо-фикстуре', async () => {
  const apiSource = await readFile(new URL('../../src/lib/api.js', import.meta.url), 'utf8')
  assert.ok(apiSource.includes('request(`/checkins/${checkinId}/feedback`'), 'api.js знает эндпоинт')
  assert.ok(apiSource.includes('body: JSON.stringify({ value })'), 'тело запроса — только value')

  const demoSource = await readFile(new URL('../../src/lib/demoMode.js', import.meta.url), 'utf8')
  assert.ok(
    demoSource.includes('/^\\/checkins\\/\\d+\\/feedback$/'),
    'демо отвечает на обратную связь без бэкенда'
  )
})

test('ошибка сети на обратной связи не пробрасывается из экрана завершения', async () => {
  const checkinSource = await readFile(new URL('../../src/screens/CheckIn.jsx', import.meta.url), 'utf8')
  const helpers = checkinSource.match(/async function sendFeedback\([\s\S]*?\n  \}/g) || []
  assert.equal(helpers.length, 2, 'sendFeedback есть в обоих потоках — утро и разбор')
  for (const helper of helpers) {
    assert.match(helper, /catch \(feedbackError\)/)
    assert.match(helper, /console\.error\(feedbackError\)/)
  }
})
