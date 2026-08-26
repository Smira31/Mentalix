// ── Именованные уровни серии: то же число, дружелюбнее подписанное ──
// Не бейдж и не достижение навсегда — считается от текущего streak на
// лету, откатывается вместе с ним при обрыве серии.

const TIERS = [
  { min: 100, name: 'Сотня' },
  { min: 60, name: 'Два месяца' },
  { min: 30, name: 'Месяц без сбоев' },
  { min: 14, name: 'Две недели' },
  { min: 7, name: 'Неделя ровно' },
  { min: 3, name: 'Держится' },
]

export function tierForStreak(streak) {
  const tier = TIERS.find(t => streak >= t.min)

  return tier?.name || null
}
