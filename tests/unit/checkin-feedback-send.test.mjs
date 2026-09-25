import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

import {
  CHECKIN_FEEDBACK_OPTIONS,
  checkinFeedbackValue,
  sendCheckinFeedback,
} from '../../src/lib/checkinFeedback.js'

// ──────────────────────────────────────────────────────────────
// Подмена API: фиксируем вызовы вместо реального запроса.
// ──────────────────────────────────────────────────────────────

function createMockApi() {
  const calls = []
  const feedbackApi = (checkinId, value) => {
    calls.push({ checkinId, value })
    return Promise.resolve({ ok: true })
  }
  const feedbackApiThrow = (checkinId, value) => {
    calls.push({ checkinId, value })
    return Promise.reject(new Error('network'))
  }
  return { calls, feedbackApi, feedbackApiThrow }
}

// ──────────────────────────────────────────────────────────────
// 1. Чистая функция sendCheckinFeedback — поведенческие тесты
//    с подменой API на каждый путь.
// ──────────────────────────────────────────────────────────────

test('первый проход: «Да» → POST /api/checkins/{id}/feedback с правильным id и телом {value:"yes"}', async () => {
  const { calls, feedbackApi } = createMockApi()
  const savedId = 38

  await sendCheckinFeedback(feedbackApi, savedId, 'Да')

  assert.equal(calls.length, 1, 'один вызов feedback')
  assert.equal(calls[0].checkinId, 38, 'id сохранённого чек-ина')
  assert.equal(calls[0].value, 'yes', 'тело {value:"yes"}')
})

test('«Пройти заново» (обновление существующего): «Да» → POST с id из ответа redo', async () => {
  const { calls, feedbackApi } = createMockApi()
  const savedId = 38

  await sendCheckinFeedback(feedbackApi, savedId, 'Да')

  assert.equal(calls.length, 1)
  assert.equal(calls[0].checkinId, 38)
  assert.equal(calls[0].value, 'yes')
})

test('ночь 00:00–04:59 (redo вчерашнего): «Да» → POST с id записи', async () => {
  const { calls, feedbackApi } = createMockApi()
  const savedId = 38

  await sendCheckinFeedback(feedbackApi, savedId, 'Да')

  assert.equal(calls.length, 1)
  assert.equal(calls[0].checkinId, 38)
  assert.equal(calls[0].value, 'yes')
})

test('вечерний первый проход: «Немного» → POST с id и телом {value:"some"}', async () => {
  const { calls, feedbackApi } = createMockApi()
  const savedId = 42

  await sendCheckinFeedback(feedbackApi, savedId, 'Немного')

  assert.equal(calls.length, 1)
  assert.equal(calls[0].checkinId, 42)
  assert.equal(calls[0].value, 'some')
})

test('вечерний redo: «Нет» → POST с id и телом {value:"no"}', async () => {
  const { calls, feedbackApi } = createMockApi()
  const savedId = 42

  await sendCheckinFeedback(feedbackApi, savedId, 'Нет')

  assert.equal(calls.length, 1)
  assert.equal(calls[0].checkinId, 42)
  assert.equal(calls[0].value, 'no')
})

// ──────────────────────────────────────────────────────────────
// 2. Если id нет (ответ сохранения без id) — запрос не уходит молча
// ──────────────────────────────────────────────────────────────

test('id нет, но оценка выбрана — запрос не уходит, ошибка видна через console.error', async () => {
  const { calls, feedbackApi } = createMockApi()
  const originalError = console.error
  const errors = []
  console.error = (...args) => errors.push(args)

  try {
    await sendCheckinFeedback(feedbackApi, null, 'Да')

    assert.equal(calls.length, 0, 'запрос не ушёл')
    assert.ok(errors.length > 0, 'ошибка залогирована — не молча')
    assert.match(
      String(errors[0]),
      /нет id сохранённого чек-ина/,
      'диагностика содержит причину'
    )
  } finally {
    console.error = originalError
  }
})

test('id есть, но label не распознан — запрос не уходит, ошибки нет', async () => {
  const { calls, feedbackApi } = createMockApi()

  await sendCheckinFeedback(feedbackApi, 38, 'Что-то другое')

  assert.equal(calls.length, 0, 'запрос не ушёл — чужая метка')
})

// ──────────────────────────────────────────────────────────────
// 3. Ошибка сети — не пробрасывается, логируется через console.error
// ──────────────────────────────────────────────────────────────

