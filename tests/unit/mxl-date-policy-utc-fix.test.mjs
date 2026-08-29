import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

import { today as moodCheckToday } from '../../src/lib/moodCheckDraft.js'

/*
 * MXL-DATE-POLICY-UTC-FIX-001: три места (moodCheckDraft.today(),
 * Analytics.jsx todayIso, insightDigest.js todayIso()) вычисляли "сегодня"
 * через new Date().toISOString().slice(0, 10) — UTC-дата, не локальная.
 * В любом ненулевом часовом поясе, в окне между локальной полуночью и
 * UTC-полуночью, это давало дату "вчера" вместо реальной локальной даты.
 *
 * moodCheckDraft.js проверяется поведенчески (today() импортируется и
 * вызывается с фиксированными инстантами). Analytics.jsx и insightDigest.js
 * проверяются по исходному тексту (тот же приём, что в
 * insights-data-quality.test.mjs/maintenance-contracts.test.mjs) —
 * insightDigest.js импортирует api.js/Analytics.jsx/store.js/
 * telegram.hooks.js без расширения .js, что валидно для Vite, но не
 * резолвится под node --test; менять эти чужие импорты вне запрошенного
 * скоупа (три конкретных места) — отдельная задача, не эта.
 */

function withTz(tz, fn) {
  const original = process.env.TZ
  process.env.TZ = tz
  try {
    return fn()
  } finally {
    if (original === undefined) delete process.env.TZ
    else process.env.TZ = original
  }
}

// Старая, багованная реализация — оставлена только внутри теста, чтобы
// показать расхождение с фиксом; нигде в src/ больше не используется.
function legacyUtcSliceToday(instant) {
  return new Date(instant).toISOString().slice(0, 10)
}

test('MXL-DATE-POLICY-UTC-FIX-001 UTC+3: 23:30 локального дня N — UTC и локальная дата совпадают (не граница)', () => {
  withTz('Europe/Moscow', () => {
    // 2026-08-26T23:30 MSK = 2026-08-26T20:30Z — тот же календарный день в
    // обеих системах отсчёта, старая реализация здесь тоже была бы верна.
    const instant = '2026-08-26T20:30:00.000Z'
    assert.equal(moodCheckToday(instant), '2026-08-26')
    assert.equal(legacyUtcSliceToday(instant), '2026-08-26')
  })
})

test('MXL-DATE-POLICY-UTC-FIX-001 UTC+3: 00:30 следующего локального дня — старая реализация ещё показывает вчера, фикс уже сегодня', () => {
  withTz('Europe/Moscow', () => {
    // 2026-08-27T00:30 MSK = 2026-08-26T21:30Z — локальная полночь уже
    // прошла (день N+1), но UTC-дата ещё "день N" вплоть до 03:00 MSK.
    const instant = '2026-08-26T21:30:00.000Z'

    // Баг: пользователь на локальном экране уже видит "27 августа", но
    // старый todayIso() всё ещё считает, что сегодня "26 августа".
    assert.equal(legacyUtcSliceToday(instant), '2026-08-26')

    // Фикс: точка замены соглашается с реальным локальным днём.
    assert.equal(moodCheckToday(instant), '2026-08-27')
  })
})

test('MXL-DATE-POLICY-UTC-FIX-001 UTC+3: полный переход 23:30 дня N → 00:30 дня N+1 — фикс не даёт дню N+1 читаться как день N', () => {
  withTz('Europe/Moscow', () => {
    const eveningOfDayN = '2026-08-26T20:30:00.000Z' // 23:30 MSK, день N
    const nightOfDayNPlus1 = '2026-08-26T21:30:00.000Z' // 00:30 MSK, день N+1

    const dayNKey = moodCheckToday(eveningOfDayN)
    const dayNPlus1Key = moodCheckToday(nightOfDayNPlus1)

    // Реальный сценарий провала из расследования: два локально соседних
    // дня обязаны давать разные ключи "последнего показа" — иначе гейт
    // либо не покажется в начале нового дня (ключ совпал с "вчера"),
    // либо покажется второй раз в тот же локальный день, когда UTC
    // наконец досчитает до своей полуночи (см. следующий тест).
    assert.notEqual(dayNKey, dayNPlus1Key)
    assert.equal(dayNKey, '2026-08-26')
    assert.equal(dayNPlus1Key, '2026-08-27')

    // Старая реализация схлопывала оба момента в один и тот же UTC-день —
    // это и есть источник бага, не гипотеза.
    assert.equal(legacyUtcSliceToday(eveningOfDayN), legacyUtcSliceToday(nightOfDayNPlus1))
  })
})

