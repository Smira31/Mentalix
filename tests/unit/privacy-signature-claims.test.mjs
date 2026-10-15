import assert from 'node:assert/strict'
import test from 'node:test'
import { readdir, readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { join } from 'node:path'

/*
 * AUD-PRIVACY-001 (AUD-004): интерфейс не обещает «проверенную подпись».
 * Бэкенд проверку подписи не подтверждает (см. комментарий в src/lib/api.js),
 * поэтому такой формулировки в исходниках приложения быть не должно.
 */

const SRC = fileURLToPath(new URL('../../src', import.meta.url))
const FORBIDDEN = 'проверенной подписью'

async function sourceFiles(directory) {
  const files = []
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name)
    if (entry.isDirectory()) files.push(...(await sourceFiles(path)))
    else if (/\.(?:jsx?|css|html)$/.test(entry.name)) files.push(path)
  }
  return files
}

test('исходники приложения не обещают проверенную подпись', async () => {
  const offenders = []
  for (const file of await sourceFiles(SRC)) {
    const source = await readFile(file, 'utf8')
    if (source.includes(FORBIDDEN)) offenders.push(file.slice(SRC.length + 1))
  }
  assert.deepEqual(offenders, [])
})

test('экран «Твои данные» называет ограничение веб-входа без обещания подписи', async () => {
  const settings = await readFile(
    new URL('../../src/screens/Settings.jsx', import.meta.url),
    'utf8'
  )
  assert.match(
    settings,
    /Экспорт и удаление аккаунта сейчас доступны в Telegram Mini App\. Веб-вход доступен/
  )
})
