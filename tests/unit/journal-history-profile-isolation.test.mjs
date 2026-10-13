import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

import { readJournalHistory } from '../../src/lib/journalHistory.js'
import {
  acceptsProfileLoad,
  beginProfileLoad,
  normalizeProfileId,
  profileScopeKey,
} from '../../src/lib/historyProfileScope.js'

/*
 * JOURNAL-001 — воспроизведение утечки состояния между профилями в «Истории».
 *
 * Сценарий владельца: у профиля A раскрыта запись журнала, затем «выход» и
 * вход под B. Требования:
 *   1) старый текст A исчезает сразу — не после сброса в useEffect, который
 *      выполняется уже после кадра с чужим текстом. Поэтому у поверхностей
 *      истории есть профильная граница (key): при смене профиля состояние
 *      создаётся заново, а не переиспользуется;
 *   2) ответ запроса, начатого для A, не применяется в B (токен профиля).
 *
 * Ниже — модельные проверки на настоящих функциях и контрактные проверки
 * исходников обеих поверхностей: до правки эти проверки падали (сброса в
 * useEffect не хватало).
 *
 * Даты — относительно текущего дня (правило репозитория).
 */

const SCOPED_KEY = userId => `mx-journal-v2:user:${encodeURIComponent(String(userId))}`
const LEGACY_KEY = 'mx-journal-v2'
const PROTOTYPE_KEY = 'mx-journal-prototype-v1'

const PROFILE_A = 101
const PROFILE_B = 202

function isoDaysAgo(days) {
  const date = new Date()
  date.setDate(date.getDate() - days)
  return date.toISOString().slice(0, 10)
}

const TODAY = isoDaysAgo(0)
const TWO_DAYS_AGO = isoDaysAgo(2)

function phase(text, status = 'draft') {
  return { text, status, updatedAt: null }
}

function dayEntry({ phases = {}, freeWrites = [] } = {}) {
  return {
    version: 2,
    cycle: {
      idea: phase(''),
      action: phase(''),
      analysis: phase(''),
      newStep: phase(''),
      ...phases,
    },
    freeWrites,
    updatedAt: null,
  }
}

function storageSpy(seed = {}) {
  const memory = new Map(Object.entries(seed))
  const calls = { getItem: [], setItem: [], removeItem: [] }
  return {
    memory,
    calls,
    storage: {
      getItem: key => {
        calls.getItem.push(key)
        return memory.has(key) ? memory.get(key) : null
      },
      setItem: (key, value) => {
        calls.setItem.push(key)
        memory.set(key, value)
      },
      removeItem: key => {
        calls.removeItem.push(key)
        memory.delete(key)
      },
    },
  }
}

/*
 * Мини-модель поверхности истории: снимок принадлежит профилю, а ответ
 * асинхронной загрузки применяется только через acceptsProfileLoad — ровно
 * так устроены обе поверхности (контракт ниже проверяет это по исходникам).
 */
function mountSurface({ userId, journalEntries }) {
  return {
    profileKey: profileScopeKey(userId),
    userId,
    journalEntries,
  }
}

function collectTexts(entry) {
  return [...(entry?.phases || []).map(item => item.text), ...(entry?.freeWrites || []).map(item => item.text)]
}

// ── 1. Профильная граница ──

test('JOURNAL-001 A и B не делят профильную границу, повторный вход под A её сохраняет', () => {
  assert.notEqual(profileScopeKey(PROFILE_A), profileScopeKey(PROFILE_B))
  assert.equal(profileScopeKey(PROFILE_A), profileScopeKey(PROFILE_A))
  // Числовой и строковый id одного профиля — один скоуп, а не два.
  assert.equal(profileScopeKey(PROFILE_A), profileScopeKey(String(PROFILE_A)))
})

test('JOURNAL-001 «выход» не наследует границу профиля', () => {
  const keyA = profileScopeKey(PROFILE_A)
  for (const missing of [undefined, null, '', '   ', NaN, Infinity]) {
    assert.equal(normalizeProfileId(missing), null)
    assert.notEqual(profileScopeKey(missing), keyA)
    assert.equal(profileScopeKey(missing), 'anonymous')
  }
})

// ── 2. Запоздавший ответ A не применяется в B ──

test('JOURNAL-001 запоздавший ответ A не применяется в B', () => {
  const tokenA = beginProfileLoad(PROFILE_A)

  // Пока активен A — ответ применяется.
  assert.equal(acceptsProfileLoad(tokenA, PROFILE_A), true)
  assert.equal(acceptsProfileLoad(tokenA, String(PROFILE_A)), true)

  // Профиль сменился на B — ответ A отбрасывается.
  assert.equal(acceptsProfileLoad(tokenA, PROFILE_B), false)

  // «Выход» и неавторизованное состояние — тоже не применяются.
  assert.equal(acceptsProfileLoad(tokenA, undefined), false)
  assert.equal(acceptsProfileLoad(tokenA, null), false)
  assert.equal(acceptsProfileLoad(tokenA, ''), false)

  // Токен без подтверждённого профиля не принимается никогда.
  assert.equal(acceptsProfileLoad(beginProfileLoad(undefined), undefined), false)
  assert.equal(acceptsProfileLoad(beginProfileLoad(''), null), false)
  assert.equal(acceptsProfileLoad(null, PROFILE_A), false)
})

