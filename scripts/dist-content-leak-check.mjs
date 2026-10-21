#!/usr/bin/env node
/*
 * Защита контента (#1112, этап 3): тексты «Пути героя» и статей Библиотеки
 * уезжают на сервер, но в старых сборках они лежали в бандле целиком. Этот
 * страж проверяет собранный dist и падает, если в него просочился текст шага,
 * которого в бандле быть не должно.
 *
 * Проверяются шаги 5 и 16 — по одной уникальной фразе из текстов курса
 * (источник: content/hero-journey.json репозитория mentalix-bot, тот же текст,
 * что и в src/data/heroJourney.js до миграции).
 *
 * Контрольная фраза из шага 1 обязана найтись: в демо-режиме (?demo=1) глава I
 * остаётся в бандле намеренно. Если она не найдена, значит сканируется не тот
 * каталог или бандл не собран, и «утечки нет» означало бы только это.
 *
 * Запускается после `npm run build` — см. check:core.
 */
import { readFile, readdir, stat } from 'node:fs/promises'
import { join } from 'node:path'

const DIST_DIR = 'dist'
const TEXT_EXTENSIONS = /\.(?:js|mjs|cjs|css|html|json|txt|svg|webmanifest)$/i

// Фразы, которых в бандле быть не должно: по одной уникальной из шагов 5 и 16.
const FORBIDDEN = [
  { label: 'шаг 5 «Сигналы тела»', phrase: 'К вечеру плечи каменные, голова гудит, спина ноет.' },
  { label: 'шаг 16 «Внутренняя опора»', phrase: 'Но кусочки сами не держатся.' },
]

// Контрольная фраза: глава I (шаг 1) остаётся в бандле как демо-контент.
const PRESENT = {
  label: 'шаг 1 (демо-глава I)',
  phrase: 'В этом шаге ты посмотришь вперёд и найдёшь одну опору.',
}

async function collectFiles(dir) {
  const entries = await readdir(dir, { withFileTypes: true })
  const files = []
  for (const entry of entries) {
    const full = join(dir, entry.name)
    if (entry.isDirectory()) files.push(...(await collectFiles(full)))
    else files.push(full)
  }
  return files
}

async function main() {
  try {
    const info = await stat(DIST_DIR)
    if (!info.isDirectory()) throw new Error('not a directory')
  } catch {
    console.error(`[content-leak] Каталог ${DIST_DIR}/ не найден — сначала выполните npm run build.`)
    process.exit(1)
  }

  const files = (await collectFiles(DIST_DIR)).filter(file => TEXT_EXTENSIONS.test(file))
  if (files.length === 0) {
    console.error(`[content-leak] В ${DIST_DIR}/ нет текстовых файлов — проверять нечего.`)
    process.exit(1)
  }

  const contents = new Map()
  for (const file of files) contents.set(file, await readFile(file, 'utf8'))

  const failures = []
  for (const { label, phrase } of FORBIDDEN) {
    for (const [file, text] of contents) {
      if (text.includes(phrase)) failures.push(`${label}: фраза найдена в ${file}`)
    }
  }

  const presentFile = [...contents].find(([, text]) => text.includes(PRESENT.phrase))
  if (!presentFile) {
    console.error(
      `[content-leak] Контрольная фраза (${PRESENT.label}) не найдена ни в одном файле ${DIST_DIR}/. ` +
        'Похоже, сканируется не тот каталог или бандл собран из другого исходника — ' +
        'результат проверки на утечку в таком прогоне недействителен.'
    )
    process.exit(1)
  }

  if (failures.length > 0) {
    console.error('[content-leak] Тексты курса вернулись в бандл:')
    for (const failure of failures) console.error(`  - ${failure}`)
    process.exit(1)
  }

  console.log(
    `[content-leak] OK: ${files.length} файлов ${DIST_DIR}/ просканировано, ` +
      `текстов шагов ${FORBIDDEN.map(item => item.label).join(' и ')} нет; ` +
      `контрольная фраза ${PRESENT.label} на месте (${presentFile[0]}).`
  )
}

main().catch(error => {
  console.error('[content-leak] Проверка упала:', error)
  process.exit(1)
})
