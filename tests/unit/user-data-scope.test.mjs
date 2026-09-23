import assert from 'node:assert/strict'
import test from 'node:test'

function createStorage() {
  const values = new Map()
  return {
    get length() {
      return values.size
    },
    key(index) {
      return [...values.keys()][index] ?? null
    },
    getItem(key) {
      return values.get(key) ?? null
    },
    setItem(key, value) {
      values.set(String(key), String(value))
    },
    removeItem(key) {
      values.delete(String(key))
    },
  }
}

const localStorage = createStorage()
const sessionStorage = createStorage()
globalThis.window = { localStorage, sessionStorage }
globalThis.localStorage = localStorage
globalThis.sessionStorage = sessionStorage

const { switchUserDataScope, resetUserDataScopeForTests } = await import(
  '../../src/lib/userDataScope.js'
)
const { rememberSeriesSnapshot, peekSeriesSnapshot } = await import('../../src/lib/series.js')

test('MXL-P0-USER-SCOPE-001: A data is not visible after switching to B', () => {
  resetUserDataScopeForTests()
  switchUserDataScope(101)
  rememberSeriesSnapshot(101, { totalCheckins: 23, activeDays: 23 })
  sessionStorage.setItem('mentalix:today:snapshot:v1:101', JSON.stringify({ data: { owner: 'A' } }))

  switchUserDataScope(202)

  assert.equal(peekSeriesSnapshot(202), null)
  assert.equal(localStorage.getItem('mx-series-snapshot:101'), null)
  assert.equal(sessionStorage.getItem('mentalix:today:snapshot:v1:101'), null)
})
