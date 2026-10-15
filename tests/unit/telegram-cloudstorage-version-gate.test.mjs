import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

/*
 * CloudStorage существует с Bot API 6.9. SDK определяет объект всегда, но на
 * клиенте старее вызов метода пишет в консоль
 * `[Telegram.WebApp] CloudStorage is not supported in version 6.0` и бросает
 * WebAppMethodUnsupported. В браузере (в том числе в превью Base44) SDK создаёт
 * WebApp с версией «6.0», поэтому без версионного гейта консоль превью шумит
 * ошибкой при каждой загрузке; гейт однажды уже терялся при переносе Pro.
 * Вне Telegram облако не используется, значения остаются в localStorage.
 */

const hooksSource = await readFile(
  new URL('../../src/platform/telegram.hooks.js', import.meta.url),
  'utf8'
)

test('все методы cloud проверяют версию клиента до вызова CloudStorage', () => {
  assert.match(hooksSource, /function cloudStorageUsable\(storage, method\)/)
  assert.match(hooksSource, /webApp\.isVersionAtLeast\('6\.9'\)/)

  for (const method of ['getItem', 'setItem', 'getKeys', 'removeItem']) {
    assert.match(
      hooksSource,
      new RegExp(`cloudStorageUsable\\(storage, '${method}'\\)`),
      `метод ${method} идёт через версионный гейт`
    )
  }
})

test('без гейта в cloud.* нет прямых обращений к методам CloudStorage', () => {
  const cloudSection = hooksSource.slice(
    hooksSource.indexOf('export const cloud = {'),
    hooksSource.indexOf('БИОМЕТРИЯ')
  )

  assert.match(cloudSection, /export const cloud = \{/)
  assert.doesNotMatch(cloudSection, /storage\?\.(getItem|setItem|removeItem|getKeys)\b/)
})

test('гейт отдаёт недоступность и не бросает в окружении без WebApp', () => {
  const gate = hooksSource.slice(
    hooksSource.indexOf('function cloudStorageUsable'),
    hooksSource.indexOf('export const cloud = {')
  )

  // Нет метода — недоступно; нет SDK (веб) — проверка версии не мешает.
  assert.match(gate, /if \(!storage \|\| !storage\[method\]\) return false/)
  assert.match(gate, /typeof webApp\?\.isVersionAtLeast === 'function'/)
})
