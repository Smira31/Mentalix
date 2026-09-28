// Единственное правило «отмечено сегодня» для плиток и детали практик.
// Светлой считается только реальная отметка: уровень ритуала min/optimal
// (или true в старых фикстурах) и статус аскезы held. Любые другие значения
// ('none', 'skip', пустая строка, 0) — обычная тёмная карточка.
const RITUAL_DONE_LEVELS = new Set(['min', 'optimal'])

export function isRitualDoneToday(ritual) {
  const level = ritual?.today_level
  return level === true || RITUAL_DONE_LEVELS.has(level)
}

export function isAscezaHeldToday(asceza) {
  return asceza?.today_status === 'held'
}
