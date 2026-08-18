import { api } from './api'

/*
 * IN-MEMORY КЕШ ДАННЫХ ЭКРАНА «СЕГОДНЯ»
 *
 * Today.jsx фетчил шесть запросов разом (rituals, ascezas, quote,
 * checkin, themes, settings) при каждом монтировании — то есть на
 * каждое переключение вкладки BottomNavigation туда и обратно, даже
 * если ничего не изменилось. Тот же паттерн, что чинили в
 * mentalixHistoryCache.js для диалогов с AI-персонами.
 *
 * Кешируется весь снимок разом, одним ключом на пользователя — все
 * шесть запросов всегда фетчатся вместе, отдельного кеша на каждый
 * не нужно. Module-level Map, не localStorage — переживает только
 * текущую сессию вкладки.
 *
 * TTL короче, чем у истории диалогов (60с): rituals/ascezas/checkin —
 * более «живые» данные, к которым пользователь может вернуться после
 * реального действия (отметил ритуал, прошёл чек-ин) быстрее, чем за
 * минуту.
 */

const TODAY_CACHE_TTL_MS = 30_000

const cache = new Map()

export async function fetchTodayData(userId) {
  const cached = cache.get(userId)

  if (cached && Date.now() - cached.fetchedAt < TODAY_CACHE_TTL_MS) {
    return cached.data
  }

  const [rituals, ascezas, quote, checkin, themes, settings] = await Promise.all([
    api.rituals.list(userId),
    api.ascezas.list(userId),
    api.quotes.today(userId),
    api.checkin.today(userId).catch(() => null),
    api.themes.list(userId).catch(() => []),
    api.profile.getSettings(userId).catch(() => null),
  ])

  const data = { rituals, ascezas, quote, checkin, themes, settings }

  cache.set(userId, { data, fetchedAt: Date.now() })

  return data
}

export function invalidateTodayData(userId) {
  cache.delete(userId)
}
