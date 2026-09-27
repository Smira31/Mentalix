/*
 * Утренние поля записи дня, которые отправляет вечерний разбор.
 *
 * Вечер (в том числе «Пройти заново») не спрашивает настроение, энергию и
 * «Что на уме?», если запись дня уже есть, — поэтому отправляет их из этой
 * записи без изменений. Без записи дня берутся ответы шкал самого разбора.
 */
export function eveningMorningFields(existing, values) {
  if (!existing) {
    return { ...values, note: undefined }
  }

  return {
    mood: existing.mood ?? values.mood,
    energy: existing.energy ?? values.energy,
    anxiety: existing.anxiety ?? values.anxiety,
    focus: existing.focus ?? values.focus,
    sleep_quality: existing.sleep_quality ?? values.sleep_quality,
    day_focus: existing.day_focus ?? values.day_focus,
    note: existing.note || undefined,
  }
}
