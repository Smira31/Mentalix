import assert from 'node:assert/strict'
import fs from 'node:fs'
import test from 'node:test'

/*
 * Privacy API — unit-контракт на вызовы методов api.privacy.
 *
 * api.js использует directory import (../platform), который не поддерживается
 * в Node ESM, поэтому импорт модуля напрямую невозможен. Вместо этого делаем
 * статический анализ исходника: проверяем, что методы privacy вызывают
 * правильные эндпоинты с правильными параметрами — как api-contract.test.mjs.
 */

const apiPath = new URL('../../src/lib/api.js', import.meta.url)
const source = fs.readFileSync(apiPath, 'utf8')

// Извлекаем блок privacy из исходника.
const privacyBlockMatch = source.match(/privacy:\s*\{([\s\S]*?)\n\s{2}\},/)
assert.ok(privacyBlockMatch, 'блок privacy найден в api.js')
const privacyBlock = privacyBlockMatch[1]

test('requestErasureCode: метод существует и вызывает /privacy/account-erasure/request-code', () => {
  assert.ok(
    /requestErasureCode\s*:/.test(privacyBlock),
    'метод requestErasureCode определён'
  )
  assert.ok(
    privacyBlock.includes("'/privacy/account-erasure/request-code'"),
    'вызывает эндпоинт /privacy/account-erasure/request-code'
  )
  assert.ok(
    /requestErasureCode[\s\S]*?method:\s*'POST'/.test(privacyBlock),
    'использует метод POST'
  )
  assert.ok(
    /requestErasureCode[\s\S]*?user_id/.test(privacyBlock),
    'передаёт user_id в теле'
  )
})

test('eraseAccount: метод существует и вызывает /privacy/account-erasure', () => {
  assert.ok(
    /eraseAccount\s*:/.test(privacyBlock),
    'метод eraseAccount определён'
  )
  assert.ok(
    privacyBlock.includes("'/privacy/account-erasure'"),
    'вызывает эндпоинт /privacy/account-erasure'
  )
  // Убеждаемся, что это не request-code эндпоинт
  const eraseMatch = privacyBlock.match(/eraseAccount[\s\S]*?request\(/)
  assert.ok(eraseMatch, 'вызывает request()')
  assert.ok(
    !eraseMatch[0].includes('request-code'),
    'не вызывает request-code эндпоинт'
  )
})

test('eraseAccount: передаёт confirmation DELETE_MY_DATA и otp_code', () => {
  const eraseMatch = privacyBlock.match(
    /eraseAccount\s*:[\s\S]*?JSON\.stringify\(\s*\{([\s\S]*?)\}\s*\)/
  )
  assert.ok(eraseMatch, 'тело запроса найдено')
  const body = eraseMatch[1]
  assert.ok(body.includes('confirmation'), 'передаёт confirmation')
  assert.ok(body.includes('DELETE_MY_DATA'), 'confirmation = DELETE_MY_DATA')
  assert.ok(body.includes('otp_code'), 'передаёт otp_code')
  assert.ok(body.includes('user_id'), 'передаёт user_id')
})

test('eraseAccount: принимает otpCode как параметр', () => {
  assert.ok(
    /eraseAccount:\s*\([^)]*otpCode[^)]*\)/.test(privacyBlock),
    'метод принимает параметр otpCode'
  )
})

test('sendExportToTelegram: метод существует и вызывает /privacy/export/send-to-telegram', () => {
  assert.ok(
    /sendExportToTelegram\s*:/.test(privacyBlock),
    'метод sendExportToTelegram определён'
  )
  assert.ok(
    privacyBlock.includes("'/privacy/export/send-to-telegram'"),
    'вызывает эндпоинт /privacy/export/send-to-telegram'
  )
})

test('downloadExport: метод существует и вызывает /privacy/export', () => {
  assert.ok(
    /downloadExport\s*:/.test(privacyBlock),
    'метод downloadExport определён'
  )
  assert.ok(
    privacyBlock.includes("'/privacy/export'"),
    'вызывает эндпоинт /privacy/export'
  )
})
