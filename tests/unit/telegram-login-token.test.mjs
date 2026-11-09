import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

/*
 * R-10 (#1159): после входа через виджет Telegram в вебе клиент обязан
 * сохранять session_token так же, как для гостя и email-кода. Иначе в
 * Safari/PWA сессия теряется при обновлении страницы и повторном открытии
 * иконки «Домой»: токен нигде не запоминается.
 *
 * Тест дергает настоящий request() из src/lib/api.js с подменёнными
 * platform и fetch, поэтому проверяет фактическую ветку сохранения,
 * а не текст исходника.
 */

const apiSource = await readFile(new URL('../../src/lib/api.js', import.meta.url), 'utf8')
const load = source => import(`data:text/javascript;base64,${Buffer.from(source).toString('base64')}`)

const savedTokens = []
const clearedTokens = []

const deps = {
  platform: {
    setSessionToken: token => savedTokens.push(token),
    clearSessionToken: () => clearedTokens.push(true),
  },
  withQuery: path => path,
  demoRequest: () => ({}),
  isPreviewDemoMode: () => false,
  resetGuestState: () => {},
  dispatchGuestMerged: () => {},
  isProMockMode: () => false,
  proMockRequest: () => undefined,
}

globalThis.__apiTestEnv = { DEV: false, VITE_API_BASE_URL: '/api' }
globalThis.window = { location: { search: '' } }
globalThis.__apiTestDeps = deps

const apiModule = apiSource
  .replace(/^import .*\n/gm, '')
  .replaceAll('import.meta.env', 'globalThis.__apiTestEnv')
  .replace(
    'const BASE =',
    'const { platform, withQuery, demoRequest, isPreviewDemoMode, resetGuestState, dispatchGuestMerged, isProMockMode, proMockRequest } = globalThis.__apiTestDeps\nconst BASE ='
  )

const { api } = await load(apiModule)

function reply(status, body) {
  return {
    ok: status >= 200 && status < 300,
    status,
    text: async () => JSON.stringify(body),
    json: async () => body,
  }
}

async function callWithResponse(run, response) {
  savedTokens.length = 0
  const calls = []
  globalThis.fetch = async (url, options) => {
    calls.push({ url, options })
    return response
  }
  try {
    const result = await run()
    return { result, calls }
  } finally {
    delete globalThis.fetch
  }
}

test('R-10: /auth/telegram/login с session_token сохраняет токен сессии', async () => {
  const { calls } = await callWithResponse(
    () => api.auth.telegramLogin({ id: 1, hash: 'signed' }),
    reply(200, { session_token: 'tg-test-token', user: { web_user_id: 42 } })
  )

  assert.match(calls[0].url, /\/auth\/telegram\/login$/)
  assert.equal(calls[0].options.method, 'POST')
  assert.deepEqual(savedTokens, ['tg-test-token'])
})

test('R-10: /auth/telegram/login без session_token ничего не сохраняет', async () => {
  const { result } = await callWithResponse(
    () => api.auth.telegramLogin({ id: 1, hash: 'signed' }),
    reply(200, { user: { web_user_id: 42 } })
  )

  assert.deepEqual(result.user, { web_user_id: 42 })
  assert.deepEqual(savedTokens, [])
})

test('R-10: гостевой и email-пути сохраняют токен как раньше', async () => {
  await callWithResponse(() => api.auth.guest(), reply(200, { session_token: 'guest-token' }))
  assert.deepEqual(savedTokens, ['guest-token'])

  await callWithResponse(
    () => api.auth.verifyEmailCode('user@example.com', '123456'),
    reply(200, { session_token: 'email-token' })
  )
  assert.deepEqual(savedTokens, ['email-token'])
})

test('R-10: logout по-прежнему очищает токен сессии', async () => {
  clearedTokens.length = 0
  await callWithResponse(() => api.auth.logout(), reply(200, { ok: true }))
  assert.equal(clearedTokens.length, 1)
})
