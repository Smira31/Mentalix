import assert from 'node:assert/strict'
import { readFile, readdir } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import test from 'node:test'

/*
 * PAY-UI-001: цена Pro — 990 ₽ в месяц из одного общего источника.
 *
 * Проверяем, что:
 *   - значение и период заданы в src/lib/paymentConfig.js;
 *   - ни один исходник приложения не вписывает цену числом (старая заглушка
 *     «690 ₽» исчезла, годового тарифа нет);
 *   - экран подписки собирает кнопку и строку цены из PRO_PRICE.
 */

const { PRO_PRICE, PRO_PERIOD_LABEL, PRO_DURATION_DAYS } = await import(
  new URL('../../src/lib/paymentConfig.js', import.meta.url)
)

const REPO_ROOT = fileURLToPath(new URL('../../', import.meta.url))
const SRC_DIR = path.join(REPO_ROOT, 'src')
const PRICE_SOURCE = 'src/lib/paymentConfig.js'

async function listSourceFiles(dir) {
  const entries = await readdir(dir, { withFileTypes: true })
  const files = []
  for (const entry of entries) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) files.push(...(await listSourceFiles(full)))
    else if (/\.(js|jsx)$/.test(entry.name)) files.push(full)
  }
  return files
}

function relPath(file) {
  return path.relative(REPO_ROOT, file).split(path.sep).join('/')
}

test('цена Pro — 990 ₽ в месяц, срок — 30 дней', () => {
  assert.equal(PRO_PRICE, '990 ₽')
  assert.equal(PRO_PERIOD_LABEL, 'в месяц')
  assert.equal(PRO_DURATION_DAYS, 30)
})

test('цена Pro берётся только из одного источника — paymentConfig.js', async () => {
  const files = await listSourceFiles(SRC_DIR)
  const offenders = []

  for (const file of files) {
    const rel = relPath(file)
    const text = await readFile(file, 'utf8')
    if (text.includes('690 ₽')) offenders.push(`${rel}: старая заглушка «690 ₽»`)
    if (text.includes('990 ₽') && rel !== PRICE_SOURCE) {
      offenders.push(`${rel}: цена вписана числом вместо PRO_PRICE`)
    }
  }

  assert.deepEqual(
    offenders,
    [],
    `цена Pro допустима только в ${PRICE_SOURCE}:\n${offenders.join('\n')}`
  )
})

test('экран подписки собирает кнопку и строку цены из PRO_PRICE', async () => {
  const source = await readFile(path.join(SRC_DIR, 'screens/SubscriptionManager.jsx'), 'utf8')

  assert.ok(source.includes('${PRO_PRICE}'), 'цена в кнопке оплаты — из PRO_PRICE')
  assert.ok(source.includes('{PRO_PRICE}'), 'строка цены — из PRO_PRICE')
  assert.ok(source.includes('PRO_PERIOD_LABEL'), 'период — из PRO_PERIOD_LABEL')
  assert.ok(!source.includes('690'), 'заглушки «690» на экране подписки быть не должно')
})
