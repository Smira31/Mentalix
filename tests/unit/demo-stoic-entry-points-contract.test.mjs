import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const today = await readFile(new URL('../../src/screens/Today.jsx', import.meta.url), 'utf8')

test('Demo exposes Stoic-inspired flexible entry points without changing production flow', () => {
  assert.match(today, /isPreviewDemoMode\(\)/)
  assert.match(today, /Другой способ начать/)
  assert.match(today, /Настроение/)
  assert.match(today, /Записать мысль/)
  assert.match(today, /Практика/)
  assert.match(today, /onOpenPractice\('journal'\)/)
})

test('Today keeps one primary CTA before optional entry points', () => {
  const heroStart = today.indexOf('const heroCheckinContent')
  const optionalStart = today.indexOf('Другой способ начать')

  assert.notEqual(heroStart, -1)
  assert.notEqual(optionalStart, -1)
  assert.ok(heroStart < optionalStart)
})

console.log('Demo Stoic entry-point contract passed')