test('ошибка сети на feedback — не пробрасывается, логируется', async () => {
  const { calls, feedbackApiThrow } = createMockApi()
  const originalError = console.error
  const errors = []
  console.error = (...args) => errors.push(args)

  try {
    await sendCheckinFeedback(feedbackApiThrow, 38, 'Да')

    assert.equal(calls.length, 1, 'запрос ушёл, но упал')
    assert.ok(errors.length > 0, 'ошибка залогирована')
  } finally {
    console.error = originalError
  }
})

// ──────────────────────────────────────────────────────────────
// 4. Проверка проводки: экран «Готово. Было полезно?» показывается
//    и sendCheckinFeedback вызывается на каждом пути в CheckIn.jsx
// ──────────────────────────────────────────────────────────────

let checkinSource = null

async function getSource() {
  if (!checkinSource) {
    checkinSource = await readFile(
      new URL('../../src/screens/CheckIn.jsx', import.meta.url),
      'utf8'
    )
  }
  return checkinSource
}

test('экран завершения содержит «Готово.» и «Было полезно?»', async () => {
  const src = await getSource()
  assert.match(src, /Готово\./)
  assert.match(src, /Было полезно\?/)
  assert.match(src, /data-testid="checkin-feedback-option"/)
})

test('утренний первый проход: finish() вызывает sendCheckinFeedback после save (не redo)', async () => {
  const src = await getSource()
  const morningFlow = src.slice(
    src.indexOf('function MorningCheckInFlow'),
    src.indexOf('// ── Чек-ин и вечерний')
  )

  // sendCheckinFeedback импортирован
  assert.match(morningFlow, /sendCheckinFeedback/, 'утренний поток использует sendCheckinFeedback')

  // В не-redo ветке finish() вызывает sendCheckinFeedback
  const finishFn = morningFlow.slice(morningFlow.indexOf('async function finish()'))
  assert.match(finishFn, /sendCheckinFeedback/, 'finish() вызывает sendCheckinFeedback')
})

test('утренний «Пройти заново»: redo-ветка finish() вызывает sendCheckinFeedback до onDone()', async () => {
  const src = await getSource()
  const morningFlow = src.slice(
    src.indexOf('function MorningCheckInFlow'),
    src.indexOf('// ── Чек-ин и вечерний')
  )

  const finishFn = morningFlow.slice(morningFlow.indexOf('async function finish()'))

  // Извлекаем redo-ветку
  const redoBranch = finishFn.slice(finishFn.indexOf('if (redo)'))

  // sendCheckinFeedback должен быть вызван ДО onDone() в redo-ветке
  const feedbackPos = redoBranch.indexOf('sendCheckinFeedback')
  const onDonePos = redoBranch.indexOf('onDone()')

  assert.ok(feedbackPos !== -1, 'redo-ветка вызывает sendCheckinFeedback')
  assert.ok(onDonePos !== -1, 'redo-ветка вызывает onDone()')
  assert.ok(
    feedbackPos < onDonePos,
    'sendCheckinFeedback вызывается ДО onDone() — иначе оценка теряется'
  )
})

test('вечерний поток: экран завершения вызывает sendCheckinFeedback по клику на кнопку', async () => {
  const src = await getSource()
  const core = src.slice(
    src.indexOf('function CheckInCore'),
    src.indexOf('function CheckIn({')
  )

  // sendCheckinFeedback импортирован и используется в вечернем потоке
  assert.match(core, /sendCheckinFeedback/, 'вечерний поток использует sendCheckinFeedback')

  // Клик по кнопке обратной связи вызывает sendCheckinFeedback
  assert.match(core, /sendCheckinFeedback\(/)
})

test('ночь 00:00–04:59: ночная логика ведёт через redoCheckin → MorningCheckInFlow с redo', async () => {
  const todaySource = await readFile(
    new URL('../../src/screens/Today.jsx', import.meta.url),
    'utf8'
  )

  // redoCheckin рендерит CheckIn с redo
  const redoBlock = todaySource.slice(
    todaySource.indexOf("sub === 'redoCheckin'"),
    todaySource.indexOf("sub === 'redoReview'")
  )
  assert.match(redoBlock, /redo/, 'redoCheckin передаёт redo={true}')
  assert.match(redoBlock, /mode="checkin"/, 'redoCheckin — утренний режим')

  // Ночная карта (isNight) ведёт в checkinRecap → redoCheckin
  const cardStateSource = await readFile(
    new URL('../../src/lib/todayCardState.js', import.meta.url),
    'utf8'
  )
  assert.match(cardStateSource, /isNight = hour < 5/, 'ночь определена как 00:00–04:59')
})
