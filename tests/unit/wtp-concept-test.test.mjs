import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

const flow = readFileSync(new URL('../../src/screens/WillingnessToPayTest.jsx', import.meta.url), 'utf8')
const settings = readFileSync(new URL('../../src/screens/Settings.jsx', import.meta.url), 'utf8')

test('MXL-WTP-001 compares three paid outcome concepts without checkout or backend', () => {
  assert.match(flow, /Problem-led track/)
  assert.match(flow, /Pattern summary/)
  assert.match(flow, /AI deepen/)
  assert.match(flow, /conversion intent|уровень интереса/)
  assert.match(flow, /доверие и границы/)
  assert.match(flow, /Завершить без оплаты/)
  assert.match(flow, /mx-wtp-concept-test-v1/)
  assert.match(flow, /window\.localStorage/)
  assert.doesNotMatch(flow, /api\./)
  assert.doesNotMatch(flow, /checkout|paymentProvider|sendData/)
})

test('MXL-WTP-001 is reachable from Settings and does not alter the Today route', () => {
  assert.match(settings, /WillingnessToPayTest/)
  assert.match(settings, /setScreen\('wtp-test'\)/)
  assert.match(settings, /Короткий concept test — без оплаты и подписки/)
  assert.doesNotMatch(settings, /Today.*wtp-test|wtp-test.*Today/)
})
