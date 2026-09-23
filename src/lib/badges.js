// Вехи пути считаются из того же view-model, что и чип серии и статистика.

export function buildBadges({ stats = {}, checkins = [], rituals = [], ascezas = [] } = {}) {
  const bestRitual = Math.max(0, ...rituals.map(ritual => Number(ritual?.streak) || 0))
  const bestAsceza = Math.max(0, ...ascezas.map(asceza => Number(asceza?.streak) || 0))
  const checkinsCount = checkins.length || Number(stats.total_checkins) || 0
  const days = Number(stats.days_active) || 0

  return [
    {
      id: 'first-step',
      motif: 'voshod',
      title: 'Первый шаг',
      desc: 'Первый чек-ин пройден',
      done: checkinsCount >= 1,
      progress: Math.min(checkinsCount, 1),
      goal: 1,
    },
    {
      id: 'voice-heard',
      motif: 'sobesednik',
      title: 'Голос услышан',
      desc: '5 чек-инов — привычка слышать себя',
      done: checkinsCount >= 5,
      progress: Math.min(checkinsCount, 5),
      goal: 5,
    },
    {
      id: 'week-on-path',
      motif: 'ryad',
      title: 'Неделя пути',
      desc: '7 дней в системе',
      done: days >= 7,
      progress: Math.min(days, 7),
      goal: 7,
    },
    {
      id: 'ritual-holds',
      motif: 'lestnica',
      title: 'Ритуал держит',
      desc: 'Серия ритуала — 7 дней',
      done: bestRitual >= 7,
      progress: Math.min(bestRitual, 7),
      goal: 7,
    },
    {
      id: 'asceza-power',
      motif: 'povedenie',
      title: 'Аскеза — сила',
      desc: '7 чистых дней отказа',
      done: bestAsceza >= 7,
      progress: Math.min(bestAsceza, 7),
      goal: 7,
    },
    {
      id: 'month-on-path',
      motif: 'noch',
      title: 'Месяц пути',
      desc: '30 дней в системе',
      done: days >= 30,
      progress: Math.min(days, 30),
      goal: 30,
    },
  ]
}
