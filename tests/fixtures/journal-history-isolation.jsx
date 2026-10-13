/*
 * JOURNAL-001 — fixture настоящих React-компонентов «Истории».
 *
 * Отличие от tests/ux/journal-history-profile-isolation.spec.mjs: тот сценарий
 * меняет профиль полной загрузкой приложения (?guest=1) и потому доказывает
 * раздельное отображение ПОСЛЕ перезагрузки. Здесь в одном документе
 * смонтированы настоящие компоненты (ProfileScopedHistory из «Прогресса» и
 * legacy-поверхность History), а смена профиля — это смена пропа `user` в
 * живом React-дереве, без перезагрузки страницы. Граница профиля не
 * дублируется: стенд использует тот же компонент ProfileScopedHistory, что и
 * Analytics.jsx.
 *
 * Единственный источник записей — дневник DailyJournal (api.dailyJournal) и
 * чек-ины (api.checkin.history); старый локальный журнал удалён.
 *
 * Управляемый Promise: api.checkin.history каждого профиля отдаёт отложенный
 * промис, которым управляет тест через window.__journalIsolation.setCheckins,
 * а api.dailyJournal.entries — через setDiary/failDiary. Поэтому можно начать
 * запрос A, переключить профиль и только затем разрешить ответ A.
 *
 * Это тестовый стенд, а не экран приложения: вне tests/ он не собирается и в
 * бандл не попадает.
 */

import React from 'react'
import { createRoot } from 'react-dom/client'
import { flushSync } from 'react-dom'

import ProfileScopedHistory from '../../src/screens/progress/ProfileScopedHistory.jsx'
import History from '../../src/screens/History.jsx'
import { formatDayLabel } from '../../src/screens/progress/progressHistoryUtils.js'
import { api } from '../../src/lib/api.js'

const PROFILE_A = 900001
const PROFILE_B = 900002

const CHECKIN_A = 'JOURNAL-001 CHECKIN A: заметка профиля A'
const CHECKIN_B = 'JOURNAL-001 CHECKIN B: заметка профиля B'
const DIARY_A = 'JOURNAL-001 ДНЕВНИК A: поток записи профиля A'
const DIARY_B = 'JOURNAL-001 ДНЕВНИК B: поток записи профиля B'

