import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

import { PRO_REVIEW_PLAN_ENABLED } from '../../src/lib/proFlag.js'
import { isProMockMode } from '../../src/lib/proMock.js'

/*
 * PRO-002b/c: фронтенд-контракт. Проверяет, что api.js использует
 * фактические роуты backend/pro/router.py, что флаг фичи по умолчанию
 * выключен и что mock-режим вне браузера (production-условия) не включается.
 */

const apiSource = await readFile(new URL('../../src/lib/api.js', import.meta.url), 'utf8')

test('разбор недели: фактические роуты GET/POST /api/pro/report', () => {
  assert.match(apiSource, /getReport: weekStart =>/)
  assert.match(apiSource, /withQuery\('\/pro\/report'/)
  assert.match(apiSource, /request\('\/pro\/report', \{/)
})

test('план недели: GET/POST /api/pro/plan, PATCH и статус пункта', () => {
  assert.match(apiSource, /withQuery\('\/pro\/plan'/)
  assert.match(apiSource, /request\('\/pro\/plan', \{/)
  assert.match(apiSource, /request\(`\/pro\/plan\/\$\{itemId\}`, \{/)
  assert.match(apiSource, /request\(`\/pro\/plan\/\$\{itemId\}\/status`, \{/)
  assert.match(apiSource, /patchPlanItem: \(itemId, patch\)/)
})

test('прогресс: GET /api/pro/progress без AI-вызова', () => {
  assert.match(apiSource, /withQuery\('\/pro\/progress'/)
})

test('запросы передают week_start только когда он задан', () => {
  assert.match(apiSource, /weekStart \? \{ week_start: weekStart \} : \{\}/)
})

test('флаг фичи по умолчанию выключен', () => {
  assert.equal(PRO_REVIEW_PLAN_ENABLED, false)
})

test('mock-режим вне браузера не включается', () => {
  assert.equal(isProMockMode(), false)
})
