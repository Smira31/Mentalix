#!/usr/bin/env node
/*
 * Сравнивает размеры JS/CSS-чанков между двумя сборками (текущая ветка
 * и main) и выводит Markdown-таблицу для комментария PR.
 *
 * Использование:
 *   node scripts/bundle-size-report.mjs <current-dist> <base-dist>
 *
 * Если base-dist не указан — выводит только текущие размеры.
 */
import { readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { gzipSync } from 'node:zlib'
import { readFileSync } from 'node:fs'

function collectChunks(distDir) {
  const assetsDir = join(distDir, 'assets')
  let files
  try {
    files = readdirSync(assetsDir)
  } catch {
    return []
  }
  return files
    .filter(f => f.endsWith('.js') || f.endsWith('.css'))
    .map(f => {
      const filePath = join(assetsDir, f)
      const raw = readFileSync(filePath)
      const size = statSync(filePath).size
      const gzip = gzipSync(raw).length
      return { name: f, size, gzip, type: f.endsWith('.js') ? 'JS' : 'CSS' }
    })
    .sort((a, b) => b.size - a.size)
}

function fmtKb(bytes) {
  return (bytes / 1024).toFixed(2)
}

function fmtDelta(curr, base) {
  if (base === undefined) return '—'
  const delta = curr - base
  if (delta === 0) return '±0'
  const pct = ((delta / base) * 100).toFixed(1)
  const sign = delta > 0 ? '+' : ''
  return `${sign}${fmtKb(delta)} (${sign}${pct}%)`
}

const currentDir = process.argv[2]
const baseDir = process.argv[3]

if (!currentDir) {
  console.error('Usage: node scripts/bundle-size-report.mjs <current-dist> [base-dist]')
  process.exit(1)
}

const currentChunks = collectChunks(currentDir)
const baseChunks = baseDir ? collectChunks(baseDir) : []
const baseMap = new Map(baseChunks.map(c => [c.name.replace(/-[A-Za-z0-9_-]+\.(js|css)$/, ''), c]))
const currentMap = new Map(currentChunks.map(c => [c.name.replace(/-[A-Za-z0-9_-]+\.(js|css)$/, ''), c]))

// Главный чанк — index-*.js
const indexChunk = currentChunks.find(c => c.name.startsWith('index-') && c.name.endsWith('.js'))
const baseIndexChunk = baseChunks.find(c => c.name.startsWith('index-') && c.name.endsWith('.js'))

const lines = []
lines.push('## 📦 Размеры чанков сборки')
lines.push('')
lines.push('| Чанк | Тип | Размер | gzip | Δ размер | Δ gzip |')
lines.push('|------|-----|-------|------|----------|--------|')

for (const chunk of currentChunks) {
  const key = chunk.name.replace(/-[A-Za-z0-9_-]+\.(js|css)$/, '')
  const base = baseMap.get(key)
  lines.push(
    `| ${chunk.name} | ${chunk.type} | ${fmtKb(chunk.size)} kB | ${fmtKb(chunk.gzip)} kB | ${fmtDelta(chunk.size, base?.size)} | ${fmtDelta(chunk.gzip, base?.gzip)} |`
  )
}

// Чанки, которые были в main, но исчезли
for (const chunk of baseChunks) {
  const key = chunk.name.replace(/-[A-Za-z0-9_-]+\.(js|css)$/, '')
  if (!currentMap.has(key)) {
    lines.push(
      `| ~~${chunk.name}~~ | ${chunk.type} | — | — | -${fmtKb(chunk.size)} kB | -${fmtKb(chunk.gzip)} kB |`
    )
  }
}

lines.push('')
if (indexChunk) {
  lines.push(`**Главный чанк (index):** ${fmtKb(indexChunk.size)} kB (gzip ${fmtKb(indexChunk.gzip)} kB)`)
  if (baseIndexChunk) {
    lines.push(
      `**Было на main:** ${fmtKb(baseIndexChunk.size)} kB (gzip ${fmtKb(baseIndexChunk.gzip)} kB)`
    )
  }
}

// Итоги
const totalJs = currentChunks.filter(c => c.type === 'JS').reduce((s, c) => s + c.size, 0)
const totalCss = currentChunks.filter(c => c.type === 'CSS').reduce((s, c) => s + c.size, 0)
const totalGzipJs = currentChunks.filter(c => c.type === 'JS').reduce((s, c) => s + c.gzip, 0)
const totalGzipCss = currentChunks.filter(c => c.type === 'CSS').reduce((s, c) => s + c.gzip, 0)

const baseTotalJs = baseChunks.filter(c => c.type === 'JS').reduce((s, c) => s + c.size, 0)
const baseTotalCss = baseChunks.filter(c => c.type === 'CSS').reduce((s, c) => s + c.size, 0)
const baseTotalGzipJs = baseChunks.filter(c => c.type === 'JS').reduce((s, c) => s + c.gzip, 0)
const baseTotalGzipCss = baseChunks.filter(c => c.type === 'CSS').reduce((s, c) => s + c.gzip, 0)

lines.push('')
lines.push(`**Всего JS:** ${fmtKb(totalJs)} kB (gzip ${fmtKb(totalGzipJs)} kB)${baseTotalJs ? ` — было ${fmtKb(baseTotalJs)} kB (gzip ${fmtKb(baseTotalGzipJs)} kB)` : ''}`)
lines.push(`**Всего CSS:** ${fmtKb(totalCss)} kB (gzip ${fmtKb(totalGzipCss)} kB)${baseTotalCss ? ` — было ${fmtKb(baseTotalCss)} kB (gzip ${fmtKb(baseTotalGzipCss)} kB)` : ''}`)

console.log(lines.join('\n'))
