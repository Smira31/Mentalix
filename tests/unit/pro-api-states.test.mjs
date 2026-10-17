import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

/*
 * PRO-002b/c: состояния API. Отдельные понятные состояния для выключенной
 * функции (404 pro_*_disabled), отсутствия Pro (402 pro_required), согласия,
 * недостатка данных (insufficient_data), report_required/plan_required,
 * partial, генерации, ошибки и конфликтов. Ошибки двух форматов:
 * body.detail (HTTPException) и body.code (JSONResponse). После неизвестного
 * или терминального состояния бесконечной загрузки нет.
 */

const planViewSource = await readFile(
  new URL('../../src/screens/pro/ProPlanView.jsx', import.meta.url),
  'utf8'
)
const reportViewSource = await readFile(
  new URL('../../src/screens/pro/ProReportView.jsx', import.meta.url),
  'utf8'
)
const progressViewSource = await readFile(
  new URL('../../src/screens/pro/ProProgressView.jsx', import.meta.url),
  'utf8'
)
const apiStateSource = await readFile(
  new URL('../../src/screens/pro/proApiState.js', import.meta.url),
  'utf8'
)
const apiSource = await readFile(new URL('../../src/lib/api.js', import.meta.url), 'utf8')

test('ошибки обоих форматов сводятся к одному ключу', () => {
  assert.match(apiStateSource, /return error\?\.body\?\.code \|\| error\?\.body\?\.detail \|\| null/)
  for (const [name, source] of [
    ['план', planViewSource],
    ['разбор', reportViewSource],
    ['прогресс', progressViewSource],
  ]) {
    assert.match(source, /proErrorKey\(/, name)
  }
})

test('402 pro_required и 404 pro_*_disabled — отдельная карточка, а не загрузка', () => {
  assert.match(apiStateSource, /pro_required:/)
  assert.match(apiStateSource, /pro_report_disabled:/)
  assert.match(apiStateSource, /pro_plan_disabled:/)
  assert.match(apiStateSource, /pro_progress_disabled:/)
  for (const [name, source] of [
    ['план', planViewSource],
    ['разбор', reportViewSource],
    ['прогресс', progressViewSource],
  ]) {
    assert.match(source, /proBlockedState\(/, name)
    assert.match(source, /pro-blocked-state/, name)
  }
})

test('недостаток данных — отдельное состояние с тестидом', () => {
  assert.match(reportViewSource, /pro-insufficient-state/)
  assert.match(planViewSource, /pro-insufficient-state/)
})

test('неизвестный или терминальный статус не оставляет бесконечной загрузки', () => {
  assert.match(planViewSource, /pro-unknown-state/)
  assert.match(reportViewSource, /pro-unknown-state/)
  assert.match(progressViewSource, /pro-unknown-state/)
  // Известные статусы плана включают partial наравне с ready.
  assert.match(planViewSource, /'ready',\s*'partial',/)
  assert.match(progressViewSource, /'ready', 'partial'/)
})

test('plan_required и report_required выводят явный следующий шаг', () => {
  assert.match(planViewSource, /pro-plan-report-required/)
  assert.match(progressViewSource, /К плану/)
  assert.match(planViewSource, /К разбору/)
})

test('бюджет сборки и окно опроса согласованы, обещание на экранах — по бюджету', async () => {
  const pollingSource = await readFile(
    new URL('../../src/lib/proGenerationPolling.js', import.meta.url),
    'utf8'
  )
  assert.match(pollingSource, /PRO_POLL_INTERVAL_MS = 2000/)
  assert.match(pollingSource, /PRO_POLL_MAX_ATTEMPTS = 75/)
  assert.match(pollingSource, /PRO_POLL_WINDOW_MS = PRO_POLL_INTERVAL_MS \* PRO_POLL_MAX_ATTEMPTS/)
  // Запрос сборки ждёт оба вызова модели: 2 × 60 с + запас 30 с = 150 с;
  // тем же бюджетом ждёт и GET-опрос после 409 (75 попыток × 2 с).
  assert.match(apiSource, /const PRO_GENERATE_TIMEOUT_MS = 150_000/)
  assert.equal(
    (apiSource.match(/timeoutMs: PRO_GENERATE_TIMEOUT_MS/g) || []).length,
    2,
    'сборка разбора и плана ждут 150 с'
  )
  // Обещание в интерфейсе совпадает с бюджетом, а не с прежней минутой.
  assert.match(planViewSource, /это может занять до двух минут/)
  assert.match(reportViewSource, /это может занять до двух минут/)
  assert.doesNotMatch(planViewSource, /до минуты/)
  assert.doesNotMatch(reportViewSource, /до минуты/)
})
