import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const historySource = await readFile(new URL('../../src/screens/History.jsx', import.meta.url), 'utf8')

test('recapOnly view shows all morning answers in check-in order, no default-3 fallback', () => {
  // Extract the recapOnly branch from HistoryDetail
  const recapStart = historySource.indexOf('{recapOnly ? (')
  assert.ok(recapStart >= 0, 'recapOnly branch not found')
  // Find the closing ") : (" after recapStart
  const elseStart = historySource.indexOf(') : (', recapStart)
  assert.ok(elseStart >= 0, 'else branch not found')
  const recapBlock = historySource.slice(recapStart, elseStart)

  // T11: all morning answers must be conditional (no default-3 fallback)
  assert.match(recapBlock, /checkin\?\.mood != null \? \[/)
  assert.match(recapBlock, /checkin\?\.sleep_quality != null\s*\n\s*\? \[/)
  assert.match(recapBlock, /checkin\?\.energy != null \? \[/)
  assert.match(recapBlock, /checkin\?\.focus != null \? \[/)
  assert.match(recapBlock, /checkin\?\.day_focus \? \[/)
  assert.match(recapBlock, /checkin\?\.note \? \[/)
  // Must NOT use the old || 3 fallback
  assert.doesNotMatch(recapBlock, /anxiety \|\| 3/)
  assert.doesNotMatch(recapBlock, /focus \|\| 3/)
  assert.doesNotMatch(recapBlock, /energy \|\| 3/)
  // anxiety is not a morning check-in step — must not appear in recap
  assert.doesNotMatch(recapBlock, /anxiety/)
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
