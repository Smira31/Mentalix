/**
 * Русское склонение существительных по числу.
 *
 * @param {number} n — количество
 * @param {[string, string, string]} forms — [один, несколько, много]
 *   например ['день', 'дня', 'дней']
 * @returns {string} — правильная форма слова для данного числа
 */
export function pluralize(n, forms) {
  const number = Math.abs(Number(n) || 0)
  const mod10 = number % 10
  const mod100 = number % 100

  if (mod10 === 1 && mod100 !== 11) return forms[0]
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return forms[1]
  return forms[2]
}

/**
 * Форматирует «N <слово>» с правильным склонением.
 *
 * @param {number} n — количество
 * @param {[string, string, string]} forms — [один, несколько, много]
 * @returns {string} — например «1 завершённый день», «2 завершённых дня»
 */
export function formatCount(n, forms) {
  return `${n} ${pluralize(n, forms)}`
}
