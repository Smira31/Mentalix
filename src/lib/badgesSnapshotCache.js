/*
 * ПЕРСИСТЕНТНЫЙ СНАПШОТ ЗНАЧКОВ (шторка «Значки | Статистика»)
 *
 * При открытии шторки значки считаются из нескольких запросов
 * (стория чек-инов, профиль, серия, сессии записей), и до их
 * завершения экран либо мигал числом (считалось по частичным данным),
 * либо показывал «Загружаю последние данные…». Состояние значков
 * меняется редко — только после чек-ина или сохранённой практики, —
 * поэтому между открытиями достаточно показать последний известный
 * набор, а потом тихо обновить его с сервера (#918 — как снимок серии).
 *
 * Хранение — sessionStorage, ключ по пользователю, TTL 10 минут:
 * на холодном старте после долгого сна Telegram WebView не показывает
 * вчерашние значки как сегодняшние. Снимок хранит уже обогащённый
 * массив значков (с earnedAt), чтобы шторка сразу показала последний
 * полученный значок без пересчёта дат.
 *
 * Очистка при смене пользователя — общая, в userDataScope.js
 * (префикс mentalix:badges:snapshot:).
 */

const BADGES_SNAPSHOT_VERSION = 1
const BADGES_SNAPSHOT_TTL_MS = 10 * 60_000
const BADGES_SNAPSHOT_KEY_PREFIX = 'mentalix:badges:snapshot:v1:'

function snapshotKey(userId) {
  return `${BADGES_SNAPSHOT_KEY_PREFIX}${userId}`
}

function isValidBadge(value) {
  return (
    value &&
    typeof value === 'object' &&
    typeof value.id === 'string' &&
    typeof value.done === 'boolean' &&
    Number.isSafeInteger(value.goal) &&
    Number.isSafeInteger(value.progress)
  )
}

function removeSnapshot(userId) {
  try {
    sessionStorage.removeItem(snapshotKey(userId))
  } catch {
    // sessionStorage недоступен — покажем значки без снапшота.
  }
}

/*
 * Возвращает { userId, badges } — форма совпадает с состоянием шторки,
 * поэтому годится как initial state. Снимок валиден, только если все
 * значки сохранили обязательные поля (id/done/goal/progress).
 */
export function peekBadgesSnapshot(userId) {
  if (userId == null) return null

  try {
    const raw = sessionStorage.getItem(snapshotKey(userId))
    if (!raw) return null

    const snapshot = JSON.parse(raw)
    const age = Date.now() - snapshot?.savedAt

    if (
      snapshot?.version !== BADGES_SNAPSHOT_VERSION ||
      !Number.isFinite(snapshot?.savedAt) ||
      age < 0 ||
      age > BADGES_SNAPSHOT_TTL_MS
    ) {
      removeSnapshot(userId)
      return null
    }

    const badges = Array.isArray(snapshot.badges) ? snapshot.badges : null
    if (!badges || !badges.every(isValidBadge)) {
      removeSnapshot(userId)
      return null
    }

    return { userId, badges }
  } catch {
    removeSnapshot(userId)
    return null
  }
}

/*
 * Сохраняем только непустой набор валидных значков: пустой массив
 * («данные ещё не пришли») не затирает последний хороший снимок.
 */
export function saveBadgesSnapshot(userId, badges) {
  if (userId == null || !Array.isArray(badges) || !badges.length) return
  if (!badges.every(isValidBadge)) return

  try {
    sessionStorage.setItem(
      snapshotKey(userId),
      JSON.stringify({
        version: BADGES_SNAPSHOT_VERSION,
        savedAt: Date.now(),
        badges,
      })
    )
  } catch {
    // Квота/безопасность не должны блокировать показ значков.
  }
}

export function removeBadgesSnapshot(userId) {
  if (userId == null) return
  removeSnapshot(userId)
}
