import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'
import { parseContextualDeepLink } from '../../src/lib/contextualDeepLink.js'

// SRC-02: ссылка вида t.me/<бот>/<app>?startapp=morning_v1__src_ig_1911
// открывает тот же экран, что и startapp=morning_v1. Метку источника (часть
// после «__») сохраняет бэкенд (SRC-01, mentalix-bot), фронт её не отправляет
// и при выборе экрана игнорирует.

const TODAY = { sub: null, returnFlow: null }
const DAIMON = { sub: null, returnFlow: null, practicesSub: 'daimon' }
const JOURNAL = { sub: null, returnFlow: null, practicesSub: 'journal' }
const MORNING = { sub: 'checkin', returnFlow: 'morning_v1' }
const EVENING = { sub: 'evening', returnFlow: 'evening_v1' }

const webAdapter = readFileSync(
  new URL('../../src/platform/web.adapter.js', import.meta.url),
  'utf8'
)

test('SRC-02: составное значение открывает тот же экран, что и чистое', () => {
  assert.deepEqual(parseContextualDeepLink('', 'morning_v1__src_ig_1911'), MORNING)
  assert.deepEqual(parseContextualDeepLink('', 'evening_v1__src_yt_0311'), EVENING)
  assert.deepEqual(parseContextualDeepLink('', 'journal__src_tg_post_12'), JOURNAL)
  assert.deepEqual(parseContextualDeepLink('', 'daimon__src_tg_post_12'), DAIMON)
})

test('SRC-02: поведение чистых значений без «__» не изменилось', () => {
  assert.deepEqual(parseContextualDeepLink('', 'morning_v1'), MORNING)
  assert.deepEqual(parseContextualDeepLink('', 'evening_v1'), EVENING)
  assert.deepEqual(parseContextualDeepLink('', 'journal'), JOURNAL)
  assert.deepEqual(parseContextualDeepLink('', 'daimon'), DAIMON)
  assert.deepEqual(parseContextualDeepLink('?tab=practices&sub=daimon', ''), DAIMON)
})

test('SRC-02: приоритет Даймона и action сохраняется и для составного значения', () => {
  assert.deepEqual(
    parseContextualDeepLink('?tab=practices&sub=daimon&action=checkin', 'morning_v1__src_ig_1911'),
    DAIMON
  )
  assert.deepEqual(parseContextualDeepLink('?action=breathing', 'morning_v1__src_ig_1911'), MORNING)
  assert.deepEqual(parseContextualDeepLink('?action=evening', 'morning_v1__src_ig_1911'), MORNING)
})

test('SRC-02: чистая метка src_<код> открывает «Сегодня» как обычный вход', () => {
  assert.deepEqual(parseContextualDeepLink('', 'src_ig_1911'), TODAY)
  assert.deepEqual(parseContextualDeepLink('?tab=today', 'src_tg_post_12'), TODAY)
  // Чистая метка не срабатывает и как возвратный поток.
  assert.equal(parseContextualDeepLink('', 'src_ig_1911').returnFlow, null)
})

test('SRC-02: мусор не ломает разбор и открывает «Сегодня»', () => {
  const garbage = ['', '__', '____', '__src_ig_1911', ' ', null, undefined, 42, 'x'.repeat(4096)]
  for (const value of garbage) {
    assert.deepEqual(
      parseContextualDeepLink('', value),
      TODAY,
      `мусор: ${String(value).slice(0, 24)}`
    )
  }
})

test('SRC-02: в браузере ?startapp=… разбирается так же, как start_param', () => {
  const fromSearch = search => new URLSearchParams(search).get('startapp') || ''
  const browser = search => parseContextualDeepLink(search, fromSearch(search))

  assert.deepEqual(browser('?startapp=morning_v1__src_ig_1911'), MORNING)
  assert.deepEqual(browser('?startapp=evening_v1__src_yt_0311'), EVENING)
  assert.deepEqual(browser('?startapp=journal__src_tg_post_12'), JOURNAL)
  assert.deepEqual(browser('?startapp=src_ig_1911'), TODAY)
  // Веб-адаптер читает ровно этот параметр и отдаёт его в тот же разбор.
  assert.match(webAdapter, /new URLSearchParams\(window\.location\.search\)\.get\('startapp'\)/)
})

test('SRC-02: события возвратного потока остаются прежними для составного значения', () => {
  // returnFlow в результате разбора — чистое значение, поэтому события
  // morning_<suffix>/evening_<suffix> не меняются (returnFlowEvent).
  assert.equal(parseContextualDeepLink('', 'morning_v1__src_ig_1911').returnFlow, 'morning_v1')
  assert.equal(parseContextualDeepLink('', 'evening_v1__src_yt_0311').returnFlow, 'evening_v1')
})
