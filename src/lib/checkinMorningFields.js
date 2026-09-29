/*
 * Payload мгновенного сброса утренней половины при «Пройти утро заново»:
 * шкалы (настроение, энергия, тревожность, концентрация, сон), фокус дня
 * и «Что на уме?» обнуляются явными null — PUT /checkin/today замещает
 * запись целиком, поэтому простое отсутствие полей её не очистит.
 * Вечерняя половина (эмоция, уроки, закрытие дня) переносится без
 * изменений: повтор утра не трогает разбор.
 */
export function morningResetPayload(existing) {
  return {
    mood: null,
    energy: null,
    anxiety: null,
    focus: null,
    sleep_quality: null,
    day_focus: null,
    note: null,
    emotion: existing?.emotion ?? undefined,
    lessons: existing?.lessons ?? undefined,
    ...(existing?.review_completed_at ? { review_completed: true } : {}),
  }
}

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
