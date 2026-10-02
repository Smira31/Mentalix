import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const source = await readFile(new URL('../../src/screens/Practices.jsx', import.meta.url), 'utf8')

const catalog = await readFile(
  new URL('../../src/components/PracticeCatalogV2.jsx', import.meta.url),
  'utf8'
)

test('Practices exposes honest loading/error/retry states', () => {
  assert.match(source, /useState\(!initialPracticesData\)/)
  assert.match(source, /role="status" aria-live="polite"/)
  // Ошибка не прячет весь каталог: она показывается в плитках коллекций с «Повторить».
  assert.doesNotMatch(source, /Не удалось загрузить практики/)
  assert.match(source, /collectionsError=\{Boolean\(loadError\)\}/)
  assert.match(source, /onRetryCollections=\{retryPractices\}/)
  assert.match(catalog, /role="alert"/)
  assert.match(catalog, /Не удалось загрузить ритуалы и аскезы/)
})

test('Practices force retry uses the existing cache API without changing contracts', () => {
  assert.match(source, /fetchPracticesData\(user\.id, \{\s*force,\s*\}\)/)
  assert.match(source, /setRituals\(ritualsData\)/)
  assert.match(source, /setAscezas\(ascezasData\)/)
})
