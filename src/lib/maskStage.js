import { MASK_STAGES } from '../config/maskStages.js'

// Стаж накопительный: серия чек-инов здесь намеренно не участвует.
export function getMaskStage(daysActive) {
  const days = Math.max(0, Number(daysActive) || 0)
  const index = MASK_STAGES.findLastIndex(stage => days >= stage.minDays)
  const stage = MASK_STAGES[index]
  const next = MASK_STAGES[index + 1] || null
  return { stage, daysUntilNext: next ? Math.max(0, next.minDays - days) : null, next }
}
