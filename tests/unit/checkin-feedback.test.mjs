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
  const feedbackSource = await readFile(
    new URL('../../src/lib/checkinFeedback.js', import.meta.url),
    'utf8'
  )
  // sendCheckinFeedback — единая функция для обоих потоков (утро и разбор),
  // вынесена из CheckIn.jsx, чтобы тестировать с подменой API.
  assert.match(feedbackSource, /export async function sendCheckinFeedback\(/)
  assert.match(feedbackSource, /catch \(feedbackError\)/)
  assert.match(feedbackSource, /console\.error\(feedbackError\)/)

  // Вечерний поток в CheckIn.jsx использует sendCheckinFeedback
  const checkinSource = await readFile(new URL('../../src/screens/CheckIn.jsx', import.meta.url), 'utf8')
  const morningFlow = checkinSource.slice(
    checkinSource.indexOf('function MorningCheckInFlow'),
    checkinSource.indexOf('// ── Чек-ин и вечерний')
  )
  assert.doesNotMatch(morningFlow, /sendCheckinFeedback/, 'утренний поток не использует sendCheckinFeedback')

  const core = checkinSource.slice(
    checkinSource.indexOf('function CheckInCore'),
    checkinSource.indexOf('function CheckIn({')
  )
  assert.match(core, /sendCheckinFeedback/, 'вечерний поток использует sendCheckinFeedback')
})
