import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import test from 'node:test'
import { fileURLToPath, pathToFileURL } from 'node:url'

const moduleUrl = new URL('../../scripts/check-api-contract.mjs', import.meta.url)
const { checkContract, reportContract } = await import(moduleUrl)
const sha = 'a'.repeat(40)
const token = 'fixture-token-never-real'
const content =
  '# PRIVATE-FIXTURE-MARKER\n```json\n' +
  JSON.stringify({
    endpoints: [{ method: 'GET', path: '/api/fixture', response_schema: { type: 'object' } }],
  }) +
  '\n```\n'
const goodRun = () => ({ status: 0, signal: null, stdout: '# pass 2\n# skipped 0\n' })
const defaults = () => ({
  trusted: true,
  sha,
  token,
  fetchImpl: async () => new Response(content),
  runTests: goodRun,
})
const mustNotRun = () => {
  assert.fail('no request or test execution is allowed')
}

test('untrusted PR context skips without network access', async () => {
  const r = await checkContract({
    ...defaults(),
    trusted: false,
    fetchImpl: mustNotRun,
    runTests: mustNotRun,
  })
  assert.equal(r.status, 'SKIPPED')
  assert.equal(r.reason, 'untrusted_context')
  assert.equal(r.exitCode, 0)
})
test('missing credential is explicitly skipped', async () => {
  const r = await checkContract({ ...defaults(), token: '', fetchImpl: mustNotRun })
  assert.equal(r.status, 'SKIPPED')
  assert.equal(r.reason, 'missing_credential')
})
test('invalid SHA is rejected before network', async () => {
  const r = await checkContract({ ...defaults(), sha: 'main', fetchImpl: mustNotRun })
  assert.equal(r.status, 'ERROR')
  assert.equal(r.reason, 'invalid_backend_sha')
})
test('authenticated fetch is pinned, bounded by timeout, and forbids redirects', async () => {
  let called = 0
  const r = await checkContract({
    ...defaults(),
    fetchImpl: async (url, options) => {
      called++
      assert.equal(
        url,
        'https://api.github.com/repos/Smira31/mentalix-bot/contents/docs/API_CONTRACT.md?ref=' + sha
      )
      assert.equal(options.headers.Authorization, `Bearer ${token}`)
      assert.equal(options.redirect, 'error')
      assert.ok(options.signal instanceof AbortSignal)
      return new Response(content)
    },
  })
  assert.equal(called, 1)
  assert.equal(r.status, 'VERIFIED')
  assert.equal(r.exitCode, 0)
})
for (const status of [401, 403, 404, 500]) {
  test(`HTTP ${status} cannot run checks`, async () => {
    const r = await checkContract({
      ...defaults(),
      fetchImpl: async () => new Response('DO-NOT-LOG', { status }),
      runTests: mustNotRun,
    })
    assert.equal(r.status, 'ERROR')
    assert.equal(r.reason, `http_${status}`)
    assert.equal(r.exitCode, 1)
  })
}
for (const failure of ['network', 'timeout']) {
  test(`${failure} is sanitized`, async () => {
    const r = await checkContract({
      ...defaults(),
      fetchImpl: async () => {
        throw new Error(failure + token + content)
      },
      runTests: mustNotRun,
    })
    assert.equal(r.status, 'ERROR')
    assert.equal(r.reason, 'download_failed')
    assert.ok(!JSON.stringify(r).includes(token))
    assert.ok(!JSON.stringify(r).includes('PRIVATE-FIXTURE-MARKER'))
  })
}
for (const text of ['```json\n{bad}\n```', '# No JSON', '```json\n{}\n```']) {
  test('damaged contract cannot reach runner', async () => {
    const r = await checkContract({
      ...defaults(),
      fetchImpl: async () => new Response(text),
      runTests: mustNotRun,
    })
    assert.equal(r.status, 'ERROR')
    assert.equal(r.reason, 'invalid_contract')
  })
}
test('download size is bounded', async () => {
  const r = await checkContract({
    ...defaults(),
    fetchImpl: async () => new Response('x'.repeat(1024 * 1024 + 1)),
    runTests: mustNotRun,
  })
  assert.equal(r.status, 'ERROR')
  assert.equal(r.reason, 'download_failed')
})
test('owner-only private temp file is removed after success', async () => {
  let file
  const r = await checkContract({
    ...defaults(),
    runTests: (f) => {
      file = f
      assert.equal(fs.readFileSync(f, 'utf8'), content)
      assert.equal(fs.statSync(f).mode & 0o777, 0o600)
      assert.equal(fs.statSync(path.dirname(f)).mode & 0o777, 0o700)
      return goodRun()
    },
  })
  assert.equal(r.status, 'VERIFIED')
  assert.ok(file)
  assert.equal(fs.existsSync(path.dirname(file)), false)
})
test('private failure output and credential are not logged', async () => {
  let file
  const r = await checkContract({
    ...defaults(),
    runTests: (f) => {
      file = f
      return { status: 1, signal: null, stdout: content, stderr: token }
    },
  })
  assert.equal(r.status, 'ERROR')
  assert.equal(r.reason, 'contract_tests_failed')
  assert.equal(fs.existsSync(path.dirname(file)), false)
  const logs = []
  reportContract(r, (line) => logs.push(line))
  assert.ok(!logs.join('\n').includes(token))
  assert.ok(!logs.join('\n').includes('PRIVATE-FIXTURE-MARKER'))
})
test('successful exit with skipped checks is not verification', async () => {
  const r = await checkContract({
    ...defaults(),
    runTests: () => ({ status: 0, stdout: '# pass 0\n# skipped 2\n' }),
  })
  assert.equal(r.status, 'ERROR')
  assert.equal(r.reason, 'contract_checks_incomplete')
})
test('runner exception is sanitized and temporary file cleaned', async () => {
  let file
  const r = await checkContract({
    ...defaults(),
    runTests: (f) => {
      file = f
      throw new Error(token + content)
    },
  })
  assert.equal(r.status, 'ERROR')
  assert.equal(r.reason, 'contract_tests_failed')
  assert.equal(fs.existsSync(path.dirname(file)), false)
  assert.ok(!JSON.stringify(r).includes(token))
})
test('real child runner gets strict mode and no credential (synthetic client)', async (t) => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'mentalix-runner-integration-'))
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }))
  fs.mkdirSync(path.join(dir, 'scripts'))
  fs.mkdirSync(path.join(dir, 'tests/unit'), { recursive: true })
  fs.mkdirSync(path.join(dir, 'src/lib'), { recursive: true })
  fs.copyFileSync(fileURLToPath(moduleUrl), path.join(dir, 'scripts/check-api-contract.mjs'))
  const source = fs.readFileSync(new URL('./api-contract.test.mjs', import.meta.url), 'utf8')
  fs.writeFileSync(
    path.join(dir, 'tests/unit/api-contract.test.mjs'),
    source + '\nassert.equal(process.env.BACKEND_CONTRACT_TOKEN, undefined)\n'
  )
  fs.writeFileSync(
    path.join(dir, 'src/lib/api.js'),
    "export const fixture = () => request('/fixture')\n"
  )
  const isolated = await import(pathToFileURL(path.join(dir, 'scripts/check-api-contract.mjs')))
  const prior = process.env.BACKEND_CONTRACT_TOKEN
  try {
    process.env.BACKEND_CONTRACT_TOKEN = token
    const r = await isolated.checkContract({
      trusted: true,
      sha,
      token,
      fetchImpl: async () => new Response(content),
    })
    assert.equal(r.status, 'VERIFIED')
  } finally {
    if (prior === undefined) delete process.env.BACKEND_CONTRACT_TOKEN
    else process.env.BACKEND_CONTRACT_TOKEN = prior
  }
})
