import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const historySource = await readFile(new URL('../../src/screens/History.jsx', import.meta.url), 'utf8')

test('recapOnly view does not show anxiety/focus with default value 3', () => {
  // Extract the recapOnly branch from HistoryDetail
  const recapStart = historySource.indexOf('{recapOnly ? (')
  assert.ok(recapStart >= 0, 'recapOnly branch not found')
  // Find the closing ") : (" after recapStart
  const elseStart = historySource.indexOf(') : (', recapStart)
  assert.ok(elseStart >= 0, 'else branch not found')
  const recapBlock = historySource.slice(recapStart, elseStart)

  // Must conditionally include anxiety and focus, not default to 3
  assert.match(recapBlock, /checkin\?\.energy != null \? \[/)
  assert.match(recapBlock, /checkin\?\.anxiety != null \? \[/)
  assert.match(recapBlock, /checkin\?\.focus != null \? \[/)
  // Must NOT use the old || 3 fallback
  assert.doesNotMatch(recapBlock, /anxiety \|\| 3/)
  assert.doesNotMatch(recapBlock, /focus \|\| 3/)
  assert.doesNotMatch(recapBlock, /energy \|\| 3/)
})

test('history list conditionally shows energy and focus pills', () => {
  // Extract the datedItems.map block
  const listStart = historySource.indexOf('datedItems.map(d => {')
  assert.ok(listStart >= 0, 'datedItems.map not found')
  // Find the end of the map block (closing of datedItems.map)
  const listEnd = historySource.indexOf('})', listStart)
  const listBlock = historySource.slice(listStart, listEnd)

  // energy and focus pills must be wrapped in conditional checks
  assert.match(listBlock, /d\.checkin\.energy != null && \(/)
  assert.match(listBlock, /d\.checkin\.focus != null && \(/)
})
