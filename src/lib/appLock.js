import { readLocal, writeLocal, dropLocal } from './store'

/*
 * PIN-БЛОКИРОВКА ПРИЛОЖЕНИЯ
 *
 * Хеш и соль хранятся только локально (не через useSynced/CloudStorage) —
 * осознанное решение: сам PIN нигде не должен покидать устройство,
 * синхронизируется только факт «блокировка включена» (см. App.jsx).
 *
 * Это клиентский UX-гейт, а не шифрование данных: тот, у кого есть полный
 * доступ к localStorage и JS-рантайму устройства, теоретически может его
 * обойти. Тот же уровень защиты, что у PIN-замка Daylio/Stoic — сдерживает
 * случайного наблюдателя, не защищает от целенаправленной атаки.
 */

const PIN_KEY = 'mx-app-lock-pin'

// Синхронизируемый (useSynced) флаг «включено» — не сам PIN, см. выше.
export const APP_LOCK_ENABLED_KEY = 'mx-app-lock-enabled'

function toHex(buffer) {
  return Array.from(new Uint8Array(buffer))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('')
}

function generateSalt() {
  const bytes = new Uint8Array(16)

  crypto.getRandomValues(bytes)

  return toHex(bytes)
}

async function hashPin(pin, salt) {
  const data = new TextEncoder().encode(`${salt}:${pin}`)

  const digest = await crypto.subtle.digest('SHA-256', data)

  return toHex(digest)
}

export function readPinRecord() {
  try {
    const raw = readLocal(PIN_KEY)

    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function hasPinRecord() {
  const record = readPinRecord()

  return Boolean(record?.salt && record?.hash)
}

export async function writePinRecord(pin) {
  const salt = generateSalt()
  const hash = await hashPin(pin, salt)

  writeLocal(PIN_KEY, JSON.stringify({ salt, hash }))
}

export function clearPinRecord() {
  dropLocal(PIN_KEY)
}

export async function verifyPin(pin) {
  const record = readPinRecord()

  if (!record?.salt || !record?.hash) return false

  const hash = await hashPin(pin, record.salt)

  return hash === record.hash
}
