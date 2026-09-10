import assert from 'node:assert/strict'
import fs from 'node:fs'
import test from 'node:test'

const contractPath = process.env.CONTRACT_FILE
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

test('frontend API calls match the canonical backend contract', { skip: !contractPath }, () => {
  const contractText = fs.readFileSync(contractPath, 'utf8')
  const contract = JSON.parse(contractText.match(/```json\n([\s\S]*?)\n```/)[1])
  const expected = new Set(contract.endpoints.map(item => `${item.method} ${normalize(item.path)}`))
  assert.deepEqual([...used].sort(), [...expected].sort())
})

test('contract contains response shape metadata for every frontend call', { skip: !contractPath }, () => {
  const contractText = fs.readFileSync(contractPath, 'utf8')
  const contract = JSON.parse(contractText.match(/```json\n([\s\S]*?)\n```/)[1])
  for (const item of contract.endpoints) {
    assert.ok(item.response_schema, `${item.method} ${item.path} has no response shape`)
  }
})
