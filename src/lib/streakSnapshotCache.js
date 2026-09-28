/*
 * ПЕРСИСТЕНТНЫЙ СНАПШОТ СЕРИИ (стррик в шапке «Сегодня»)
 *
 * GET /api/streak — отдельный запрос, и при каждом монтировании Today
 * (каждое переключение вкладки туда-обратно) огонёк в шапке сначала
 * терял число («история ещё грузится»), а потом получал его снова —
 * мерцание на ровном месте. Снимок серии меняется редко: только после
 * чек-ина или сохранённой практики, а эти события сами вызывают
 * refreshStreak. Поэтому между переходами достаточно показать
 * последнее известное значение.
 *
 * Хранение — sessionStorage, ключ по пользователю, TTL 10 минут:
 * на холодном старте после долгого сна Telegram WebView не показывает
 * вчерашнюю серию как сегодняшнюю. Отдельного модульного кэша не
 * нужно: запрос серии дешёвый, а публичный API повторяет форму
 * состояния Today ({ userId, value }), чтобы initial state работал
 * без склеек.
 *
 * Очистка при смене пользователя — общая, в userDataScope.js
 * (префикс mentalix:streak:snapshot:), как у снимка Today.
 */

const STREAK_SNAPSHOT_VERSION = 1
const STREAK_SNAPSHOT_TTL_MS = 10 * 60_000
const STREAK_SNAPSHOT_KEY_PREFIX = 'mentalix:streak:snapshot:v1:'

function snapshotKey(userId) {
  return `${STREAK_SNAPSHOT_KEY_PREFIX}${userId}`
}

/*
 * Снимок хранит уже каноническую форму (результат
 * readCanonicalStreakStats), а не сырой ответ /api/streak —
 * Today.jsx кладёт в состояние именно её.
 */
function isCanonicalStats(value) {
  return (
    value &&
    typeof value === 'object' &&
    Number.isSafeInteger(value.currentStreak) &&
    value.currentStreak >= 0 &&
    Number.isSafeInteger(value.bestStreak) &&
    value.bestStreak >= 0 &&
    Number.isSafeInteger(value.activeDays) &&
    value.activeDays >= 0
  )
}

function removeSnapshot(userId) {
  try {
    sessionStorage.removeItem(snapshotKey(userId))
  } catch {
    // sessionStorage недоступен — показать серию без снапшота.
  }
}

/*
 * Возвращает { userId, value } — форма совпадает с состоянием
 * canonicalStreak в Today.jsx, поэтому годится как initial state.
 */
export function peekStreakSnapshot(userId) {
  if (userId == null) return null

  try {
    const raw = sessionStorage.getItem(snapshotKey(userId))
    if (!raw) return null

    const snapshot = JSON.parse(raw)
    const age = Date.now() - snapshot?.savedAt

    if (
      snapshot?.version !== STREAK_SNAPSHOT_VERSION ||
      !Number.isFinite(snapshot?.savedAt) ||
      age < 0 ||
      age > STREAK_SNAPSHOT_TTL_MS
    ) {
      removeSnapshot(userId)
      return null
    }

    // Снимок писали только с валидным ответом сервера, но он пережил
    // sessionStorage — валидируем форму ещё раз при чтении.
    const value = isCanonicalStats(snapshot.stats) ? snapshot.stats : null
    if (!value) {
      removeSnapshot(userId)
      return null
    }

    return { userId, value }
  } catch {
    removeSnapshot(userId)
    return null
  }
}

/*
 * Сохраняем только валидную статистику: null («нет корректных данных»)
 * не затирает последний хороший снимок.
 */
export function saveStreakSnapshot(userId, value) {
  if (userId == null || !isCanonicalStats(value)) return

  try {
    sessionStorage.setItem(
      snapshotKey(userId),
      JSON.stringify({
        version: STREAK_SNAPSHOT_VERSION,
        savedAt: Date.now(),
        stats: value,
      })
    )
  } catch {
    // Квота/безопасность не должны блокировать показ серии.
  }
}

export function removeStreakSnapshot(userId) {
  if (userId == null) return
  removeSnapshot(userId)
}
