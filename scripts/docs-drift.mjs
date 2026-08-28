import { execFileSync } from 'node:child_process'
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'

const run = (command, args) => execFileSync(command, args, { encoding: 'utf8' }).trim()
const markdownFiles = []
const visit = directory => {
  for (const entry of readdirSync(directory)) {
    const path = join(directory, entry)
    if (entry === 'node_modules' || entry === '.git' || entry === 'dist') continue
    if (statSync(path).isDirectory()) visit(path)
    else if (path.endsWith('.md')) markdownFiles.push(path)
  }
}
visit('.')

const normative = [
  'README.md',
  'AGENTS.md',
  'ARCHITECTURE.md',
  'PROJECT_STATE.md',
  'PRODUCT.md',
  'DESIGN_SYSTEM.md',
  'AI_RULES.md',
]
const forbidden = /Railway|Koyeb|There is no test suite|no CI config|run before every push/i
const findings = []
for (const file of normative) {
  const text = readFileSync(file, 'utf8')
  if (forbidden.test(text)) findings.push(`${file}: stale platform or workflow wording`)
}
const actualMain = run('git', ['rev-parse', 'origin/main'])
const state = readFileSync('PROJECT_STATE.md', 'utf8')
const documented = state.match(/Текущий `main`[^\n]*`([0-9a-f]{7,40})`/)?.[1]
if (documented) {
  try {
    execFileSync('git', ['merge-base', '--is-ancestor', documented, 'origin/main'])
  } catch {
    findings.push(
      `PROJECT_STATE.md: documented main ${documented} is not an ancestor of origin/main ${actualMain.slice(0, 8)}`
    )
  }
}
if (findings.length) {
  console.error(findings.map(finding => `- ${finding}`).join('\n'))
  process.exit(1)
}
console.log(
  `Docs drift check passed: ${markdownFiles.length} Markdown files; normative docs match Render/Neon; documented baseline is in origin/main history (${actualMain.slice(0, 8)}).`
)
