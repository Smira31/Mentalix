// Ритуал считается отмеченным сегодня только при реальном уровне выполнения.
// Любое другое значение (null, пустая строка, служебные статусы) — не отмечен.
const RITUAL_DONE_LEVELS = new Set(['min', 'optimal'])

export function isRitualDoneToday(todayLevel) {
  return todayLevel === true || RITUAL_DONE_LEVELS.has(todayLevel)
}
