import { localDayId } from './morningPilot'
import { readFirstStepLog } from './firstStepPractice'
import { readNoBlameLog } from './noBlamePractice'
import { readNarrowFocusLog } from './narrowFocusPractice'
import { readOneFinishLog } from './oneFinishPractice'

const PRACTICES = [
  { key: 'first-step', title: 'Первый шаг', read: readFirstStepLog },
  { key: 'no-blame', title: 'Без вины', read: readNoBlameLog },
  { key: 'narrow-focus', title: 'Одно из всех', read: readNarrowFocusLog },
  { key: 'one-finish', title: 'Один финиш', read: readOneFinishLog },
]

function safeRead(reader, userId) {
  try {
    const entries = reader(userId)
    return Array.isArray(entries) ? entries : []
  } catch {
    return []
  }
}

export function readOneOffPracticeHistory(userId) {
  if (!userId) return []

  return PRACTICES.flatMap(practice =>
    safeRead(practice.read, userId).map((entry, index) => ({
      ...entry,
      practiceKey: practice.key,
      practiceTitle: practice.title,
      id: `${practice.key}-${entry.completed_at || entry.day || index}`,
    }))
  ).sort((a, b) => (a.completed_at || '').localeCompare(b.completed_at || ''))
}

export function hasOneOffPracticeToday(userId, date = new Date()) {
  const today = localDayId(date)
  return readOneOffPracticeHistory(userId).some(entry => entry.day === today)
}

export function oneOffPracticesByDay(userId) {
  const byDate = {}
  for (const entry of readOneOffPracticeHistory(userId)) {
    if (!entry.day) continue
    if (!byDate[entry.day]) byDate[entry.day] = []
    byDate[entry.day].push(entry)
  }
  return byDate
}

export function oneOffPracticeNamesForDay(entries) {
  return [...new Set((entries || []).map(entry => entry.practiceTitle).filter(Boolean))]
}

export { PRACTICES }

export default readOneOffPracticeHistory

// Keep this module local-only: no API, telemetry, journal text, or backend events.
