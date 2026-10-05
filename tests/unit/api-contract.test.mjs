import assert from 'node:assert/strict'
import fs from 'node:fs'
import test from 'node:test'

const contractPath = process.env.CONTRACT_FILE
const contractRequired = process.env.CONTRACT_REQUIRED === 'true'
const contractSkip =
  !contractPath && !contractRequired
    ? 'SKIPPED: CONTRACT_FILE не задан; совместимость API не проверена'
    : false

function readContract() {
  assert.ok(contractPath, 'CONTRACT_FILE обязателен в режиме CONTRACT_REQUIRED=true')
  let contractText
  try {
    contractText = fs.readFileSync(contractPath, 'utf8')
  } catch {
    assert.fail('Не удалось прочитать файл API-контракта')
  }
  const block = contractText.match(/```json\r?\n([\s\S]*?)\r?\n```/)
  assert.ok(block, 'В API-контракте отсутствует JSON-блок')
  let contract
  try {
    contract = JSON.parse(block[1])
  } catch {
    assert.fail('JSON API-контракта повреждён')
  }
  assert.ok(Array.isArray(contract?.endpoints), 'API-контракт должен содержать массив endpoints')
  return contract
}
const source = fs.readFileSync(new URL('../../src/lib/api.js', import.meta.url), 'utf8')

const normalize = path => path.replace(/\$\{[^}]+\}/g, '{param}')
const used = new Set()
const pathPattern = /[`'\"](\/[^`'\"]+)[`'\"]/g
for (const match of source.matchAll(pathPattern)) {
  const raw = match[1]
  if (raw === '/api' || raw.startsWith('/api/')) continue
  const path = normalize(raw)
  const nextRequest = source.indexOf('request(', match.index + match[0].length)
  const snippet = source.slice(match.index + match[0].length, nextRequest < 0 ? match.index + 260 : nextRequest)
  const method = snippet.match(/method:\s*['\"](GET|POST|PUT|PATCH|DELETE)/)?.[1] ?? 'GET'
  used.add(`${method} /api${path}`)
}

test('frontend API calls match the canonical backend contract', { skip: contractSkip }, () => {
  const contract = readContract()
  const expected = new Set(contract.endpoints.map(item => `${item.method} ${normalize(item.path)}`))
  assert.deepEqual([...used].sort(), [...expected].sort())
})

test('contract contains response shape metadata for every frontend call', { skip: contractSkip }, () => {
  const contract = readContract()
  for (const item of contract.endpoints) {
    assert.ok(item.response_schema, `${item.method} ${item.path} has no response shape`)
  }
})