// ── 3. Раскрытая запись A → выход → A→B ──

test('JOURNAL-001 раскрытая запись A не показывается в B и после выхода', () => {
  const textA = 'A: раскрытая запись профиля'
  const textB = 'B: запись другого профиля'
  const { memory, storage, calls } = storageSpy({
    [SCOPED_KEY(PROFILE_A)]: JSON.stringify({
      version: 2,
      entries: { [TODAY]: dayEntry({ phases: { idea: phase(textA, 'final') } }) },
    }),
    [SCOPED_KEY(PROFILE_B)]: JSON.stringify({
      version: 2,
      entries: { [TWO_DAYS_AGO]: dayEntry({ phases: { idea: phase(textB, 'final') } }) },
    }),
  })
  globalThis.localStorage = storage

  const surfaceA = mountSurface({ userId: PROFILE_A, journalEntries: readJournalHistory(PROFILE_A) })
  assert.deepEqual(surfaceA.journalEntries.map(entry => entry.date), [TODAY])
  assert.deepEqual(collectTexts(surfaceA.journalEntries[0]), [textA])

  // A→B: граница профиля другая, снимок создаётся заново — текста A в нём нет.
  const surfaceB = mountSurface({ userId: PROFILE_B, journalEntries: readJournalHistory(PROFILE_B) })
  assert.notEqual(surfaceB.profileKey, surfaceA.profileKey)
  assert.deepEqual(surfaceB.journalEntries.map(entry => entry.date), [TWO_DAYS_AGO])
  assert.equal(JSON.stringify(surfaceB.journalEntries).includes(textA), false)
  assert.deepEqual(collectTexts(surfaceB.journalEntries[0]), [textB])

  // «Выход» (нет профиля): поверхность без данных и без чтения общих legacy-ключей.
  const anonymous = mountSurface({ userId: undefined, journalEntries: readJournalHistory(undefined) })
  assert.notEqual(anonymous.profileKey, surfaceA.profileKey)
  assert.deepEqual(anonymous.journalEntries, [])
  assert.equal(calls.getItem.includes(LEGACY_KEY), false)
  assert.equal(calls.getItem.includes(PROTOTYPE_KEY), false)

  // Чтение истории ничего не записало и не удалило — данные журнала неизменны.
  assert.deepEqual(calls.setItem, [])
  assert.deepEqual(calls.removeItem, [])
  assert.deepEqual([...memory.keys()].sort(), [SCOPED_KEY(PROFILE_A), SCOPED_KEY(PROFILE_B)].sort())
})

// ── 4. Контракт обеих поверхностей ──

const analyticsSource = readFileSync(
  new URL('../../src/screens/Analytics.jsx', import.meta.url),
  'utf8'
)
const progressHistorySource = readFileSync(
  new URL('../../src/screens/progress/ProgressHistory.jsx', import.meta.url),
  'utf8'
)
const historySource = readFileSync(new URL('../../src/screens/History.jsx', import.meta.url), 'utf8')

test('JOURNAL-001 поверхность «История» в «Прогрессе» ограничена профилем', () => {
  assert.match(
    analyticsSource,
    /<ProgressHistory\n\s+key=\{profileScopeKey\(user\?\.id\)\}/,
    'ProgressHistory должен монтироваться заново при смене профиля'
  )
})

test('JOURNAL-001 legacy-поверхность истории ограничена профилем', () => {
  assert.match(
    historySource,
    /export default function History\(props\) \{\n\s+return <HistorySurface key=\{profileScopeKey\(props\.user\?\.id\)\} \{\.\.\.props\} \/>/,
    'History должна монтировать HistorySurface с ключом профиля'
  )
  assert.doesNotMatch(historySource, /export default function History\(\{/)
})

test('JOURNAL-001 обе поверхности отбрасывают запоздавшие ответы', () => {
  for (const [name, source] of [
    ['History', historySource],
    ['ProgressHistory', progressHistorySource],
  ]) {
    assert.match(source, /beginProfileLoad\(user\.id\)/, `${name}: нужен токен профиля`)
    assert.match(
      source,
      /acceptsProfileLoad\(token, user\.id\)/,
      `${name}: ответ применяется только для активного профиля`
    )
  }
  // Очистка эффекта обнуляет alive — ответ размонтированной поверхности не применяется.
  assert.match(historySource, /return \(\) => \{\n\s+alive = false\n\s+\}/)
  assert.match(progressHistorySource, /return \(\) => \{\n\s+alive = false\n\s+\}/)
})

test('JOURNAL-001 настройки группировки и фильтра не сбрасываются при смене профиля', () => {
  assert.match(progressHistorySource, /const GRANULARITY_KEY = 'mx-history-granularity'/)
  assert.match(progressHistorySource, /const FILTER_KEY = 'mx-history-filter'/)
  // Оба выбора читаются из localStorage при монтировании — поэтому переживают
  // ремоунт по профильной границе.
  assert.match(progressHistorySource, /localStorage\.getItem\(GRANULARITY_KEY\)/)
  assert.match(progressHistorySource, /localStorage\.getItem\(FILTER_KEY\)/)
  assert.match(progressHistorySource, /localStorage\.setItem\(FILTER_KEY, JSON\.stringify\(\[\.\.\.filterTypes\]\)\)/)
})