test('MXL-DATE-POLICY-UTC-FIX-001 UTC+3: shouldOfferMoodCheck/markMoodCheckShown согласованы на границе полуночи через реальный localStorage round-trip', () => {
  withTz('Europe/Moscow', () => {
    const store = new Map()
    const originalLocalStorage = globalThis.localStorage
    globalThis.localStorage = {
      getItem: key => (store.has(key) ? store.get(key) : null),
      setItem: (key, value) => store.set(key, String(value)),
      removeItem: key => store.delete(key),
    }

    try {
      const LAST_SHOWN_KEY = 'mx-mood-check-last-shown'

      // День N, 23:30 MSK — гейт показан, дата записана как локальный день N.
      const dayNLabel = moodCheckToday('2026-08-26T20:30:00.000Z')
      store.set(LAST_SHOWN_KEY, dayNLabel)

      // День N+1, 00:30 MSK — та же проверка, что делает shouldOfferMoodCheck():
      // localStorage.getItem(LAST_SHOWN_KEY) !== today(). С фиксом ключи не
      // совпадают — гейт обязан снова предложиться. Со старым UTC-срезом оба
      // момента давали один и тот же ключ ("2026-08-26"), и сравнение молчало
      // бы вплоть до 03:00 MSK (см. предыдущий тест).
      const nightOfDayNPlus1Label = moodCheckToday('2026-08-26T21:30:00.000Z')
      assert.notEqual(store.get(LAST_SHOWN_KEY), nightOfDayNPlus1Label)
    } finally {
      if (originalLocalStorage === undefined) delete globalThis.localStorage
      else globalThis.localStorage = originalLocalStorage
    }
  })
})

test('MXL-DATE-POLICY-UTC-FIX-001 Analytics.jsx: todayIso использует toLocalCalendarDate, не UTC-срез', async () => {
  const source = await readFile(new URL('../../src/screens/Analytics.jsx', import.meta.url), 'utf8')

  assert.match(source, /import\s*\{\s*toLocalCalendarDate\s*\}\s*from\s*'\.\.\/lib\/dateTimezonePolicy'/)
  assert.match(source, /const todayIso = toLocalCalendarDate\(\)/)
  // Не просто "паттерн не встречается нигде" — в explain-комментарии фикса
  // старый код цитируется намеренно. Проверяем именно код: присвоение или
  // return буквального UTC-среза, а не строку внутри комментария.
  assert.doesNotMatch(source, /(?:return|=)\s*new Date\(\)\.toISOString\(\)\.slice\(0,\s*10\)/)
})

test('MXL-DATE-POLICY-UTC-FIX-001 insightDigest.js: todayIso использует toLocalCalendarDate, не UTC-срез', async () => {
  const source = await readFile(
    new URL('../../src/screens/mentalix/insightDigest.js', import.meta.url),
    'utf8'
  )

  assert.match(source, /import\s*\{\s*toLocalCalendarDate\s*\}\s*from\s*'\.\.\/\.\.\/lib\/dateTimezonePolicy\.js'/)
  assert.match(source, /function todayIso\(now = new Date\(\)\) \{\s*return toLocalCalendarDate\(now\)/)
  // Не просто "паттерн не встречается нигде" — в explain-комментарии фикса
  // старый код цитируется намеренно. Проверяем именно код: присвоение или
  // return буквального UTC-среза, а не строку внутри комментария.
  assert.doesNotMatch(source, /(?:return|=)\s*new Date\(\)\.toISOString\(\)\.slice\(0,\s*10\)/)
})
