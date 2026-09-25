/*
 * Обратная связь на экране завершения чек-ина.
 *
 * Метки — тексты кнопок «Нет / Немного / Да», значения — контракт бэкенда:
 * POST /api/checkins/{id}/feedback { value }.
 * Соответствие живёт в одном месте, чтобы экран и API не разъехались.
 */
export const CHECKIN_FEEDBACK_OPTIONS = [
  { label: 'Нет', value: 'no' },
  { label: 'Немного', value: 'some' },
  { label: 'Да', value: 'yes' },
]

export function checkinFeedbackValue(label) {
  return CHECKIN_FEEDBACK_OPTIONS.find(option => option.label === label)?.value || null
}
