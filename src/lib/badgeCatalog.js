const groups = [
  ['Серия', ['streak-two', 'streak-three', 'streak-five', 'streak_7', 'streak_30']],
  ['Записи', ['first_checkin', 'first_journal', 'first-step', 'voice-heard']],
  ['Практики', ['ritual-holds', 'asceza-power']],
  ['Общие', ['week-on-path', 'month-on-path', 'active_days_100']],
]

/* Метка над названием в шторке значка — по категории, а не по факту получения. */
const categoryLabels = {
  Серия: 'ЗНАЧОК СЕРИИ',
  Записи: 'ЗНАЧОК ЗАПИСЕЙ',
  Практики: 'ЗНАЧОК ПРАКТИК',
  Общие: 'ОБЩИЙ ЗНАЧОК',
}

export function badgeCategoryLabel(id) {
  const group = groups.find(([, ids]) => ids.includes(id))
  return categoryLabels[group?.[0]] || categoryLabels['Общие']
}

/* Порядок внутри группы задаёт список ids, а не порядок входного массива:
   в «Серии» значки идут по возрастанию дней (2 → 3 → 5 → 7 → 30). */
export function badgeGroups(badges) {
  return groups.map(([title, ids]) => ({
    title,
    badges: ids.map(id => badges.find(badge => badge.id === id)).filter(Boolean),
  }))
}

export function upcomingBadges(badges) {
  return badges.filter(badge => !badge.done).sort((a, b) => {
    const remainingA = Math.max(0, a.goal - a.progress)
    const remainingB = Math.max(0, b.goal - b.progress)
    return remainingA - remainingB || a.goal - b.goal || a.title.localeCompare(b.title, 'ru')
  })
}

// Calendar days since registration (including the first day), not activity days.
// An absent registration date must never masquerade as zero days in the system.
export function daysSinceRegistration(value, today = new Date()) {
  if (!value) return null
  const registered = new Date(value)
  if (Number.isNaN(registered.getTime()) || registered > today) return null
  const start = Date.UTC(registered.getFullYear(), registered.getMonth(), registered.getDate())
  const end = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate())
  return Math.floor((end - start) / 86400000) + 1
}
