import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const requiredFiles = [
  'PROJECT_STATE.md',
  'README.md',
  'docs/DOCUMENTATION_GUIDE.md',
  'BASELINE_SNAPSHOT.md',
]
const errors = []

for (const relative of requiredFiles) {
  if (!fs.existsSync(path.join(root, relative))) errors.push(`missing canonical file: ${relative}`)
}

const git = args => execFileSync('git', args, { cwd: root, encoding: 'utf8' }).trim()
const mainRef = (() => {
  try {
    git(['rev-parse', '--verify', 'origin/main'])
    return 'origin/main'
  } catch {
    return 'main'
  }
})()

let mainCommits = new Set()
try {
  mainCommits = new Set(git(['rev-list', mainRef]).split(/\r?\n/).filter(Boolean))
} catch {
  errors.push(`cannot read commits from ${mainRef}`)
}

const statePath = path.join(root, 'PROJECT_STATE.md')
if (fs.existsSync(statePath)) {
  const state = fs.readFileSync(statePath, 'utf8')
  const shaCandidates = state
    .split('\n')
    .filter(line => /Текущий `main`|Baseline frontend|Scope C \/ Progress V2/.test(line))
    .flatMap(line => [...line.matchAll(/\b[0-9a-f]{7,40}\b/g)].map(match => match[0]))
  for (const sha of new Set(shaCandidates)) {
    const exists = [...mainCommits].some(commit => commit.startsWith(sha))
    if (!exists) errors.push(`PROJECT_STATE.md: commit SHA ${sha} is not present in ${mainRef} history`)
  }
}

const changedFiles = (() => {
  try {
    return git(['diff', '--name-only', `${mainRef}...HEAD`]).split(/\r?\n/).filter(Boolean)
  } catch {
    return []
  }
})()
const changedMarkdown = changedFiles.filter(file => file.endsWith('.md'))
const markdownFiles = []
const visit = directory => {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    if (entry.name === '.git' || entry.name === 'node_modules' || entry.name === 'dist') continue
    const absolute = path.join(directory, entry.name)
    if (entry.isDirectory()) visit(absolute)
    else if (entry.isFile() && entry.name.endsWith('.md')) markdownFiles.push(absolute)
  }
}
visit(root)
const slugify = value =>
  value.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, '-').replace(/^-|-$/g, '')
const headingsByFile = new Map(
  markdownFiles.map(absolute => [
    absolute,
    new Set(
      fs
        .readFileSync(absolute, 'utf8')
        .split('\n')
        .map(line => line.match(/^#{1,6}\s+(.+?)\s*#*$/)?.[1])
        .filter(Boolean)
        .map(slugify)
    ),
  ])
)
const linkPattern = /\[[^\]]+\]\(([^)]+)\)/g
const allowedTerms = [
  'Production',
  'Owner QA Preview',
  'UI Lab',
  'Local Preview',
  'Branch Deployment',
]
for (const relative of changedMarkdown) {
  const absolute = path.join(root, relative)
  if (!fs.existsSync(absolute)) continue
  const originalText = fs.readFileSync(absolute, 'utf8')
  for (const match of originalText.matchAll(linkPattern)) {
    const rawTarget = match[1]
    const [target, anchor] = rawTarget.split('#', 2)
    if (/^(?:https?:|mailto:)/.test(target)) continue
    const resolved = target ? path.resolve(path.dirname(absolute), decodeURIComponent(target)) : absolute
    if (target && !fs.existsSync(resolved)) errors.push(`${relative}: broken local link ${rawTarget}`)
    if (anchor && headingsByFile.has(resolved) && !headingsByFile.get(resolved).has(slugify(decodeURIComponent(anchor)))) {
      errors.push(`${relative}: broken local anchor ${rawTarget}`)
    }
  }
  let text = originalText
  text = text.replace(/`[^`]*`/g, '').replace(/https?:\/\/\S+/g, '')
  text = text.replace(/mentalix-preview/gi, '')
  for (const term of allowedTerms) text = text.replace(new RegExp(term, 'gi'), '')
  if (/\bpreview\b/i.test(text)) {
    errors.push(`${relative}: bare "preview" remains; use one of the five canonical environment terms`)
  }
}

if (errors.length) {
  console.error('Canonical documentation drift check failed.')
  for (const error of errors) console.error(`- ${error}`)
  process.exit(1)
}

console.log(
  `Canonical documentation drift check passed: ${requiredFiles.length} required files, ${mainCommits.size} main commits, ${changedMarkdown.length} changed Markdown files.`
)
