import journalSource from '../../../docs/working/ui-lab/EXPERIMENT_JOURNAL.md?raw'
import experimentsSource from './UiExperiments.jsx?raw'

const ACTIVE_STATUSES = new Set(['pending review', 'manual-gate'])
const ARCHIVE_STATUSES = new Set(['concluded', 'promoted', 'archived'])

function cleanCell(value) {
  return value
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/\*\*/g, '')
    .trim()
}

function parseJournal() {
  return journalSource
    .split('\n')
    .filter(line => line.startsWith('| `'))
    .map(line => {
      const cells = line.split('|').slice(1, -1).map(cleanCell)
      const [id, date, scope, variants, evidence, status] = cells

      return {
        id: id.replace(/`/g, ''),
        date,
        scope,
        variants,
        status: status.replace(/`/g, '').toLowerCase(),
      }
    })
    .filter(entry => entry.id && entry.status)
}

function parsePatterns() {
  const patternSource = /number="(\d+)"[\s\S]{0,420}?title="([^"]+)"/g
  return Array.from(experimentsSource.matchAll(patternSource), match => ({
    number: match[1].padStart(2, '0'),
    title: match[2],
    href: '?ui_lab=experiments',
  }))
}

const ROUTES = {
  'UI-EXP-001': '?ui_lab=compare',
  'UI-EXP-002': '?ui_lab=experiments',
  'UI-EXP-003': '?ui_lab=practice-catalog',
  'MXL-UI-LAB-EVENING-REVIEW-001': '?ui_lab=experiments',
}

export const journalExperiments = parseJournal().map(entry => ({
  ...entry,
  href: ROUTES[entry.id] || '?ui_lab=experiments',
}))

export const activeExperiments = journalExperiments.filter(entry =>
  ACTIVE_STATUSES.has(entry.status)
)
export const archivedExperiments = journalExperiments.filter(entry =>
  ARCHIVE_STATUSES.has(entry.status)
)
export const sketchPatterns = parsePatterns()

export function statusLabel(status) {
  return status === 'manual-gate' ? 'manual-gate' : status
}

export function formatScope(scope) {
  return scope.replace(/^Постоянная /, '').replace(/^Короткий маршрут /, '')
}
