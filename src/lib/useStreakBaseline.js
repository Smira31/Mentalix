import { useEffect, useMemo, useRef } from 'react'
import { api } from './api'
import { readCanonicalStreakStats } from './canonicalStreak'
import { peekStreakSnapshot } from './streakSnapshotCache'

/*
 * Была ли сегодня активность ДО сохранения чек-ина — из кэша стрика и
 * GET /api/streak на открытии потока. freeze() фиксирует значение в момент
 * сохранения, чтобы поздний ответ не принял сохранённый чек-ин за «раньше».
 */
export function useStreakBaseline(userId) {
  const ref = useRef(null)
  if (ref.current === null) {
    const cached = peekStreakSnapshot(userId)?.value?.isActiveToday
    ref.current = { value: typeof cached === 'boolean' ? cached : null, frozen: false }
  }

  useEffect(() => {
    let alive = true
    Promise.resolve()
      .then(() => api.streak(userId))
      .then(response => {
        const stats = readCanonicalStreakStats(response)
        if (alive && stats && !ref.current.frozen) ref.current.value = stats.isActiveToday
      })
      .catch(() => {})
    return () => {
      alive = false
    }
  }, [userId])

  return useMemo(
    () => ({
      freeze() {
        ref.current.frozen = true
      },
      wasActiveToday() {
        return ref.current.value
      },
    }),
    []
  )
}