/* Даты считаются относительно текущего дня (правило репозитория). */
function isoDay(offset) {
  const date = new Date()
  date.setDate(date.getDate() + offset)
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${date.getFullYear()}-${month}-${day}`
}

const DAY_A = isoDay(0)
const DAY_B = isoDay(-1)

function checkin(date, note) {
  return { date, mood: 4, note, created_at: `${date}T09:00:00Z` }
}

/* Сырой ответ api.dailyJournal.entries — как у настоящего эндпоинта. */
function diaryEntry(id, date, streamText) {
  return {
    id,
    date,
    day_number: 1,
    stream_text: streamText,
    prompt_text: 'Что дальше?',
    prompt_answer: '',
    created_at: `${date}T09:00:00Z`,
  }
}

const checkinLoads = new Map()

function checkinLoad(profileId) {
  const key = String(profileId)
  if (!checkinLoads.has(key)) {
    let resolve
    const promise = new Promise(next => {
      resolve = next
    })
    checkinLoads.set(key, { promise, resolve, settled: false })
  }
  return checkinLoads.get(key).promise
}

/*
 * Разрешает отложенный ответ профиля и даёт компоненту обработать его до
 * возврата из evaluate: микротаски (.then) и один кадр после них.
 */
async function settleCheckins(profileId, list) {
  const key = String(profileId)
  if (!checkinLoads.has(key)) checkinLoad(profileId)
  const load = checkinLoads.get(key)
  load.resolve(list)
  load.settled = true
  await Promise.resolve()
  await new Promise(next => requestAnimationFrame(() => next()))
  await new Promise(next => setTimeout(next, 0))
}

/*
 * Дневник (api.dailyJournal.entries): та же управляемая схема, что и у
 * checkin.history. Ответ можно разрешить (setDiary) или отклонить (failDiary),
 * чтобы отдельно проверить и изоляцию профилей, и отличие ошибки загрузки от
 * «записей нет».
 */
const diaryLoads = new Map()

function diaryLoad(profileId) {
  const key = String(profileId)
  if (!diaryLoads.has(key)) {
    let resolve
    let reject
    const promise = new Promise((next, fail) => {
      resolve = next
      reject = fail
    })
    diaryLoads.set(key, { promise, resolve, reject, settled: false })
  }
  // Один промис на профиль — как у checkinLoad: тест может разрешить его до
  // того, как эффект компонента обратится к api, и компонент получит тот же
  // самый ответ.
  return diaryLoads.get(key).promise
}

async function settleFrame() {
  await Promise.resolve()
  await new Promise(next => requestAnimationFrame(() => next()))
  await new Promise(next => setTimeout(next, 0))
}

async function settleDiary(profileId, items) {
  const key = String(profileId)
  if (!diaryLoads.has(key)) diaryLoad(profileId)
  const load = diaryLoads.get(key)
  load.resolve({ items })
  load.settled = true
  await settleFrame()
}

async function rejectDiaryLoad(profileId) {
  const key = String(profileId)
  if (!diaryLoads.has(key)) diaryLoad(profileId)
  const load = diaryLoads.get(key)
  load.reject(new Error('dailyJournal недоступен'))
  load.settled = true
  await settleFrame()
}

/*
 * Профильные загрузки подменяются только на границе api: сами компоненты,
 * их эффекты и токены профиля работают как в приложении.
 */
api.checkin.history = userId => checkinLoad(userId)
api.dailyJournal.entries = userId => diaryLoad(userId)
api.analytics.get = () => Promise.resolve({ daily_activity: [] })
api.moodPractices.list = () => Promise.resolve([])
api.profile.get = () => Promise.resolve({})
api.rituals.list = () => Promise.resolve([])
api.ascezas.list = () => Promise.resolve([])
api.themes.list = () => Promise.resolve([])
api.quotes.list = () => Promise.resolve([])

let currentUser = { id: PROFILE_A }

function fixture() {
  return (
    <div>
      <section data-testid="surface-progress">
        <div className="fixture-label">Прогресс → История</div>
        <div className="mx-progress-actions-row" />
        {/* Та же профильная граница, что и в приложении: общий компонент
            ProfileScopedHistory (его же монтирует Analytics.jsx). */}
        <ProfileScopedHistory user={currentUser} />
      </section>
      <section data-testid="surface-legacy">
        <div className="fixture-label">History (legacy)</div>
        <History user={currentUser} />
      </section>
    </div>
  )
}

const root = createRoot(document.getElementById('root'))

/*
 * flushSync: DOM обновляется синхронно, поэтому «сразу после обновления» —
 * это буквально следующая строка после смены пропа, без ожидания эффектов.
 */
function render() {
  flushSync(() => root.render(fixture()))
}

render()

window.__journalIsolation = {
  profiles: { A: PROFILE_A, B: PROFILE_B },
  texts: { CHECKIN_A, CHECKIN_B, DIARY_A, DIARY_B },
  checkins: { A: [checkin(DAY_A, CHECKIN_A)], B: [checkin(DAY_B, CHECKIN_B)] },
  diary: {
    A: [diaryEntry('diary-a-1', DAY_A, DIARY_A)],
    B: [diaryEntry('diary-b-1', DAY_B, DIARY_B)],
  },
  setDiary(profileId, items) {
    return settleDiary(profileId, items)
  },
  failDiary(profileId) {
    return rejectDiaryLoad(profileId)
  },
  pendingDiaryProfiles() {
    return [...diaryLoads.entries()].filter(([, load]) => !load.settled).map(([id]) => Number(id))
  },
  dayLabels: { A: formatDayLabel(DAY_A), B: formatDayLabel(DAY_B) },
  setProfile(id) {
    currentUser = id == null ? null : { id: Number(id) }
    render()
    return window.__journalIsolation.text()
  },
  setCheckins(profileId, list) {
    return settleCheckins(profileId, list)
  },
  pendingProfiles() {
    return [...checkinLoads.entries()].filter(([, load]) => !load.settled).map(([id]) => Number(id))
  },
  text() {
    return document.getElementById('root').textContent || ''
  },
  entryScreens() {
    return document.querySelectorAll('[data-testid="progress-entry-screen"]').length
  },
}
