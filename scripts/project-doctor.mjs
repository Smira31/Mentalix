import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'

const run = (command, args = []) => {
  try {
    return execFileSync(command, args, {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    }).trim()
  } catch (error) {
    return `unavailable: ${error.status ?? error.message}`
  }
}

const packageJson = JSON.parse(readFileSync('package.json', 'utf8'))
const branch = run('git', ['branch', '--show-current']) || 'detached'
const head = run('git', ['rev-parse', '--short', 'HEAD'])
const originMain = run('git', ['rev-parse', '--short', 'origin/main'])
const status = run('git', ['status', '--porcelain'])
const state = existsSync('PROJECT_STATE.md') ? readFileSync('PROJECT_STATE.md', 'utf8') : ''
const taskIndex = existsSync('docs/TASK_INDEX.md') ? readFileSync('docs/TASK_INDEX.md', 'utf8') : ''
const activeTasks = [...taskIndex.matchAll(/^\|\s*`?(MXL-[A-Z0-9-]+)`?\s*\|.*$/gm)].map(
  match => match[1]
)
const documentedMain = state.match(/Текущий `main`[^\n]*`([0-9a-f]{7,40})`/)?.[1] ?? 'not recorded'

console.log(
  `# Mentalix doctor\n\n- Branch: ${branch}\n- HEAD: ${head}\n- origin/main: ${originMain}\n- Working tree: ${status ? `dirty (${status.split('\n').length} entries)` : 'clean'}\n- PROJECT_STATE main: ${documentedMain}\n- Active task IDs: ${activeTasks.length ? activeTasks.join(', ') : 'none detected'}\n- package scripts: ${Object.keys(packageJson.scripts ?? {}).join(', ')}\n`
)
console.log(
  'Doctor is read-only. Run `npm run check:core` and `npm run ux:check` when checks are required.'
)
