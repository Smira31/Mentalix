/*
 * JOURNAL-001 — fixture настоящих React-компонентов «Истории».
 *
 * Отличие от tests/ux/journal-history-profile-isolation.spec.mjs: тот сценарий
 * меняет профиль полной загрузкой приложения (?guest=1) и потому доказывает
 * раздельное отображение ПОСЛЕ перезагрузки. Здесь в одном документе
 * смонтированы настоящие компоненты (ProgressHistory из «Прогресса» и
 * legacy-поверхность History), а смена профиля — это смена пропа `user` в
 * живом React-дереве, без перезагрузки страницы.
 *
 * Управляемый Promise: api.checkin.history каждого профиля отдаёт отложенный
 * промис, которым управляет тест через window.__journalIsolation.setCheckins.
 * Поэтому можно начать запрос A, переключить профиль и только затем разрешить
 * ответ A.
 *
 * Это тестовый стенд, а не экран приложения: вне tests/ он не собирается и в
 * бандл не попадает.
 */

import React from 'react'
import { createRoot } from 'react-dom/client'
import { flushSync } from 'react-dom'

import ProgressHistory from '../../src/screens/progress/ProgressHistory.jsx'
import History from '../../src/screens/History.jsx'
import { formatDayLabel } from '../../src/screens/progress/progressHistoryUtils.js'
import { api } from '../../src/lib/api.js'
import { profileScopeKey } from '../../src/lib/historyProfileScope.js'

const PROFILE_A = 900001
const PROFILE_B = 900002
const KEY_A = `mx-journal-v2:user:${PROFILE_A}`
const KEY_B = `mx-journal-v2:user:${PROFILE_B}`

const TEXT_A = 'JOURNAL-001 A: раскрытая запись профиля A'
const TEXT_B = 'JOURNAL-001 B: запись профиля B'
const CHECKIN_A = 'JOURNAL-001 CHECKIN A: заметка профиля A'
const CHECKIN_B = 'JOURNAL-001 CHECKIN B: заметка профиля B'

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

function journalStore(date, text) {
  const phase = (value, status) => ({ text: value, status, updatedAt: null })
  return {
    version: 2,
    entries: {
      [date]: {
        version: 2,
        cycle: {
          idea: phase(text, 'final'),
          action: phase('', 'draft'),
          analysis: phase('', 'draft'),
          newStep: phase('', 'draft'),
        },
        freeWrites: [],
        updatedAt: null,
      },
    },
  }
}

function checkin(date, note) {
  return { date, mood: 4, note, created_at: `${date}T09:00:00Z` }
}

/* Журнал обоих профилей засевается один раз — до монтирования, без перезагрузки. */
localStorage.setItem(KEY_A, JSON.stringify(journalStore(DAY_A, TEXT_A)))
localStorage.setItem(KEY_B, JSON.stringify(journalStore(DAY_B, TEXT_B)))

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
 * Профильные загрузки подменяются только на границе api: сами компоненты,
 * их эффекты и токены профиля работают как в приложении.
 */
api.checkin.history = userId => checkinLoad(userId)
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
        {/* Ключ ровно как в Analytics.jsx — профильная граница ремонта. */}
        <ProgressHistory key={profileScopeKey(currentUser?.id)} user={currentUser} />
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
  texts: { TEXT_A, TEXT_B, CHECKIN_A, CHECKIN_B },
  checkins: { A: [checkin(DAY_A, CHECKIN_A)], B: [checkin(DAY_B, CHECKIN_B)] },
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
    return [...checkinLoads.entries()]
      .filter(([, load]) => !load.settled)
      .map(([id]) => Number(id))
  },
  text() {
    return document.getElementById('root').textContent || ''
  },
  entryScreens() {
    return document.querySelectorAll('[data-testid="progress-entry-screen"]').length
  },
}
