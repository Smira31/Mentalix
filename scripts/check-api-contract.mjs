import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const maxBytes = 1024 * 1024
const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const result = (status, reason) => ({ status, reason, exitCode: status === 'ERROR' ? 1 : 0 })

async function boundedText(response) {
  if (!response.body) throw new Error('missing_body')
  const chunks = []
  let bytes = 0
  for await (const chunk of response.body) {
    bytes += chunk.byteLength
    if (bytes > maxBytes) throw new Error('oversized_body')
    chunks.push(Buffer.from(chunk))
  }
  return Buffer.concat(chunks).toString('utf8')
}

function validContract(text) {
  try {
    const block = text.match(/```json\r?\n([\s\S]*?)\r?\n```/)
    if (!block) return false
    const contract = JSON.parse(block[1])
    return Array.isArray(contract?.endpoints)
  } catch {
    return false
  }
}

function defaultRunTests(file) {
  const env = { ...process.env, CONTRACT_FILE: file, CONTRACT_REQUIRED: 'true' }
  delete env.BACKEND_CONTRACT_TOKEN
  delete env.NODE_TEST_CONTEXT
  return spawnSync(
    process.execPath,
    ['--test', '--test-reporter=tap', path.join(repoRoot, 'tests/unit/api-contract.test.mjs')],
    { cwd: repoRoot, env, encoding: 'utf8', timeout: 60000, maxBuffer: maxBytes }
  )
}

export async function checkContract({
  trusted = false,
  sha = '',
  token = '',
  fetchImpl = globalThis.fetch,
  runTests = defaultRunTests,
} = {}) {
  if (!trusted) return result('SKIPPED', 'untrusted_context')
  if (!/^[a-f0-9]{40}$/i.test(sha)) return result('ERROR', 'invalid_backend_sha')
  if (!token.trim()) return result('SKIPPED', 'missing_credential')
  let text
  try {
    const url =
      'https://api.github.com/repos/Smira31/mentalix-bot/contents/docs/API_CONTRACT.md?ref=' + sha
    const response = await fetchImpl(url, {
      headers: {
        Accept: 'application/vnd.github.raw+json',
        Authorization: `Bearer ${token}`,
        'X-GitHub-Api-Version': '2022-11-28',
      },
      redirect: 'error',
      signal: AbortSignal.timeout(15000),
    })
    if (!response.ok) {
      await response.body?.cancel()
      return result('ERROR', `http_${response.status}`)
    }
    text = await boundedText(response)
  } catch {
    return result('ERROR', 'download_failed')
  }
  if (!validContract(text)) return result('ERROR', 'invalid_contract')
  let dir
  let outcome
  try {
    dir = fs.mkdtempSync(path.join(os.tmpdir(), 'mentalix-private-contract-'))
    fs.chmodSync(dir, 0o700)
    const file = path.join(dir, 'API_CONTRACT.md')
    fs.writeFileSync(file, text, { mode: 0o600, flag: 'wx' })
    const checks = await runTests(file)
    if (checks.error || checks.signal || checks.status !== 0) {
      outcome = result('ERROR', 'contract_tests_failed')
    } else if (!/# pass 2\r?\n/.test(checks.stdout) || !/# skipped 0\r?\n/.test(checks.stdout)) {
      outcome = result('ERROR', 'contract_checks_incomplete')
    } else {
      outcome = result('VERIFIED', 'inventory_and_metadata')
    }
  } catch {
    outcome = result('ERROR', 'contract_tests_failed')
  } finally {
    if (dir) {
      try {
        fs.rmSync(dir, { recursive: true, force: true })
      } catch {
        outcome = result('ERROR', 'cleanup_failed')
      }
    }
  }
  return outcome
}

export function reportContract(outcome, log = console.log) {
  // Suppress raw exceptions, private contract contents, test output and diffs.
  log(`CONTRACT_STATUS=${outcome.status} reason=${outcome.reason}`)
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const outcome = await checkContract({
    trusted: process.env.CONTRACT_TRUSTED_CONTEXT === 'true',
    sha: process.env.BACKEND_SHA,
    token: process.env.BACKEND_CONTRACT_TOKEN,
  })
  reportContract(outcome)
  if (process.env.GITHUB_STEP_SUMMARY) {
    try {
      fs.appendFileSync(
        process.env.GITHUB_STEP_SUMMARY,
        `\n### Контракт API\n\nСтатус: **${outcome.status}**. Причина: ${outcome.reason}.\n\nПроверяется inventory и наличие metadata, не production-ответы.\n`
      )
    } catch {
      console.log('CONTRACT_SUMMARY=ERROR reason=summary_write_failed')
    }
  }
  process.exitCode = outcome.exitCode
}
