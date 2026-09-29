function earnedTime(badge) {
  const value = badge.earnedAt ?? badge.earned_at
  if (!value) return null
  const time = new Date(value).getTime()
  return Number.isNaN(time) ? null : time
}

export function featuredBadge(badges) {
  const earned = badges.filter(badge => badge.done)
  if (earned.length) {
    // Without a date, the later badge in the catalog wins (also for equal dates).
    return earned.reduce((latest, badge) =>
      (earnedTime(badge) ?? -Infinity) >= (earnedTime(latest) ?? -Infinity) ? badge : latest
    )
  }
  return badges.filter(badge => !badge.done).reduce((nearest, badge) =>
    !nearest || (badge.goal > 0 ? badge.progress / badge.goal : 0) >
      (nearest.goal > 0 ? nearest.progress / nearest.goal : 0) ? badge : nearest
  , null)
}

export function featuredBadgeCaption(badge) {
  if (!badge) return 'Продолжай свой путь'
  if (!badge.done) return `${badge.progress}/${badge.goal} до получения`
  const time = earnedTime(badge)
  if (time === null) return 'Получен'
  const date = new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'short' })
    .format(new Date(time)).replace(/\./g, '')
  return `Получен ${date}`
}
