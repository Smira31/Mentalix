/*
 * Логика недельной сетки практики — один источник правды для компонента
 * PracticeWeek и юнит-тестов.
 *
 * Серия всегда заканчивается сегодняшним днём: кружки заполняются до
 * «сегодня» включительно, а не до конца календарной недели. Поэтому в
 * четверг заполнены только Пн–Чт, даже если серия длиннее четырёх дней
 * (она просто началась на прошлой неделе).
 */
export function weekDayCircles(streak, todayIndex) {
  const filled = Math.min(Math.max(streak, 0), todayIndex + 1)
  const firstFilled = filled === 0 ? todayIndex + 1 : todayIndex - filled + 1
  return { filled, firstFilled }
}
