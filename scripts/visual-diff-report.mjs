#!/usr/bin/env node
/**
 * Парсит artifacts/ux-check/report.md из прогона ux:check,
 * находит экраны с визуальными diff (toHaveScreenshot) и
 * генерирует markdown-тело комментария «было / стало» для PR.
 *
 * Выход: artifacts/ux-check/visual-diff-report.md
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs'
import path from 'node:path'

const REPORT_PATH = path.resolve('artifacts/ux-check/report.md')
const OUTPUT_PATH = path.resolve('artifacts/ux-check/visual-diff-report.md')
const RUN_URL = process.env.GITHUB_RUN_URL || ''
const RUN_ID = process.env.GITHUB_RUN_ID || ''

function parseReport() {
  if (!existsSync(REPORT_PATH)) return { total: 0, failed: [], visualDiffs: [] }
  const text = readFileSync(REPORT_PATH, 'utf8')
  const rows = []
  for (const line of text.split('\n')) {
    const m = line.match(/^\|\s*(.+?)\s*\|\s*(.+?)\s*\|\s*(.+?)\s*\|\s*(.+?)\s*\|\s*\[(.*?)\]\((.*?)\)\s*\|$/)
    if (!m) continue
    const [, screen, viewport, status, reason, , screenshot] = m
    if (screen === 'Экран') continue // header
    rows.push({ screen, viewport, status: status.trim(), reason: reason.trim(), screenshot })
  }
  const failed = rows.filter(r => r.status === 'fail')
  // Визуальный diff — причина упоминает screenshot
  const visualDiffs = failed.filter(r => /screenshot/i.test(r.reason))
  return { total: rows.length, failed, visualDiffs }
}

function buildReport({ total, failed, visualDiffs }) {
  const lines = []
  lines.push('## 📸 Визуальные изменения: было / стало')
  lines.push('')

  if (visualDiffs.length === 0 && failed.length === 0) {
    lines.push(`✅ Все ${total} экранов прошли проверку. Визуальных изменений не обнаружено.`)
    lines.push('')
    lines.push('_Проверка informational — мерж не блокирует._')
    return lines.join('\n')
  }

  if (visualDiffs.length > 0) {
    lines.push(`### Изменившиеся экраны (${visualDiffs.length})`)
    lines.push('')
    lines.push('| Экран | Viewport |')
    lines.push('| --- | --- |')
    for (const d of visualDiffs) {
      lines.push(`| ${d.screen} | ${d.viewport} |`)
    }
    lines.push('')
  }

  const otherFailures = failed.filter(r => !/screenshot/i.test(r.reason))
  if (otherFailures.length > 0) {
    lines.push(`### Другие проблемы (${otherFailures.length})`)
    lines.push('')
    lines.push('| Экран | Viewport | Причина |')
    lines.push('| --- | --- | --- |')
    for (const f of otherFailures) {
      lines.push(`| ${f.screen} | ${f.viewport} | ${f.reason.replace(/\|/g, '\\|')} |`)
    }
    lines.push('')
  }

  const passed = total - failed.length
  lines.push(`**Без изменений:** ${passed} из ${total} экранов прошли проверку.`)
  lines.push('')

  if (RUN_URL) {
    lines.push(`📦 [Скачать артефакт с diff-изображениями](${RUN_URL}) — содержит actual/expected/diff для каждого экрана.`)
  } else if (RUN_ID) {
    lines.push(`📦 Артефакт с diff-изображениями: run ${RUN_ID}`)
  }
  lines.push('')
  lines.push('_Проверка informational — мерж не блокирует._')

  return lines.join('\n')
}

const data = parseReport()
const report = buildReport(data)
mkdirSync(path.dirname(OUTPUT_PATH), { recursive: true })
writeFileSync(OUTPUT_PATH, report, 'utf8')
console.log(report)
