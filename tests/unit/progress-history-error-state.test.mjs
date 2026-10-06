import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

/*
 * Регрессия: при ошибке API (checkin.history / moodPractices.list)
 * ProgressHistory показывал пустое состояние «Здесь появятся твои записи»,
 * будто у пользователя нет записей. Нужно явно показывать ошибку и
 * кнопку «Повторить», перезапускающую все API-вызовы.
 */

const source = await readFile(
  new URL('../../src/screens/progress/ProgressHistory.jsx', import.meta.url),
  'utf8'
)

test('ProgressHistory: есть state loadError', () => {
  assert.match(source, /const \[loadError, setLoadError\] = useState\(false\)/)
})

test('ProgressHistory: критичные API-вызовы не глотают ошибки через .catch(() => [])', () => {
  // checkin.history и moodPractices.list — критичные; их ошибки не должны
  // превращаться в пустой массив, иначе показывается empty-state.
  assert.doesNotMatch(
    source,
    /api\.checkin\.history\([^)]*\)\.catch\(\(\) => \[\]\)/,
    'checkin.history не должен глотать ошибку через .catch(() => [])'
  )
  assert.doesNotMatch(
    source,
    /api\.moodPractices[\s\S]*?\.catch\(\(\) => \[\]\)/,
    'moodPractices.list не должен глотать ошибку через .catch(() => [])'
  )
})

test('ProgressHistory: analytics остаётся опциональной (.catch(() => null) допустим)', () => {
  // analytics.get — вспомогательный вызов (daily_activity для группировки),
  // его провал не должен ломать весь экран.
  assert.match(
    source,
    /api\.analytics\.get\(user\.id, 30\)\.catch\(\(\) => null\)/
  )
})

test('ProgressHistory: есть data-testid экрана ошибки', () => {
  assert.match(source, /data-testid="progress-history-load-error"/)
})

test('ProgressHistory: есть data-testid кнопки «Повторить»', () => {
  assert.match(source, /data-testid="progress-history-load-retry"/)
})

test('ProgressHistory: кнопка «Повторить» перезапускает загрузку', () => {
  // retry должен менять внутренний ключ, который входит в deps useEffect загрузки
  assert.match(source, /setRetryKey\(k => k \+ 1\)/)
  assert.match(source, /retryKey/)
  // retryKey должен быть в массиве зависимостей эффекта загрузки
  // Эффект загрузки содержит Promise.all и заканчивается deps-массивом
  const effectMatch = source.match(
    /Promise\.all\(\[[\s\S]*?\}\s*,\s*\[([^\]]+)\]/
  )
  assert.ok(effectMatch, 'найден эффект загрузки с Promise.all и deps')
  assert.match(effectMatch[1], /retryKey/, 'retryKey должен быть в deps эффекта загрузки')
})

test('ProgressHistory: экран ошибки имеет role="alert"', () => {
  assert.match(source, /role="alert"[\s\S]*?data-testid="progress-history-load-error"/)
})

test('ProgressHistory: экран ошибки стоит до проверки пустого состояния', () => {
  const errorPos = source.indexOf('data-testid="progress-history-load-error"')
  const emptyPos = source.indexOf('Здесь появятся твои записи')
  assert.ok(errorPos > 0, 'экран ошибки найден')
  assert.ok(emptyPos > 0, 'пустое состояние найдено')
  assert.ok(
    errorPos < emptyPos,
    'экран ошибки должен идти до пустого состояния в рендере'
  )
})

test('ProgressHistory: при ошибке загрузки setLoadError(true) вызывается в catch', () => {
  assert.match(source, /\.catch\(\(\) => \{[\s\S]*?setLoadError\(true\)/)
})

test('ProgressHistory: при старте загрузки loadError сбрасывается', () => {
  // Перед Promise.all должен быть setLoadError(false)
  const promiseAllPos = source.indexOf('Promise.all([')
  assert.ok(promiseAllPos > 0)
  const beforePromise = source.slice(0, promiseAllPos)
  // Ищем последний setLoadError(false) перед Promise.all в эффекте загрузки
  assert.match(
    beforePromise,
    /setLoadError\(false\)/,
    'loadError должен сбрасываться перед загрузкой'
  )
})
