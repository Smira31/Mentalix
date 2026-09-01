import { readdirSync, readFileSync } from 'node:fs'
import { join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = fileURLToPath(new URL('..', import.meta.url))
const SRC = join(ROOT, 'src')

function collectFiles(directory, extensions) {
  const files = []
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name)
    if (entry.isDirectory()) files.push(...collectFiles(path, extensions))
    else if (extensions.has(entry.name.split('.').pop())) files.push(path)
  }
  return files
}

const sourceFiles = collectFiles(SRC, new Set(['css', 'js', 'jsx']))
const contents = new Map(sourceFiles.map(path => [path, readFileSync(path, 'utf8')]))
const violations = []

function violation(rule, path, detail) {
  violations.push(`${rule}: ${relative(ROOT, path)} — ${detail}`)
}

const indexPath = join(SRC, 'index.css')
const appPath = join(SRC, 'App.jsx')
const index = contents.get(indexPath)
const app = contents.get(appPath)

for (const token of ['--c-bg', '--c-card', '--c-card2', '--c-text', '--c-muted', '--c-faint', '--c-border', '--c-line', '--c-gold']) {
  if (!index.includes(token)) violation('tokens', indexPath, `missing ${token}`)
}

if (!app.includes("const LIGHT_THEME_PREVIEW_PARAM = 'light-preview'")) {
  violation('preview-gate', appPath, 'light-preview parameter is not explicit')
}
if (!app.includes('return previewBuild && requested === \'1\'')) {
  violation('preview-gate', appPath, 'light preview is not limited to dev/preview builds')
}

for (const [path, source] of contents) {
  const lines = source.split('\n')
  let blockSelector = ''
  lines.forEach((line, index) => {
    const lineNumber = index + 1
    const selector = line.match(/^([^{}]+)\{\s*$/)?.[1]?.trim()
    if (selector) blockSelector = selector

    if (/background(?:-color)?\s*:\s*(?:#fff(?:fff)?\b|white\b)/i.test(line)) {
      violation('pure-white-surface', path, `line ${lineNumber}`)
    }
    if (/color\s*:\s*(?:#fff(?:fff)?\b|white\b)/i.test(line)) {
      violation('pure-white-text', path, `line ${lineNumber}`)
    }
    if (/font-size\s*:\s*(?:1[0-5]|[0-9])px/i.test(line) && /\b(input|textarea|select)\b|\.mx-ai-input/i.test(blockSelector)) {
      violation('input-typography', path, `line ${lineNumber} is below 16px`)
    }
    if (path.endsWith('.css') && path !== indexPath && /#edbd60\b/i.test(line)) {
      violation('accent-token', path, `line ${lineNumber} hardcodes production gold`)
    }
    if (line.includes('}')) blockSelector = ''
  })
}

if (violations.length > 0) {
  console.error('Design guard failed:')
  for (const item of violations) console.error(`- ${item}`)
  process.exitCode = 1
} else {
  console.log(`Design guard passed: ${sourceFiles.length} source files, token and preview-gate checks clean.`)
}
