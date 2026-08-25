// MXL-MOOD-CHECK-ERROR-GUARD-001
//
// Показываем быстрый mood-check только когда ответ о сегодняшнем чек-ине
// достоверно сообщает «чек-ина нет» (null). undefined означает, что запрос
// ещё не завершён, а строковое error-state — что backend недоступен; оба
// состояния не должны блокировать запуск приложения.
export function shouldShowMoodCheckGate({
  user,
  onboarded,
  locked,
  enabled,
  dismissedToday,
  todayCheckin,
}) {
  return Boolean(
    user &&
      onboarded &&
      !locked &&
      enabled &&
      !dismissedToday &&
      todayCheckin === null
  )
}

export const MOOD_CHECK_CHECKIN_ERROR = 'error'
