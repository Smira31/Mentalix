import { useCallback } from 'react'

import { useSynced } from './store'
import { toLocalCalendarDate } from './dateTimezonePolicy'

/*
 * ПРОГРЕСС «ПУТЯ ГЕРОЯ» — облако Telegram + localStorage.
 *
 * Тот же механизм, что другие практики (useSynced): читаем локально
 * (мгновенно), подтягиваем облако, пишем в оба. Облако переезжает
 * вместе с человеком на другое устройство.
 *
 * Структура:
 *   {
 *     completed: { [stepId]: ISODateString },
 *     signs:      { [stepId]: number[] },
 *     reflections: { [stepId]: string },
 *     actions:     { [stepId]: string }
 *   }
 *
 * Следующий шаг открывается строго после прохождения предыдущего:
 * в проде — не раньше следующего календарного дня,
 * в ?demo=1 — сразу, без ожидания.
 */

const PROGRESS_KEY = 'mx-hero-journey-progress'

function emptyProgress() {
  return { completed: {}, signs: {}, reflections: {}, actions: {} }
}

function isObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}

function parseProgress(raw) {
  if (!raw) return emptyProgress()
  if (typeof raw === 'string') {
    try {
      return parseProgress(JSON.parse(raw))
    } catch {
      return emptyProgress()
    }
  }
  if (!isObject(raw)) return emptyProgress()
  return {
    completed: isObject(raw.completed) ? raw.completed : {},
    signs: isObject(raw.signs) ? raw.signs : {},
    reflections: isObject(raw.reflections) ? raw.reflections : {},
    actions: isObject(raw.actions) ? raw.actions : {},
  }
}

function mergeProgress(local, remote) {
  const a = parseProgress(local)
  const b = parseProgress(remote)
  return {
    completed: { ...a.completed, ...b.completed },
    signs: { ...a.signs, ...b.signs },
    reflections: { ...a.reflections, ...b.reflections },
    actions: { ...a.actions, ...b.actions },
  }
}

export function useHeroJourneyProgress() {
  const [raw, setRaw] = useSynced(PROGRESS_KEY, JSON.stringify(emptyProgress()), mergeProgress)

  const progress = parseProgress(raw)

  const update = useCallback(
    fn => {
      const next = fn(parseProgress(raw))
      setRaw(typeof next === 'string' ? next : JSON.stringify(next))
    },
    [raw, setRaw]
  )

  const completeStep = useCallback(
    (stepId, { signs: markedSigns, reflection, action } = {}) => {
      update(p => ({
        ...p,
        completed: { ...p.completed, [stepId]: new Date().toISOString() },
        ...(markedSigns ? { signs: { ...p.signs, [stepId]: markedSigns } } : {}),
        ...(reflection !== undefined ? { reflections: { ...p.reflections, [stepId]: reflection } } : {}),
        ...(action !== undefined ? { actions: { ...p.actions, [stepId]: action } } : {}),
      }))
    },
    [update]
  )

  const setSigns = useCallback(
    (stepId, signs) => {
      update(p => ({ ...p, signs: { ...p.signs, [stepId]: signs } }))
    },
    [update]
  )

  return { progress, completeStep, setSigns }
}

/*
 * Доступность шага.
 *
 * Шаг 1 всегда доступен.
 * Шаг N доступен, если шаг N-1 пройден и прошёл хотя бы один
 * календарный день с момента его прохождения.
 */
export function isStepAvailable(stepNumber, prevStepId, progress, demo = false) {
  if (stepNumber === 1) return true

  const prevCompletedAt = progress.completed[prevStepId]
  if (!prevCompletedAt) return false

  // demo: следующий шаг открывается сразу после прохождения предыдущего
  if (demo) return true

  // прод: не раньше следующего календарного дня
  const prevDate = toLocalCalendarDate(new Date(prevCompletedAt))
  const today = toLocalCalendarDate()
  return prevDate < today
}

export function isStepCompleted(stepId, progress) {
  return Boolean(progress.completed[stepId])
}
