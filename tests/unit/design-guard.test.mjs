import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import { fileURLToPath } from 'node:url'

const script = new URL('../../scripts/design-guard.mjs', import.meta.url)
const packageJson = JSON.parse(
  readFileSync(new URL('../../package.json', import.meta.url), 'utf8')
)

test('design guard is exposed as a deterministic project check', () => {
  assert.equal(packageJson.scripts['test:design-guard'], 'node scripts/design-guard.mjs')

  const output = execFileSync(process.execPath, [fileURLToPath(script)], {
    encoding: 'utf8',
  })

  assert.match(output, /Design guard passed:/)
})
