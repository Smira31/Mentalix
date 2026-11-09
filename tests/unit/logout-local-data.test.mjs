// ISSUE #1166 — веб/PWA: при «Выйти» личные данные стираются с устройства.
//
// Контракт clearLocalUserData: личных ключей после выхода нет ни в
// localStorage, ни в sessionStorage; оформление устройства (тема, акцент) и
// отметка «человек вышел сам» остаются. Удаление аккаунта
// (clearAllLocalUserData) по-прежнему стирает всё, кроме ключей Telegram SDK.

import assert from 'node:assert/strict'
import test from 'node:test'

function createStorage(initial = {}) {
  const values = new Map(Object.entries(initial))
  return {
    get length() {
      return values.size
    },
    key(index) {
      return [...values.keys()][index] ?? null
    },
    getItem(key) {
      return values.get(String(key)) ?? null
    },
    setItem(key, value) {
      values.set(String(key), String(value))
    },
    removeItem(key) {
      values.delete(String(key))
    },
  }
}

function useStorages(local = {}, session = {}) {
  const localStorage = createStorage(local)
  const sessionStorage = createStorage(session)
  globalThis.window = { localStorage, sessionStorage }
  globalThis.localStorage = localStorage
  globalThis.sessionStorage = sessionStorage
  return { localStorage, sessionStorage }
}

const { clearLocalUserData, clearAllLocalUserData } = await import(
  '../../src/lib/localUserData.js'
)
const { hasLocalHeroJourneyData } = await import('../../src/lib/heroJourneyState.js')

const USER_ID = 900001

const PERSONAL_LOCAL_KEYS = {
  mentalix_web_user: JSON.stringify({ id: USER_ID, first_name: 'Человек' }),
  mentalix_session_token: 'session-token',
  mentalix_guest_merge_token: 'guest-token',
  'mx-onboarded-v2': '1',
  'mx-onboarding-progress': JSON.stringify({ goal: 'спокойствие' }),
  'mx-birthday': '1990-05-17',
  'mx-app-lock-pin': 'hash:salt',
  'mx-app-lock-enabled': '1',
  [`mx-checkin-draft-v1:${USER_ID}:2026-11-09`]: JSON.stringify({ mood: 4 }),
  [`mx-journal-draft-v3:${USER_ID}`]: JSON.stringify({ text: 'черновик' }),
  [`mx-series-snapshot:${USER_ID}`]: JSON.stringify({ totalCheckins: 12 }),
  [`mx-hero-journey-progress:${USER_ID}`]: JSON.stringify({
    completed: { uncertainty: '2026-11-01' },
    signs: {},
    reflections: {},
    actions: {},
  }),
  'mx-wtp-concept-test-v1:answers': JSON.stringify({ price: 399 }),
}

const PERSONAL_SESSION_KEYS = {
  [`mentalix:today:snapshot:v1:${USER_ID}`]: JSON.stringify({ data: { owner: 'me' } }),
  [`mentalix:trends:snapshot:v2:${USER_ID}:7`]: JSON.stringify({ points: [1, 2] }),
  'mx-mentor-draft': 'черновик сообщения',
}

// Нейтральные ключи устройства и служебные ключи Telegram SDK.
const PRESERVED_LOCAL_KEYS = {
  'mx-web-logged-out': '1',
  'mx-theme': 'dark',
  'mx-accent-color': 'ice',
  '__telegram__initParams': JSON.stringify({ tgWebAppVersion: '6.0' }),
}

test('#1166: после выхода личных ключей нет, отметка выхода на месте', () => {
  const { localStorage, sessionStorage } = useStorages(
    { ...PERSONAL_LOCAL_KEYS, ...PRESERVED_LOCAL_KEYS },
    { ...PERSONAL_SESSION_KEYS }
  )

  clearLocalUserData()

  for (const key of Object.keys(PERSONAL_LOCAL_KEYS)) {
    assert.equal(localStorage.getItem(key), null, `личный ключ остался: ${key}`)
  }
  for (const key of Object.keys(PERSONAL_SESSION_KEYS)) {
    assert.equal(sessionStorage.getItem(key), null, `личный ключ остался: ${key}`)
  }
  for (const [key, value] of Object.entries(PRESERVED_LOCAL_KEYS)) {
    assert.equal(localStorage.getItem(key), value, `нейтральный ключ удалён: ${key}`)
  }
})

test('#1166: выход не трогает данные удаления аккаунта — удаление стирает всё', () => {
  const { localStorage } = useStorages({ ...PERSONAL_LOCAL_KEYS, ...PRESERVED_LOCAL_KEYS })

  clearAllLocalUserData()

  for (const key of [...Object.keys(PERSONAL_LOCAL_KEYS), 'mx-theme', 'mx-accent-color']) {
    assert.equal(localStorage.getItem(key), null, `ключ остался после удаления аккаунта: ${key}`)
  }
  assert.equal(
    localStorage.getItem('__telegram__initParams'),
    PRESERVED_LOCAL_KEYS['__telegram__initParams']
  )
})

test('#1166: прогресс «Пути героя» считается, только когда он не пуст', () => {
  const empty = JSON.stringify({ completed: {}, signs: {}, reflections: {}, actions: {} })

  useStorages({ [`mx-hero-journey-progress:${USER_ID}`]: empty })
  assert.equal(hasLocalHeroJourneyData(USER_ID), false, 'пустой прогресс — не данные')

  useStorages({
    [`mx-hero-journey-progress:${USER_ID}`]: JSON.stringify({
      completed: { uncertainty: '2026-11-01' },
      signs: {},
      reflections: {},
      actions: {},
    }),
  })
  assert.equal(hasLocalHeroJourneyData(USER_ID), true, 'пройденный шаг — данные')

  useStorages({ [`mx-hero-journey-draft:${USER_ID}:uncertainty`]: 'ответ на шаге' })
  assert.equal(hasLocalHeroJourneyData(USER_ID), true, 'черновик шага — данные')

  useStorages({})
  assert.equal(hasLocalHeroJourneyData(USER_ID), false, 'пустое хранилище — предупреждения нет')
})
