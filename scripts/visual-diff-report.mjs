#!/usr/bin/env node
/**
 * Формирует markdown-тело комментария «было / стало» для PR.
 *
 * Источники:
 * - artifacts/ux-check/visual-diffs.json — структурированные визуальные diff
 *   (пишется тестом: статус visual_diff вместо fail);
 * - artifacts/ux-check/report.md — общее число экранов и прочие (не визуальные) падения.
 *
 * Выход: artifacts/ux-check/visual-diff-report.md
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs'
import path from 'node:path'

const ARTIFACT_ROOT = path.resolve('artifacts/ux-check')
const REPORT_PATH = path.join(ARTIFACT_ROOT, 'report.md')
const DIFFS_PATH = path.join(ARTIFACT_ROOT, 'visual-diffs.json')
const OUTPUT_PATH = path.join(ARTIFACT_ROOT, 'visual-diff-report.md')
const RUN_URL = process.env.GITHUB_RUN_URL || ''

function parseReportRows() {
  if (!existsSync(REPORT_PATH)) return []
  const text = readFileSync(REPORT_PATH, 'utf8')
  const rows = []
  for (const line of text.split('\n')) {
    const m = line.match(
      /^\|\s*(.+?)\s*\|\s*(.+?)\s*\|\s*(.+?)\s*\|\s*(.+?)\s*\|\s*\[(.*?)\]\((.*?)\)\s*\|$/
    )
    if (!m) continue
    const [, screen, viewport, status, reason] = m
    if (screen === 'Экран') continue
    rows.push({ screen, viewport, status: status.trim(), reason: reason.trim() })
  }
  return rows
}

function parseVisualDiffs() {
  if (!existsSync(DIFFS_PATH)) return []
  try {
    const data = JSON.parse(readFileSync(DIFFS_PATH, 'utf8'))
    return Array.isArray(data.diffs) ? data.diffs : []
  } catch {
    return []
  }
}

function buildReport({ total, visualDiffs, otherFailures }) {
  const lines = []
  lines.push('## 📸 Визуальные изменения: было / стало')
  lines.push('')

  if (visualDiffs.length === 0 && otherFailures.length === 0) {
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

  const passed = total - visualDiffs.length - otherFailures.length
  lines.push(`**Без изменений:** ${passed} из ${total} экранов прошли проверку.`)
  lines.push('')

  if (RUN_URL) {
    lines.push(`📦 [Скачать артефакт с diff-изображениями](${RUN_URL}) — содержит actual/expected/diff для каждого экрана.`)
  }
  lines.push('')
  lines.push('_Проверка informational — мерж не блокирует._')

  return lines.join('\n')
}

const rows = parseReportRows()
const visualDiffs = parseVisualDiffs()
const otherFailures = rows.filter(r => r.status === 'fail')
const report = buildReport({ total: rows.length, visualDiffs, otherFailures })
mkdirSync(path.dirname(OUTPUT_PATH), { recursive: true })
writeFileSync(OUTPUT_PATH, report, 'utf8')
console.log(report)
