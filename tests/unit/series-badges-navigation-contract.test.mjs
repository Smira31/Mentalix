import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const source = await readFile(new URL('../../src/screens/SeriesBadges.jsx', import.meta.url), 'utf8')

test('SeriesBadges uses the shared BackButton for returning to Today', () => {
  assert.ok(source.includes("import BackButton from '../components/BackButton'"))
  assert.ok(source.includes('<BackButton onClick={onBack} label="Сегодня" />'))
  assert.ok(source.includes("import { X } from 'lucide-react'"))
  assert.ok(source.includes('className="mx-path-close"'))
})
