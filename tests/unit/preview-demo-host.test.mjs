import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

// Vite injects import.meta.env at build time; supply the preview build values in Node.
const source = (await readFile(new URL('../../src/lib/demoMode.js', import.meta.url), 'utf8')).replaceAll(
  'import.meta.env',
  "{ DEV: false, VITE_LOCAL_PREVIEW: 'true' }"
)
const { isPreviewDemoMode } = await import(
  `data:text/javascript,${encodeURIComponent(source)}`
)

test('Firebase PR preview permits demo but does not enable it on production or foreign hosts', () => {
  const originalWindow = globalThis.window
  try {
    const cases = [
      ['mentalix-production--pr-42-abcdef.web.app', '?demo=1', true],
      ['mentalix-production.web.app', '', false],
      ['foreign.example', '?demo=1', false],
    ]
    for (const [hostname, search, expected] of cases) {
      globalThis.window = { location: { hostname, search } }
      assert.equal(isPreviewDemoMode(), expected, `${hostname}${search}`)
    }
  } finally {
    if (originalWindow === undefined) delete globalThis.window
    else globalThis.window = originalWindow
  }
})
