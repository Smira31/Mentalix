import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const source = await readFile(new URL('../../src/screens/SeriesBadges.jsx', import.meta.url), 'utf8')

test('SeriesBadges uses the shared BackButton for returning to Today', () => {
  assert.ok(source.includes("import BackButton from '../components/BackButton'"))
  // Шапка переехала внутрь скролла: липкая стеклянная шапка (Stoic) для
  // режима вкладок, отдельная шапка «Назад» для «все значки».
  assert.ok(source.includes('<BackButton onClick={() => setShowAll(false)} />'))
  assert.ok(source.includes('<BackButton onClick={onBack} />'))
  assert.ok(source.includes("import { X } from 'lucide-react'"))
  assert.ok(source.includes('className="mx-path-close mx-tap-target"'))
})

test('badge sheet labels its practice action according to the badge', () => {
  assert.ok(source.includes("ritual-holds') return { route: 'rituals', label: 'Перейти к ритуалам' }"))
  assert.ok(source.includes("asceza-power') return { route: 'ascezas', label: 'Перейти к аскезам' }"))
  assert.ok(source.includes("first_journal') return { route: 'journal', label: 'Сделать запись' }"))
  assert.ok(source.includes('onOpenPractice?.(practice.route)'))
})
