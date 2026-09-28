const groups = [
  ['Серия', ['streak-two', 'streak-three', 'streak-five', 'streak_7', 'streak_30']],
  ['Записи', ['first_checkin', 'first_journal', 'first-step', 'voice-heard']],
  ['Практики', ['ritual-holds', 'asceza-power']],
  ['Общие', ['week-on-path', 'month-on-path', 'active_days_100']],
]

export function badgeGroups(badges) {
  return groups.map(([title, ids]) => ({ title, badges: badges.filter(badge => ids.includes(badge.id)) }))
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
