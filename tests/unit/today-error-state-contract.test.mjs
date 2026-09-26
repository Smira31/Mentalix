import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

import { withRetry, isRetryableError, RETRY_DELAYS_MS } from '../../src/lib/todayRetry.js'

const [todaySource, cacheSource] = await Promise.all([
  readFile(new URL('../../src/screens/Today.jsx', import.meta.url), 'utf8'),
  readFile(new URL('../../src/lib/todayDataCache.js', import.meta.url), 'utf8'),
])

test('Today показывает отдельное error-state и повторяет загрузку вместо empty-state', () => {
  assert.match(todaySource, /const \[loadError, setLoadError\] = useState\(false\)/)
  assert.match(todaySource, /function retryTodayData\(\)[\s\S]*invalidateTodayData\(user\.id\)[\s\S]*setReloadToken/)
  assert.match(todaySource, /if \(loadError\)[\s\S]*Сервер просыпается[\s\S]*role="alert"[\s\S]*onClick=\{retryTodayData\}/)
})

test('Критичные данные Today не подменяются fallback и не кэшируются после ошибки', () => {
  assert.match(cacheSource, /api\.rituals\.list\(userId\),/)
  assert.match(cacheSource, /api\.ascezas\.list\(userId\),/)
  assert.match(cacheSource, /api\.checkin\.today\(userId\),/)
  assert.match(cacheSource, /api\.profile\.getSettings\(userId\),/)
  assert.doesNotMatch(cacheSource, /api\.checkin\.today\(userId\)\.catch/)
  assert.doesNotMatch(cacheSource, /api\.profile\.getSettings\(userId\)\.catch/)
  assert.match(cacheSource, /Promise\.all\([\s\S]*api\.checkin\.today\(userId\),[\s\S]*\.then\(\(\[rituals, ascezas, quote, checkin, themes, settings\]\) => \{[\s\S]*cache\.set/)
})

// ── Автоповтор при сне Render ──

const noSleep = async () => {}

test('withRetry: успех на 2-й попытке → ошибки нет', async () => {
  let calls = 0
  const result = await withRetry(
    async () => {
      calls += 1
      if (calls === 1) {
        const err = new Error('timeout')
        err.kind = 'timeout'
        throw err
      }
      return 'ok'
    },
    { sleepFn: noSleep }
  )

  assert.equal(result, 'ok')
  assert.equal(calls, 2)
})

test('withRetry: все попытки неудачны → выбрасывает ошибку', async () => {
  let calls = 0
  await assert.rejects(
    withRetry(
      async () => {
        calls += 1
        const err = new Error('server down')
        err.kind = 'network'
        throw err
      },
      { sleepFn: noSleep }
    ),
    /server down/
  )
  // 1 initial + 3 retries = 4 attempts
  assert.equal(calls, RETRY_DELAYS_MS.length + 1)
})

test('withRetry: неритребельная ошибка (4xx) — сразу, без повтора', async () => {
  let calls = 0
  await assert.rejects(
    withRetry(
      async () => {
        calls += 1
        const err = new Error('bad request')
        err.status = 400
        throw err
      },
      { sleepFn: noSleep }
    ),
    /bad request/
  )
  assert.equal(calls, 1)
})

test('isRetryableError: network и timeout — повторяемые', () => {
  const networkErr = new Error('network')
  networkErr.kind = 'network'
  assert.equal(isRetryableError(networkErr), true)

  const timeoutErr = new Error('timeout')
  timeoutErr.kind = 'timeout'
  assert.equal(isRetryableError(timeoutErr), true)
})

test('isRetryableError: 5xx — повторяемые, 4xx — нет', () => {
  const serverErr = new Error('503')
  serverErr.status = 503
  assert.equal(isRetryableError(serverErr), true)

  const clientErr = new Error('400')
  clientErr.status = 400
  assert.equal(isRetryableError(clientErr), false)
})

test('RETRY_DELAYS_MS: паузы 3, 8, 20 с (общий срок ≥ 60 с)', () => {
  assert.deepEqual(RETRY_DELAYS_MS, [3_000, 8_000, 20_000])
  const totalDelay = RETRY_DELAYS_MS.reduce((sum, d) => sum + d, 0)
  // 4 попытки × 20 с (таймаут api.js × 2) + 31 с паузы = 111 с ≥ 60 с
  assert.ok(totalDelay + 4 * 20_000 >= 60_000, 'общий срок ожидания ≥ 60 с')
})

// ── Огонёк при загрузке и ошибке ──

test('Огонёк при загрузке/ошибке не серый: --empty только при streak === 0', () => {
  // streak === 0 → --empty (серый контур)
  // streak > 0 → без --empty (залитый, нормальный)
  // streak == null (загрузка, кэша нет) → без --empty (залитый, не серый)
  assert.match(
    todaySource,
    /streak === 0 \? ' mx-demo-today-streak--empty' : ''/
  )
  assert.doesNotMatch(
    todaySource,
    /streak > 0 \? '' : ' mx-demo-today-streak--empty'/
  )
})

test('Today использует fetchTodayDataWithRetry, а не fetchTodayData напрямую', () => {
  assert.match(todaySource, /import\s*\{[^}]*fetchTodayDataWithRetry/)
  assert.match(todaySource, /await fetchTodayDataWithRetry\(user\.id/)
})

test('Today будит сервер health-запросом при старте', () => {
  assert.match(todaySource, /api\.health\.check\(\)\.catch\(\(\) => \{\}\)/)
})

test('Экран ошибки: персонаж с закрытыми глазами, «Сервер просыпается», кнопка «Повторить»', () => {
  assert.match(todaySource, /cardEveningDone2x/)
  assert.match(todaySource, /Сервер просыпается/)
  assert.match(todaySource, /Обычно это меньше минуты\. Попробуй ещё раз\./)
  assert.match(todaySource, /Повторить/)
})
