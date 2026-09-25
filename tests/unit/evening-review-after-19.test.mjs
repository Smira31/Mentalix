import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { formatReviewTime, resolveTodayCardStates } from '../../src/lib/todayCardState.js'

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

const post = (path, body) => demoRequest(path, { method: 'POST', body: JSON.stringify(body) })
const get = path => demoRequest(path, { method: 'GET' })

// Даты — только относительно текущего дня (локальное время).
function todayAt(hour, minute = 0) {
  const date = new Date()
  date.setHours(hour, minute, 0, 0)
  return date
}

test('разбор закрыт до 19:00 и открыт после', () => {
  assert.equal(resolveTodayCardStates({ now: todayAt(18, 59) }).review, 'locked')
  assert.equal(resolveTodayCardStates({ now: todayAt(19, 0) }).review, 'active')
  assert.equal(resolveTodayCardStates({ now: todayAt(21, 30) }).review, 'active')
})

test('подпись «Откроется в» — 19:00 по умолчанию, время из настроек, никогда не 24:00', () => {
  assert.equal(formatReviewTime(), '19:00')
  assert.equal(formatReviewTime(21), '21:00')
  assert.equal(formatReviewTime(24), '19:00')
  assert.equal(formatReviewTime(0), '19:00')
  assert.equal(formatReviewTime(undefined), '19:00')
})

test('демо: карточка разбора пишет «Откроется в 19:00», а после смены настройки — её время', async () => {
  freshDemoStorage()
  const settings = await get('/profile/settings')
  assert.equal(`Откроется в ${formatReviewTime(settings.review_hour)}`, 'Откроется в 19:00')

  await post('/profile/settings', { user_id: 900001, review_hour: 21 })
  const updated = await get('/profile/settings')
  assert.equal(`Откроется в ${formatReviewTime(updated.review_hour)}`, 'Откроется в 21:00')
})

test('вечерний разбор отправляет выбранную эмоцию в сохранение', async () => {
  const source = await readFile(new URL('../../src/screens/CheckIn.jsx', import.meta.url), 'utf8')
  assert.match(source, /onEmotionChange=\{setEmotion\}/)
  assert.match(source, /const corePayload = \{[\s\S]*?\n\s+emotion,\n[\s\S]*?review_completed: true/)
})

test('демо: «Эмоции» разбора сохраняются в сегодняшнюю запись и видны в Истории', async () => {
  freshDemoStorage()
  await post('/checkin', { mood: 4, energy: 3, note: 'Утро.' })
  const saved = await post('/checkin', {
    mood: 4,
    energy: 3,
    emotion: 'спокойно',
    lessons: 'Что получилось? Разобрать день',
    review_completed: true,
  })
  assert.equal(saved.emotion, 'спокойно')
  assert.ok(saved.review_completed_at)

  const today = await get('/checkin/today')
  assert.equal(today.emotion, 'спокойно')
  assert.equal(today.note, 'Утро.')

  // История группирует записи по дате: за сегодня должна быть одна запись — с эмоцией разбора.
  const history = await get('/checkin/history')
  const todays = history.filter(item => item.date === saved.date)
  assert.equal(todays.length, 1)
  assert.equal(todays[0].emotion, 'спокойно')
})
