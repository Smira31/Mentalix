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

test('badge sheet labels its practice action according to the badge', () => {
  assert.ok(source.includes("voice-heard') return { route: 'checkin', label: 'Утренний чек-ин' }"))
  assert.ok(source.includes("ritual-holds') return { route: 'rituals', label: 'Ритуалы' }"))
  assert.ok(source.includes("asceza-power') return { route: 'ascezas', label: 'Аскезы' }"))
  assert.ok(source.includes('onOpenPractice?.(practice.route)'))
})
