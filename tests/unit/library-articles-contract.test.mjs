import assert from 'node:assert/strict'
import test from 'node:test'
import { readFile } from 'node:fs/promises'

const cacheSource = await readFile(
  new URL('../../src/lib/libraryDataCache.js', import.meta.url),
  'utf8'
)
const articlesSource = await readFile(
  new URL('../../src/screens/Articles.jsx', import.meta.url),
  'utf8'
)

test('MXL-526: кеш статей сохраняет body и source для Reader', () => {
  assert.match(cacheSource, /body: typeof article\?\.body === 'string' \? article\.body : ''/)
  assert.match(cacheSource, /source: typeof article\?\.source === 'string' \? article\.source : null/)
})

test('MXL-526: ошибка загрузки статей отделена от пустого состояния, есть retry', () => {
  assert.match(articlesSource, /setError\(true\)/)
  assert.match(articlesSource, /Не удалось загрузить статьи\. Проверь соединение\./)
  assert.match(articlesSource, /retryLoad/)
  assert.match(articlesSource, /Повторить/)
})
