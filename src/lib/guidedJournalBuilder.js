/**
 * Чистые помощники конструктора личных шаблонов «Направленных записей».
 */

/**
 * Уникальный ID шага. Не зависит от длины массива и не меняется после создания:
 * после удаления шага новый шаг не получит ID уже существующего.
 */
export function newStepId(existingIds = []) {
  const taken = new Set(existingIds.map(String))
  let id
  do {
    const random = Math.random().toString(36).slice(2, 8).padEnd(6, '0')
    id = `step-${Date.now().toString(36)}-${random}`
  } while (taken.has(id))
  return id
}

/** Шаги без ID (старые шаблоны) получают уникальные; существующие ID не меняются. */
export function ensureStepIds(steps) {
  const list = Array.isArray(steps) ? steps : []
  const used = []
  return list.map(step => {
    const hasId = step.id !== undefined && step.id !== null && String(step.id) !== ''
    const id = hasId && !used.includes(String(step.id)) ? step.id : newStepId(used)
    used.push(String(id))
    return { ...step, id }
  })
}

export function cleanOptions(options) {
  const seen = new Set()
  const result = []
  for (const option of Array.isArray(options) ? options : []) {
    const text = String(option ?? '').trim()
    if (text && !seen.has(text)) {
      seen.add(text)
      result.push(text)
    }
  }
  return result
}

export const CHECKLIST_OPTIONS_HINT = 'Добавь хотя бы один вариант ответа — по одному в строке.'

/**
 * Валидация шагов перед сохранением.
 * @returns {{ ok: boolean, errors: Record<string, string> }} ошибки по ID шага
 */
export function validateBuilderSteps(steps) {
  const errors = {}
  for (const step of Array.isArray(steps) ? steps : []) {
    if (!String(step.title || '').trim()) errors[step.id] = 'Укажи название шага.'
    else if (step.type === 'checklist' && cleanOptions(step.options).length === 0) {
      errors[step.id] = CHECKLIST_OPTIONS_HINT
    }
  }
  return { ok: Object.keys(errors).length === 0, errors }
}

/** Приводит шаги к виду для отправки: чистые варианты у «Списка», без лишних options у остальных. */
export function normalizeStepsForSave(steps) {
  return (Array.isArray(steps) ? steps : []).map(step => {
    const { options, ...rest } = step
    return step.type === 'checklist' ? { ...rest, options: cleanOptions(options) } : rest
  })
}
