import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const todaySource = await readFile(new URL('../../src/screens/Today.jsx', import.meta.url), 'utf8')

test('checkinRecap wrapper uses w-full to prevent flex-center compression', () => {
  const recapBlock = todaySource.slice(
    todaySource.indexOf("sub === 'checkinRecap'"),
    todaySource.indexOf('// ============================================================\n  // ТЕМА НЕДЕЛИ')
  )
  // The wrapper must include w-full so it fills the parent flex-col items-center
  // container instead of shrinking to content width.
  assert.match(recapBlock, /className="w-full max-w-md px-\[var\(--mx-screen-x\)\]"/)
  // Must NOT use the old bare padding-only wrapper
  assert.doesNotMatch(recapBlock, /className="px-\[var\(--mx-screen-x\)\]"/)
})
