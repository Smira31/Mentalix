import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

import {
  acceptsProfileLoad,
  beginProfileLoad,
  normalizeProfileId,
  profileScopeKey,
} from '../../src/lib/historyProfileScope.js'
import { buildEntriesByDay, ENTRY_TYPES } from '../../src/screens/progress/progressHistoryUtils.js'

/*
 * JOURNAL-001 — профильная изоляция поверхности «История» и единственный
 * источник записей — дневник DailyJournal (api.dailyJournal).
 *
 * Сценарий владельца: у профиля A раскрыта запись, затем «выход» и вход под B.
 * Требования:
 *   1) старый текст A исчезает сразу — не после сброса в useEffect, который
 *      выполняется уже после кадра с чужим текстом. Поэтому у поверхностей
 *      истории есть профильная граница (key): при смене профиля состояние
 *      создаётся заново, а не переиспользуется;
 *   2) ответ запроса, начатого для A, не применяется в B (токен профиля).
 *
 * Старый локальный журнал («Идея / Действие / Анализ / Новый шаг») удалён:
 * «История» не должна читать journalStorage/journalHistory и не должна
 * содержать тип записи «Журнал». Эти инварианты проверяются по исходникам
 * поверхностей ниже.
 *
 * Даты — относительно текущего дня (правило репозитория).
 */

const PROFILE_A = 101
const PROFILE_B = 202

function isoDaysAgo(days) {
  const date = new Date()
  date.setDate(date.getDate() - days)
  return date.toISOString().slice(0, 10)
}

const TODAY = isoDaysAgo(0)
const TWO_DAYS_AGO = isoDaysAgo(2)

function diaryEntry(id, date, streamText) {
  return { id, date, streamText, promptText: '', promptAnswer: '', createdAt: `${date}T09:00:00Z` }
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

// ── 3. Записи дневника собираются в ленту без схлопывания по дате ──

test('JOURNAL-001 дневник кладётся в свою дату, разные записи дня не схлопываются', () => {
  const days = buildEntriesByDay(
    [],
    [],
    [],
    [],
    [
      diaryEntry('d-2', TODAY, 'A: вторая запись дня'),
      diaryEntry('d-1', TODAY, 'A: первая запись дня'),
      diaryEntry('d-0', TWO_DAYS_AGO, 'A: запись другого дня'),
    ]
  )

  assert.deepEqual(
    days.map(day => day.date),
    [TODAY, TWO_DAYS_AGO]
  )
  assert.equal(days[0].entries.length, 2)
  assert.ok(days[0].entries.every(entry => entry.type === ENTRY_TYPES.DAILY_JOURNAL))
  assert.deepEqual(
    days[0].entries.map(entry => entry.diary.id),
    ['d-2', 'd-1']
  )
})

test('JOURNAL-001 записи только активного профиля попадают в ленту', () => {
  const daysA = buildEntriesByDay([], [], [], [], [diaryEntry('a-1', TODAY, 'A: запись')])
  const daysB = buildEntriesByDay([], [], [], [], [diaryEntry('b-1', TWO_DAYS_AGO, 'B: запись')])

  const textA = JSON.stringify(daysA)
  const textB = JSON.stringify(daysB)
  assert.equal(textB.includes('A: запись'), false)
  assert.equal(textA.includes('B: запись'), false)
  assert.deepEqual(
    daysA.map(day => day.date),
    [TODAY]
  )
  assert.deepEqual(
    daysB.map(day => day.date),
    [TWO_DAYS_AGO]
  )
})

// ── 4. Контракт поверхностей и отсутствие старого журнала ──

const analyticsSource = readFileSync(
  new URL('../../src/screens/Analytics.jsx', import.meta.url),
  'utf8'
)
const progressHistorySource = readFileSync(
  new URL('../../src/screens/progress/ProgressHistory.jsx', import.meta.url),
  'utf8'
)
const progressHistoryUtilsSource = readFileSync(
  new URL('../../src/screens/progress/progressHistoryUtils.js', import.meta.url),
  'utf8'
)
const historySource = readFileSync(
  new URL('../../src/screens/History.jsx', import.meta.url),
  'utf8'
)
const profileScopedHistorySource = readFileSync(
  new URL('../../src/screens/progress/ProfileScopedHistory.jsx', import.meta.url),
  'utf8'
)
const fixtureSource = readFileSync(
  new URL('../fixtures/journal-history-isolation.jsx', import.meta.url),
  'utf8'
)

test('JOURNAL-001 поверхность «История» в «Прогрессе» ограничена профилем', () => {
  // Граница профиля живёт в одном общем компоненте: его монтирует Analytics,
  // и его же использует стенд — в тестах граница не дублируется.
  assert.match(
    profileScopedHistorySource,
    /<ProgressHistory key=\{profileScopeKey\(user\?\.id\)\} user=\{user\} \{\.\.\.rest\} \/>/,
    'общая профильная граница должна монтировать ProgressHistory с ключом профиля'
  )
  assert.match(
    analyticsSource,
    /<ProfileScopedHistory/,
    'Analytics должен использовать общую профильную границу'
  )
  assert.doesNotMatch(
    analyticsSource,
    /<ProgressHistory/,
    'Analytics не дублирует границу: ProgressHistory монтируется только в ProfileScopedHistory'
  )
  assert.match(
    fixtureSource,
    /<ProfileScopedHistory user=\{currentUser\} \/>/,
    'стенд обязан использовать ту же профильную границу, что и приложение'
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

test('JOURNAL-001 «История» знает единственный дневник и не читает старый журнал', () => {
  // Единственный источник записей — api.dailyJournal (тот же, что «Мои записи»).
  assert.match(progressHistorySource, /api\.dailyJournal\s*\.\s*entries\(user\.id, \{/)
  // Старый локальный журнал полностью удалён из поверхностей истории.
  assert.doesNotMatch(progressHistorySource, /journalHistory|readJournalHistory|journalStorage/)
  assert.doesNotMatch(progressHistorySource, /ENTRY_TYPES\.JOURNAL\b/)
  assert.doesNotMatch(historySource, /journalHistory|readJournalHistory|journalStorage/)
  assert.doesNotMatch(historySource, /local-journal-history/)
  // В утилитах истории нет типа записи «Журнал» — только дневник.
  assert.doesNotMatch(progressHistoryUtilsSource, /JOURNAL:\s*'journal'/)
  assert.doesNotMatch(progressHistoryUtilsSource, /'Журнал'/)
})

test('JOURNAL-001 настройки группировки и фильтра не сбрасываются при смене профиля', () => {
  assert.match(progressHistorySource, /const GRANULARITY_KEY = 'mx-history-granularity'/)
  assert.match(progressHistorySource, /const FILTER_KEY = 'mx-history-filter'/)
  // Оба выбора читаются из localStorage при монтировании — поэтому переживают
  // ремоунт по профильной границе.
  assert.match(progressHistorySource, /localStorage\.getItem\(GRANULARITY_KEY\)/)
  assert.match(progressHistorySource, /localStorage\.getItem\(FILTER_KEY\)/)
  assert.match(
    progressHistorySource,
    /localStorage\.setItem\(FILTER_KEY, JSON\.stringify\(\[\.\.\.filterTypes\]\)\)/
  )
})
