import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

import {
  ONBOARDED_PROBE_TIMEOUT_MS,
  hasServerHistory,
  profileShowsHistory,
  resolveOnboardingGate,
  shouldProbeServerOnboarding,
} from '../../src/lib/onboardingReturningUser.js'

/*
 * ISSUE #1154 — Web/PWA: онбординг показывается снова уже знакомому человеку.
 *
 * Отметка «знакомство пройдено» (mx-onboarded-v2) синхронизируется через
 * CloudStorage Telegram, а вне Telegram живёт только в localStorage. Safari и
 * PWA на iOS хранят его раздельно, поэтому знакомый человек снова видел
 * знакомство. Здесь проверяется правило гейта: флага нет — спрашиваем сервер
 * (GET /profile, total_checkins) и знакомого пускаем в приложение без знакомства.
 */

const appSource = await readFile(new URL('../../src/App.jsx', import.meta.url), 'utf8')
const settingsSource = await readFile(
  new URL('../../src/screens/Settings.jsx', import.meta.url),
  'utf8'
)
const apiSource = await readFile(new URL('../../src/lib/api.js', import.meta.url), 'utf8')

// ── 1. Репро дефекта: знакомый + пустой localStorage ──

test('#1154: знакомый человек с пустым localStorage не проходит знакомство повторно', () => {
  // localStorage пуст (флага нет), сервер уже знает человека по данным.
  const gate = resolveOnboardingGate({ flag: null, serverStatus: 'known' })

  assert.deepEqual(gate, { onboarded: true, pending: false })
})

test('#1154: знакомство определяется по данным, которые отдаёт существующий GET /profile', async () => {
  const known = await hasServerHistory(900001, async () => ({ total_checkins: 3 }))
  const fresh = await hasServerHistory(900002, async () => ({ total_checkins: 0 }))

  assert.equal(known, true)
  assert.equal(fresh, false)
})

// ── 2. Пока идёт определение — нейтральная загрузка, знакомство не мелькает ──

test('критерий 2: пока идёт определение — загрузка, а не знакомство', () => {
  assert.deepEqual(resolveOnboardingGate({ flag: null, serverStatus: 'pending' }), {
    onboarded: false,
    pending: true,
  })
})

// ── 3. Сервер не ответил — прежнее поведение, без зависания и ошибок ──

test('критерий 3: сервер не ответил — знакомство как раньше', () => {
  assert.deepEqual(resolveOnboardingGate({ flag: null, serverStatus: 'unknown' }), {
    onboarded: false,
    pending: false,
  })
  assert.deepEqual(resolveOnboardingGate({ flag: null, serverStatus: 'off' }), {
    onboarded: false,
    pending: false,
  })
})

test('критерий 3: ошибка сервера не бросает исключение и не пишет в консоль', async () => {
  const original = console.error
  let logged = false
  console.error = () => {
    logged = true
  }
  try {
    const known = await hasServerHistory(900003, async () => {
      throw new Error('503 Service Unavailable')
    })
    assert.equal(known, false)
  } finally {
    console.error = original
  }
  assert.equal(logged, false)
})

test('критерий 3: молчащий сервер не подвешивает старт — ожидание ограничено', async () => {
  const started = Date.now()
  const known = await hasServerHistory(
    900004,
    (userId, { signal }) =>
      new Promise((resolve, reject) => {
        signal.addEventListener('abort', () => reject(new Error('aborted')))
      }),
    50
  )

  assert.equal(known, false)
  assert.ok(Date.now() - started < 2000, 'ожидание ограничено бюджетом проверки')
  assert.ok(
    ONBOARDED_PROBE_TIMEOUT_MS > 0 && ONBOARDED_PROBE_TIMEOUT_MS <= 10_000,
    'бюджет проверки не больше штатного таймаута API'
  )
})

test('критерий 3: проверка помечена silentDiagnostics, чтобы dev-диагностика не сыпала в консоль', () => {
  assert.match(
    apiSource,
    /get: \(userId, options = \{\}\) =>\s*\n?\s*request\(withQuery\('\/profile', \{ user_id: userId \}\), options\)/
  )
  assert.match(
    appSource,
    /api\.profile\.get\(userId, \{ \.\.\.options, silentDiagnostics: true \}\)/
  )
})

