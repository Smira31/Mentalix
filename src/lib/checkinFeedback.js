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

/*
 * Отправка обратной связи после сохранения чек-ина.
 *
 * Вынесена из экрана, чтобы тестировать с подменой API и чтобы утренний
 * и вечерний потоки не расходились в обработке ошибок.
 *
 * @param {function} feedbackApi — функция (checkinId, value) ⇒ Promise
 * @param {*} checkinId — id сохранённой записи (может отсутствовать)
 * @param {string} label — метка кнопки («Нет» / «Немного» / «Да»)
 *
 * Если label не распознан — ничего не делаем (кнопка не нажата).
 * Если label есть, но checkinId отсутствует — диагностируем через console.error,
 * чтобы потеря id была видна, а не уходила молча.
 * Ошибка сети перехватывается и логируется — экран не блокируется.
 */
export async function sendCheckinFeedback(feedbackApi, checkinId, label) {
  const value = checkinFeedbackValue(label)

  if (!value) return

  if (!checkinId) {
    console.error('[checkin-feedback] нет id сохранённого чек-ина — оценка не отправлена')
    return
  }

  try {
    await feedbackApi(checkinId, value)
  } catch (feedbackError) {
    console.error(feedbackError)
  }
}
