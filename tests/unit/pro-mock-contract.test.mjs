import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

/*
 * PRO-002b/c: mock соответствует фактическому контракту backend
 * (backend/pro/router.py). Правка общей цели повышает версии всех
 * изменённых дней; сценарий generation_in_progress действительно
 * завершается готовым результатом через GET, без повторного POST;
 * сценарии version_conflict и rebuild_conflict детерминированы;
 * mock недоступен в production-сборке.
 */

const mockSource = await readFile(new URL('../../src/lib/proMock.js', import.meta.url), 'utf8')

test('mock недоступен в production-сборке', () => {
  assert.match(mockSource, /import\.meta\.env\?\.PROD\) return false/)
  assert.match(mockSource, /import\.meta\.env\?\.DEV === true \|\| import\.meta\.env\?\.VITE_LOCAL_PREVIEW === 'true'/)
})

test('сценарии покрывают конфликт генерации, версии и пересборки', () => {
  assert.match(
    mockSource,
    /'conflict',\s*'version_conflict',\s*'rebuild_conflict',\s*'insufficient',\s*'crisis',\s*'disabled',\s*'nopro'/
  )
})

test('правка общей цели повышает версии всех дней, правка дня — только его', () => {
  // Цель: версия растёт у всех дней внутри цикла.
  assert.match(
    mockSource,
    /for \(const day of state\.plan\.days\) \{\s*if \(body\.goal_text != null\) day\.goal_text = body\.goal_text\s*if \(body\.goal_source_reflection != null\) day\.goal_reflection = body\.goal_source_reflection\s*day\.version \+= 1/
  )
  // Без цели: только изменённый день.
  assert.match(mockSource, /\} else \{\s*item\.version \+= 1\s*\}/)
})

test('сценарий conflict завершается готовым результатом через GET, без повторного POST', () => {
  assert.match(mockSource, /const pendingGeneration = \{ report: 0, plan: 0 \}/)
  assert.match(mockSource, /function conflictPost\(kind, finalize\)/)
  // GET при истёкшем окне завершает сборку готовым результатом.
  const reportGet = mockSource.match(
    /pathname === '\/pro\/report' && method === 'GET'[\s\S]{0,1400}?\n  \}/
  )?.[0]
  assert.ok(reportGet, 'GET разбора найден')
  assert.match(reportGet, /pendingGeneration\.report/)
  assert.match(reportGet, /status: 'not_generated'/)
  assert.match(reportGet, /status: 'ready', report: state\.report/)
  const planGet = mockSource.match(
    /pathname === '\/pro\/plan' && method === 'GET'[\s\S]{0,1200}?\n  \}/
  )?.[0]
  assert.ok(planGet, 'GET плана найден')
  assert.match(planGet, /pendingGeneration\.plan/)
  assert.match(planGet, /status: 'ready', plan: serializePlan\(state\)/)
  // POST внутри окна не перезапускает сборку и отвечает 409.
  assert.match(mockSource, /if \(!readyAt\) pendingGeneration\[kind\] = Date\.now\(\) \+ MOCK_GENERATION_MS/)
})

test('детерминированные сценарии version_conflict и rebuild_conflict', () => {
  assert.match(
    mockSource,
    /if \(scenario === 'version_conflict'\) \{\s*throw new MockApiError\(409, \{ detail: 'version_conflict' \}\)/
  )
  const rebuildBlock = mockSource.match(
    /scenario === 'rebuild_conflict' && body\.rebuild === true[\s\S]{0,600}?throw new MockApiError\(409, \{[\s\S]{0,400}\}\)/
  )?.[0]
  assert.ok(rebuildBlock, 'ветка rebuild_conflict найдена')
  assert.match(rebuildBlock, /code: 'rebuild_conflict'/)
  assert.match(rebuildBlock, /plan: serializePlan\(state\)/)
})

test('ошибки mock имеют оба формата: detail (HTTPException) и code (JSONResponse)', () => {
  assert.match(mockSource, /MockApiError\(402, \{ detail: 'pro_required' \}\)/)
  assert.match(mockSource, /MockApiError\(404, \{ detail \}\)/)
  assert.match(mockSource, /code: 'generation_in_progress'/)
  assert.match(mockSource, /code: 'consent_required'/)
})