// ── 4. Новый аккаунт без данных видит знакомство ──

test('критерий 4: пустой профиль — это не знакомый человек', () => {
  assert.equal(profileShowsHistory({ total_checkins: 0 }), false)
  assert.equal(profileShowsHistory({}), false)
  assert.equal(profileShowsHistory(null), false)
  assert.deepEqual(resolveOnboardingGate({ flag: null, serverStatus: 'unknown' }), {
    onboarded: false,
    pending: false,
  })
})

test('критерий 4: проверка вообще не идёт, когда флаг уже стоит', () => {
  assert.equal(
    shouldProbeServerOnboarding({
      userId: 900005,
      onboarded: true,
      platformName: 'web',
      previewDemo: false,
      showGuestAuth: false,
      resetRequested: false,
    }),
    false
  )
})

// ── 5. Не изменилось: Telegram, демо, гостевой вход, сброс знакомства ──

test('критерий 5: путь Telegram не меняется — сервер не спрашиваем', () => {
  assert.equal(
    shouldProbeServerOnboarding({
      userId: 900006,
      onboarded: false,
      platformName: 'telegram',
      previewDemo: false,
      showGuestAuth: false,
      resetRequested: false,
    }),
    false
  )
})

test('критерий 5: в web знакомого ищем', () => {
  assert.equal(
    shouldProbeServerOnboarding({
      userId: 900007,
      onboarded: false,
      platformName: 'web',
      previewDemo: false,
      showGuestAuth: false,
      resetRequested: false,
    }),
    true
  )
})

test('критерий 5: демо-режим и экран входа не меняются', () => {
  assert.deepEqual(
    resolveOnboardingGate({ flag: '0', previewDemo: true, demoOnboardingRequested: false }),
    { onboarded: true, pending: false }
  )
  assert.deepEqual(
    resolveOnboardingGate({ flag: '0', previewDemo: true, demoOnboardingRequested: true }),
    { onboarded: false, pending: false }
  )
  assert.equal(
    shouldProbeServerOnboarding({
      userId: 900008,
      onboarded: false,
      platformName: 'web',
      previewDemo: true,
      showGuestAuth: false,
      resetRequested: false,
    }),
    false
  )
  assert.equal(
    shouldProbeServerOnboarding({
      userId: 900009,
      onboarded: false,
      platformName: 'web',
      previewDemo: false,
      showGuestAuth: true,
      resetRequested: false,
    }),
    false
  )
})

test('критерий 5: «Пройти знакомство заново» не перебивается серверными данными', () => {
  assert.equal(
    shouldProbeServerOnboarding({
      userId: 900010,
      onboarded: false,
      platformName: 'web',
      previewDemo: false,
      showGuestAuth: false,
      resetRequested: true,
    }),
    false
  )
  // Сброс помечается там же, где стирается отметка (Settings.jsx).
  assert.match(settingsSource, /await forget\('mx-onboarded-v2'\)/)
  assert.match(settingsSource, /markOnboardingResetRequested\(user\?\.id\)/)
})

// ── 6. Контракт App.jsx ──

test('App.jsx: гейт знакомства решается общей функцией, путь загрузки — Splash', () => {
  assert.match(appSource, /const onboardingGate = resolveOnboardingGate\(\{/)
  assert.match(appSource, /const onboarded = onboardingGate\.onboarded/)
  assert.match(appSource, /const onboardingPending = onboardingGate\.pending/)
  // Внутри гейта: сначала ожидание, знакомство — только после ответа сервера.
  const gateIndex = appSource.indexOf('if (user && !onboarded && !showGuestAuth) {')
  const splashIndex = appSource.indexOf('if (onboardingPending) return <Splash />')
  const onboardingIndex = appSource.indexOf(
    '<Onboarding user={user} onFinish={completeOnboarding} />'
  )

  assert.ok(gateIndex > -1, 'гейт знакомства на месте')
  assert.ok(splashIndex > gateIndex, 'пока идёт определение — Splash')
  assert.ok(onboardingIndex > splashIndex, 'знакомство — после проверки')
  // Знакомого по серверу запоминаем прежним флагом.
  assert.match(appSource, /if \(serverOnboarding === 'known' && onboardedFlag !== '1'\)/)
})
