import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const adapterSource = await readFile(new URL('../../src/platform/web.adapter.js', import.meta.url), 'utf8')
const apiSource = await readFile(new URL('../../src/lib/api.js', import.meta.url), 'utf8')
const load = source => import(`data:text/javascript;base64,${Buffer.from(source).toString('base64')}`)

const { webAdapter } = await load(adapterSource.replaceAll('import.meta.env', 'globalThis.__webTestEnv'))
const apiModule = apiSource
  .replace(/^import .*\n/gm, '')
  .replaceAll('import.meta.env', 'globalThis.__webTestEnv')
  .replace("const BASE =", "const { platform, withQuery, demoRequest, isPreviewDemoMode, resetGuestState, dispatchGuestMerged } = globalThis.__webTestDeps\nconst BASE =")

function storage() {
  const items = new Map()
  return {
    getItem: key => items.get(key) ?? null,
    setItem: (key, value) => items.set(key, value),
    removeItem: key => items.delete(key),
  }
}

function reply(status, body) {
  return { ok: status >= 200 && status < 300, status, text: async () => JSON.stringify(body), json: async () => body }
}

test('web bearer session: login, restore, 401, logout and legacy cookie fallback', async () => {
  globalThis.__webTestEnv = { DEV: false, VITE_LOCAL_PREVIEW: 'false', VITE_API_BASE_URL: '/api' }
  globalThis.localStorage = storage()
  globalThis.window = { location: { search: '' } }
  let demo = false
  globalThis.__webTestDeps = {
    platform: webAdapter,
    withQuery: path => path,
    demoRequest: () => ({ demo: true }),
    isPreviewDemoMode: () => demo,
    resetGuestState: () => {},
    dispatchGuestMerged: () => {},
  }
  const { api } = await load(apiModule)
  const calls = []
  let response = reply(200, { user: { web_user_id: 17 } })
  globalThis.fetch = async (url, options) => {
    calls.push({ url, options })
    return response
  }

  try {
    for (const login of [api.auth.guest, () => api.auth.guestMerge('merge'), () => api.auth.verify('a@b.com', '123456'), () => api.auth.verifyEmailCode('a@b.com', '123456')]) {
      localStorage.removeItem('mentalix_session_token')
      response = reply(200, { session_token: 'web-token', user: { web_user_id: 17 } })
      await login()
      assert.equal(localStorage.getItem('mentalix_session_token'), 'web-token')
      response = reply(200, { authenticated: true, user: { web_user_id: 17 } })
      await webAdapter.requestAuth()
      assert.equal(calls.at(-1).options.headers.Authorization, 'Bearer web-token')
      assert.equal(calls.at(-1).options.credentials, 'include')
      await api.health.check()
      assert.equal(calls.at(-1).options.headers.Authorization, 'Bearer web-token')
      assert.equal(calls.at(-1).options.credentials, 'include')
    }

    response = reply(401, { detail: 'unauthorized' })
    await assert.rejects(api.health.check(), { status: 401 })
    assert.equal(localStorage.getItem('mentalix_session_token'), null)
    localStorage.setItem('mentalix_session_token', 'expired')
    await assert.rejects(webAdapter.requestAuth(), /Web session restore failed: 401/)
    assert.equal(localStorage.getItem('mentalix_session_token'), null)

    localStorage.setItem('mentalix_session_token', 'logout-token')
    response = reply(200, { ok: true })
    await api.auth.logout()
    assert.equal(calls.at(-1).options.headers.Authorization, 'Bearer logout-token')
    assert.equal(localStorage.getItem('mentalix_session_token'), null)
    response = reply(500, { detail: 'error' })
    localStorage.setItem('mentalix_session_token', 'logout-error')
    await assert.rejects(api.auth.logout())
    assert.equal(localStorage.getItem('mentalix_session_token'), null)

    response = reply(200, { user: { web_user_id: 17 } })
    await api.auth.guest()
    assert.equal(localStorage.getItem('mentalix_session_token'), null)
    await api.health.check()
    assert.equal(calls.at(-1).options.headers.Authorization, undefined)
    assert.equal(calls.at(-1).options.credentials, 'include')

    const requestsBeforeDemo = calls.length
    demo = true
    assert.deepEqual(await api.auth.guest(), { demo: true })
    assert.equal(calls.length, requestsBeforeDemo)
    demo = false

    globalThis.localStorage = {
      getItem: () => { throw new Error('blocked') },
      setItem: () => { throw new Error('blocked') },
      removeItem: () => { throw new Error('blocked') },
    }
    response = reply(200, { session_token: 'blocked-token', user: {} })
    await api.auth.guest()
    await api.health.check()
    assert.equal(calls.at(-1).options.headers.Authorization, undefined)
  } finally {
    delete globalThis.fetch
    delete globalThis.localStorage
    delete globalThis.window
    delete globalThis.__webTestDeps
    delete globalThis.__webTestEnv
  }
})
