import fs from 'node:fs'
import path from 'node:path'

const MS_PER_DAY = 24 * 60 * 60 * 1000
const STALE_AFTER_DAYS = 30
const root = process.cwd()
const ignored = new Set(['.git', 'node_modules', 'dist'])
const requiredFiles = [
  'README.md',
  'PROJECT_BRIEF.md',
  'PRODUCT.md',
  'DESIGN_SYSTEM.md',
  'ARCHITECTURE.md',
  'AI_RULES.md',
  'AGENTS.md',
  'PROJECT_STATE.md',
  'docs/DOCUMENTATION_GUIDE.md',
  'BASELINE_SNAPSHOT.md',
  'docs/TASK_INDEX.md',
  'docs/INDEX.md',
]

function markdownFiles(dir) {
  const result = []
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (ignored.has(entry.name)) continue
    const absolute = path.join(dir, entry.name)
    if (entry.isDirectory()) result.push(...markdownFiles(absolute))
    else if (entry.isFile() && entry.name.endsWith('.md')) result.push(absolute)
  }
  return result
}

const errors = []
const warnings = []
for (const relative of requiredFiles) {
  if (!fs.existsSync(path.join(root, relative))) errors.push(`missing required file: ${relative}`)
}

const files = markdownFiles(root)
const taskHeadings = new Map()
const canonicalTaskIds = new Set()
const linkPattern = /\[[^\]]+\]\(([^)]+)\)/g
for (const absolute of files) {
  const relative = path.relative(root, absolute).replaceAll(path.sep, '/')
  const text = fs.readFileSync(absolute, 'utf8')
  const frontMatter = text.match(/^---\n([\s\S]*?)\n---\n/)
  if (frontMatter) {
    const status = frontMatter[1].match(/^status:\s*(\S+)\s*$/m)?.[1]
    const verified = frontMatter[1].match(/^last_verified:\s*(\d{4}-\d{2}-\d{2})\s*$/m)?.[1]
    if ((status === 'current' || status === 'normative') && verified) {
      const ageDays = Math.floor((Date.now() - Date.parse(`${verified}T00:00:00Z`)) / MS_PER_DAY)
      if (ageDays > STALE_AFTER_DAYS) {
        warnings.push(`${relative}: last_verified ${verified} is ${ageDays} days old (advisory; threshold ${STALE_AFTER_DAYS} days)`)
      }
    }
  }
  for (const match of text.matchAll(linkPattern)) {
    const target = match[1].split('#', 1)[0]
    if (!target || /^(?:https?:|mailto:|#)/.test(target)) continue
    const decoded = decodeURIComponent(target)
    const resolved = path.resolve(path.dirname(absolute), decoded)
    if (!fs.existsSync(resolved)) errors.push(`${relative}: broken local link ${target}`)
  }
  if (relative === 'docs/TASK_INDEX.md') {
    for (const match of text.matchAll(/`(MXL-[A-Z0-9][A-Z0-9-]*)`/g)) canonicalTaskIds.add(match[1])
    for (const [index, line] of text.split('\n').entries()) {
      const match = line.match(/^## .*?\b(MXL-[A-Z0-9][A-Z0-9-]*)\b/)
      if (!match) continue
      const id = match[1]
      const previous = taskHeadings.get(id)
      if (previous)
        errors.push(
          `docs/TASK_INDEX.md: duplicate task heading ${id} at lines ${previous} and ${index + 1}`
        )
      else taskHeadings.set(id, index + 1)
    }
  }
}

const readme = fs.readFileSync(path.join(root, 'README.md'), 'utf8')
if (/деплой Railway|deployment Railway|hosting Railway/i.test(readme)) {
  errors.push('README.md: current hosting must not be described as Railway')
}

if (errors.length) {
  console.error('Documentation check failed.')
  for (const error of errors) console.error(`- ${error}`)
  process.exitCode = 1
} else {
  console.log(
    `Documentation check passed: ${files.length} Markdown files, ${canonicalTaskIds.size} canonical task IDs, 0 errors.`
  )
  for (const warning of warnings) console.warn(`Documentation freshness warning: ${warning}`)
}
