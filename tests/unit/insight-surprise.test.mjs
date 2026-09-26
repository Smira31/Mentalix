import assert from 'node:assert/strict'
import test from 'node:test'
import { insightIntervalElapsed, shouldShowSurprise } from '../../src/screens/mentalix/surpriseRules.js'
import { visibleDailyTask } from '../../src/lib/dailyTask.js'
import { logOnce } from '../../src/lib/logOnce.js'

const today = new Date().toISOString().slice(0, 10)
const daysAgo = count => new Date(Date.parse(`${today}T00:00:00Z`) - count * 86400000).toISOString().slice(0, 10)

test('сюрприз требует находку, вероятность 30% и общий интервал 4 дня', () => {
  const findings = [{ text: 'Реальная закономерность' }]
  assert.equal(shouldShowSurprise({ today, lastDate: daysAgo(4), findings, random: () => 0.29 }), true)
  assert.equal(shouldShowSurprise({ today, lastDate: daysAgo(4), findings, random: () => 0.3 }), false)
  assert.equal(shouldShowSurprise({ today, lastDate: daysAgo(3), findings, random: () => 0 }), false)
  assert.equal(shouldShowSurprise({ today, lastDate: daysAgo(3), findings, force: true }), false)
  assert.equal(shouldShowSurprise({ today, findings: [], force: true }), false)
  assert.equal(shouldShowSurprise({ today, findings, force: true }), true)
  assert.equal(insightIntervalElapsed(today, daysAgo(1)), false)
})

test('задание скрыто при null, 404 и ошибке сети', async () => {
  const load = async request => {
    try { return visibleDailyTask(await request()) } catch { return null }
  }
  assert.equal(await load(async () => ({ task: null, status: 'new' })), null)
  assert.equal(await load(async () => { throw Object.assign(new Error('404'), { status: 404 }) }), null)
  assert.equal(await load(async () => { throw new TypeError('Network failed') }), null)
  assert.equal((await load(async () => ({ task: { id: 7, title: 'Шаг', body: 'Пара минут' }, status: 'new' }))).task.id, 7)
})

test('повторный показ и ответ не дублируют события', () => {
  const seen = { current: new Set() }
  const sent = []
  for (const key of ['shown:7', 'shown:7', 'answer:7', 'answer:7']) {
    logOnce(seen, key, () => sent.push(key))
  }
  assert.deepEqual(sent, ['shown:7', 'answer:7'])
})
