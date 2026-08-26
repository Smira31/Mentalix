// ── Вехи Пути: достижения без давления — фиксация пройденного, не гонка ──
// Считаются на лету из существующих данных, бэкенд не нужен.

export function buildBadges({ stats, rituals, ascezas }) {
  const bestRitual = Math.max(0, ...rituals.map(r => r.streak || 0))
  const bestAsceza = Math.max(0, ...ascezas.map(a => a.streak || 0))
  const checkins = stats?.total_checkins || 0
  const days = stats?.days_active || 0

  return [
    {
      id: 'first-step',
      motif: 'voshod',
      title: 'Первый шаг',
      desc: 'Первый чек-ин пройден',
      done: checkins >= 1,
      progress: Math.min(checkins, 1),
      goal: 1,
    },
    {
      id: 'voice-heard',
      motif: 'sobesednik',
      title: 'Голос услышан',
      desc: '5 чек-инов — привычка слышать себя',
      done: checkins >= 5,
      progress: Math.min(checkins, 5),
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
