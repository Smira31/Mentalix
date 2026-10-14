import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

/*
 * Вне Telegram SDK создаёт WebApp с версией «6.0» — в том числе в веб-превью
 * и в демо. Облачное хранилище доступно с Bot API 6.9, и на более старом
 * клиенте сам SDK пишет console.error («CloudStorage is not supported in
 * version …») и бросает WebAppMethodUnsupported. Поэтому версия проверяется
 * ДО обращения к методам хранилища: иначе каждый вызов шумит ошибкой в
 * консоль, а превью остаётся с ошибкой в отчёте платформы.
 */

const hooksSource = await readFile(
  new URL('../../src/platform/telegram.hooks.js', import.meta.url),
  'utf8'
)

test('гейт версии CloudStorage объявлен и требует 6.9', () => {
  assert.match(hooksSource, /function cloudStorageUsable\(storage, method\) \{/)
  assert.match(hooksSource, /!webApp\.isVersionAtLeast\('6\.9'\)/)
})

test('все методы cloud проходят через гейт версии', () => {
  const calls = hooksSource.match(/cloudStorageUsable\(storage, '[a-zA-Z]+'\)/g) || []

  assert.deepEqual(
    [...calls].sort(),
    [
      "cloudStorageUsable(storage, 'getItem')",
      "cloudStorageUsable(storage, 'getKeys')",
      "cloudStorageUsable(storage, 'removeItem')",
      "cloudStorageUsable(storage, 'setItem')",
    ].sort()
  )
  // Прямых проверок методов в обход гейта не осталось.
  assert.doesNotMatch(hooksSource, /if \(!storage\?\./)
})
