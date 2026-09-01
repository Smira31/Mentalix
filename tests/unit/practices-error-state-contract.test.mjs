import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const source = await readFile(new URL('../../src/screens/Practices.jsx', import.meta.url), 'utf8')

test('Practices exposes honest loading/error/retry states', () => {
  assert.match(source, /useState\(!initialPracticesData\)/)
  assert.match(source, /role="status" aria-live="polite"/)
  assert.match(source, /role="alert"/)
  assert.match(source, /Не удалось загрузить практики/)
  assert.match(source, /loadPractices\(true\)/)
})

test('Practices force retry uses the existing cache API without changing contracts', () => {
  assert.match(source, /fetchPracticesData\(user\.id, \{\s*force,\s*\}\)/)
  assert.match(source, /setRituals\(ritualsData\)/)
  assert.match(source, /setAscezas\(ascezasData\)/)
})
