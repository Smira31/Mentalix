import test from 'node:test'
import assert from 'node:assert/strict'

import { eveningMorningFields } from '../../src/lib/checkinMorningFields.js'

// Запись дня делится на утреннюю половину (настроение, энергия, «Что на уме?»)
// и вечернюю (эмоция, уроки, закрытие дня). Повторный проход одной половины
// не должен менять другую — ни в демо-режиме, ни в payload для сервера.

function memoryStorage() {
  const map = new Map()
  return {
    getItem: key => (map.has(key) ? map.get(key) : null),
    setItem: (key, value) => map.set(key, String(value)),
    removeItem: key => map.delete(key),
  }
}

function freshDemoStorage() {
  globalThis.localStorage = memoryStorage()
  globalThis.sessionStorage = memoryStorage()
}

freshDemoStorage()
const { demoRequest } = await import('../../src/lib/demoMode.js')

const send = (path, method, body) => demoRequest(path, { method, body: JSON.stringify(body) })
const today = () => demoRequest('/checkin/today', { method: 'GET' })

const USER_ID = 900001
const MORNING_NOTE = 'Думаю о важном разговоре'

// Payload вечера так, как его собирает CheckInCore.submit: values — состояние
// шкал компонента (в redo поля пустые, anxiety/focus перенесены из записи).
function eveningPayload({ values, existing, emotion, lessons }) {
  const morning = eveningMorningFields(existing, values)
  const payload = {
    user_id: USER_ID,
    mood: morning.mood ?? 3,
    energy: morning.energy ?? 3,
    note: morning.note,
    emotion,
    lessons,
    review_completed: true,
  }
  if (morning.anxiety != null) payload.anxiety = morning.anxiety
  if (morning.focus != null) payload.focus = morning.focus
  return payload
}

async function morningFirstPass() {
  return send('/checkin', 'POST', { user_id: USER_ID, mood: 5, energy: 1, note: MORNING_NOTE })
}

test('утро 5/1 → вечер → вечер заново: утренние настроение, энергия и «Что на уме?» не меняются', async () => {
  freshDemoStorage()
  await morningFirstPass()

  const afterMorning = await today()
  const firstEvening = eveningPayload({
    values: { mood: afterMorning.mood, energy: afterMorning.energy, anxiety: null, focus: null },
    existing: afterMorning,
    emotion: 'спокойно',
    lessons: 'Что получилось? Первый вечер',
  })
  await send('/checkin', 'POST', firstEvening)

  const afterEvening = await today()
  assert.equal(afterEvening.mood, 5)
  assert.equal(afterEvening.energy, 1)

  // «Пройти заново»: CheckInCore стартует с пустыми шкалами.
  const redoEvening = eveningPayload({
    values: { mood: null, energy: null, anxiety: null, focus: null },
    existing: afterEvening,
    emotion: 'радость',
    lessons: 'Что получилось? Второй вечер',
  })
  assert.equal(redoEvening.mood, 5, 'payload повторного вечера несёт утреннее настроение')
  assert.equal(redoEvening.energy, 1, 'payload повторного вечера несёт утреннюю энергию')
  await send('/checkin/today', 'PUT', redoEvening)

  const afterRedo = await today()
  assert.equal(afterRedo.mood, 5, 'настроение утра осталось 5')
  assert.equal(afterRedo.energy, 1, 'энергия утра осталась 1')
  assert.equal(afterRedo.note, MORNING_NOTE, '«Что на уме?» осталось')
  assert.equal(afterRedo.emotion, 'радость', 'вечерние поля обновились')
  assert.equal(afterRedo.lessons, 'Что получилось? Второй вечер')
  assert.ok(afterRedo.review_completed_at, 'день остаётся закрытым')
})

test('утро заново не стирает вечерние поля (демо)', async () => {
  freshDemoStorage()
  await morningFirstPass()
  const afterMorning = await today()
  await send(
    '/checkin',
    'POST',
    eveningPayload({
      values: { mood: 5, energy: 1, anxiety: null, focus: null },
      existing: afterMorning,
      emotion: 'спокойно',
      lessons: 'Что получилось? Вечер',
    })
  )
  const afterEvening = await today()

  // Payload MorningCheckInFlow в redo: только утренние поля.
  await send('/checkin/today', 'PUT', { user_id: USER_ID, mood: 2, energy: 4, note: 'Новая мысль' })

  const afterRedo = await today()
  assert.equal(afterRedo.mood, 2)
  assert.equal(afterRedo.energy, 4)
  assert.equal(afterRedo.note, 'Новая мысль')
  assert.equal(afterRedo.emotion, 'спокойно', 'эмоция разбора осталась')
  assert.equal(afterRedo.lessons, 'Что получилось? Вечер', 'уроки разбора остались')
  assert.equal(
    afterRedo.review_completed_at,
    afterEvening.review_completed_at,
    'день остаётся закрытым'
  )
  assert.equal(afterRedo.id, afterEvening.id, 'та же запись дня')
})

test('без записи дня вечер отправляет ответы своих шкал', () => {
  const morning = eveningMorningFields(null, { mood: 4, energy: 2, anxiety: null, focus: null })
  assert.equal(morning.mood, 4)
  assert.equal(morning.energy, 2)
  assert.equal(morning.note, undefined)
})
