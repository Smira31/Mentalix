import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { spawnSync } from 'node:child_process'
import test from 'node:test'
import { fileURLToPath } from 'node:url'

// Synthetic client and contract: never call production or publish backend contents.
const target =
  process.env.CONTRACT_TEST_TARGET ??
  fileURLToPath(new URL('./api-contract.test.mjs', import.meta.url))
const canonical = {
  endpoints: [{ method: 'GET', path: '/api/health', response_schema: { type: 'object' } }],
}
const markdown = (value) => '# Test fixture\n\n```json\n' + JSON.stringify(value) + '\n```\n'

function run(
  t,
  { text = markdown(canonical), required = 'true', absent = false, missingFile = false } = {}
) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'mentalix-contract-'))
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }))
  fs.mkdirSync(path.join(dir, 'tests/unit'), { recursive: true })
  fs.mkdirSync(path.join(dir, 'src/lib'), { recursive: true })
  fs.copyFileSync(target, path.join(dir, 'tests/unit/api-contract.test.mjs'))
  fs.writeFileSync(
    path.join(dir, 'src/lib/api.js'),
    "export const health = () => request('/health')\n"
  )
  const env = { ...process.env }
  delete env.CONTRACT_FILE
  delete env.CONTRACT_REQUIRED
  // A subprocess is a fresh test runner, not a worker of the parent runner.
  delete env.NODE_TEST_CONTEXT
  if (required) env.CONTRACT_REQUIRED = required
  if (!absent) {
    env.CONTRACT_FILE = path.join(dir, 'contract.md')
    if (!missingFile) fs.writeFileSync(env.CONTRACT_FILE, text)
  }
  const result = spawnSync(
    process.execPath,
    ['--test', '--test-reporter=tap', 'tests/unit/api-contract.test.mjs'],
    { cwd: dir, env, encoding: 'utf8', timeout: 10000 }
  )
  assert.equal(result.error, undefined, 'fixture runner must start and finish')
  assert.equal(result.signal, null, 'fixture runner must not time out or be killed')
  assert.equal(typeof result.status, 'number')
  assert.match(
    result.stdout,
    /# tests 2/,
    'fixture runner must execute the actual two contract tests'
  )
  return result
}

test('required mode must fail rather than silently skip without CONTRACT_FILE', (t) => {
  const result = run(t, { absent: true })
  assert.notEqual(result.status, 0, 'missing contract was reported as a successful run')
  assert.match(result.stdout, /CONTRACT_FILE/)
})

test('local optional mode keeps both contract checks explicitly skipped', (t) => {
  const result = run(t, { absent: true, required: '' })
  assert.equal(result.status, 0, result.stdout)
  assert.match(result.stdout, /# skipped 2/)
})

test('valid matching fixture executes two checks with no skips', (t) => {
  const result = run(t)
  assert.equal(result.status, 0, result.stdout)
  assert.match(result.stdout, /# pass 2/)
  assert.match(result.stdout, /# skipped 0/)
})

test('configured but missing file fails', (t) => {
  assert.notEqual(run(t, { missingFile: true }).status, 0)
})

test('malformed JSON fails', (t) => {
  assert.notEqual(run(t, { text: '```json\n{broken}\n```\n' }).status, 0)
})

test('missing JSON block fails', (t) => {
  assert.notEqual(run(t, { text: '# No machine-readable contract\n' }).status, 0)
})

test('missing response metadata fails', (t) => {
  const fixture = { endpoints: [{ method: 'GET', path: '/api/health' }] }
  assert.notEqual(run(t, { text: markdown(fixture) }).status, 0)
})

test('endpoint mismatch is not weakened', (t) => {
  const fixture = {
    endpoints: [{ method: 'POST', path: '/api/health', response_schema: { type: 'object' } }],
  }
  assert.notEqual(run(t, { text: markdown(fixture) }).status, 0)
})
