import { api } from './api'
import { withRetry } from './todayRetry'

/*
 * IN-MEMORY КЕШ ТЕМ НЕДЕЛИ (Practices.jsx → «Тема недели»)
 *
 * Practices.jsx кеширует ритуалы/аскезы через practicesDataCache.js,
 * но темы (api.themes.list + api.themes.get) фетчились заново при
 * каждом монтировании — то есть на каждое переключение вкладки
 * BottomNavigation туда и обратно. Тот же паттерн, что чинили в
 * practicesDataCache.js/todayDataCache.js.
 *
 * Один снимок на пользователя — оба запроса (list + get) всегда
 * фетчатся вместе, отдельного кеша на каждый не нужно.
 *
 * TTL 30 секунд, как у practicesDataCache.js — те же данные, что и
 * на экране «Сегодня», и завязаны на тот же недельный цикл.
 *
 * peekThemesData() — синхронный, без сети, для lazy-инициализации
 * стейта в Practices.jsx: при тёплом кеше на монтировании нет
 * промежуточного кадра «Загружаю вопросы».
 *
 * Кеш хранит уже обработанный результат (отсортированный +
 * объединённый list+detail), а не сырой ответ API — чтобы
 * Practices.jsx получал готовые данные без дублирования логики.
 *
 * Безопасность устаревших данных: TTL 30с гарантирует, что ошибка
 * не маскируется бесконечно — после истечения TTL выполняется
 * свежий запрос, и при ошибке показывается error-state, а не кеш.
 * Retry-кнопка вызывает fetch с force=true, обходя кеш.
 */

const THEMES_CACHE_TTL_MS = 30_000

const cache = new Map()
const inFlight = new Map()

function freshEntry(userId) {
  const cached = cache.get(userId)

  if (cached && Date.now() - cached.fetchedAt < THEMES_CACHE_TTL_MS) {
    return cached
  }

  return null
}

export function peekThemesData(userId) {
  return freshEntry(userId)?.data ?? null
}

export async function fetchThemesData(userId, { force = false } = {}) {
  const cached = freshEntry(userId)

  if (!force && cached) {
    return cached.data
  }

  if (inFlight.has(userId)) {
    return inFlight.get(userId)
  }

  const request = (async () => {
    const themesData = await withRetry(() => api.themes.list(userId))
    const list = Array.isArray(themesData) ? themesData : []

    // MXL-525 G5: текущая неделя (is_current) должна идти первой в карусели.
    const sorted = list
      .slice()
      .sort((a, b) => (b.is_current === true ? 1 : 0) - (a.is_current === true ? 1 : 0))
    const currentTheme = sorted[0]

    if (!currentTheme) {
      const data = []
      cache.set(userId, { data, fetchedAt: Date.now() })
      return data
    }

    const detail = await withRetry(() => api.themes.get(currentTheme.id, userId))
    const data = [{ ...currentTheme, ...detail }]

    cache.set(userId, { data, fetchedAt: Date.now() })
    return data
  })().finally(() => {
    inFlight.delete(userId)
  })

  inFlight.set(userId, request)

  return request
}

export function invalidateThemesData(userId) {
  cache.delete(userId)
}
