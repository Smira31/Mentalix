/* Разбор ответа сервера для «Пути героя».
 * Ошибка формата отличается от корректного курса с trials: [].
 * Листы не создаём и не отбрасываем: серверная история сохраняется целиком. */
export function validateHeroJourneyPayload(data) {
  if (
    !data ||
    typeof data.course?.title !== 'string' ||
    !Array.isArray(data.trials) ||
    !Array.isArray(data.chapters) ||
    data.trials.some(
      trial =>
        !trial?.id ||
        (trial.pages !== undefined &&
          (!Array.isArray(trial.pages) ||
            trial.pages.some(page => typeof page?.text !== 'string' || !page.text.trim())))
    )
  ) {
    throw new TypeError('Invalid hero-journey payload')
  }
  return data
}

/* Причина отказа: отказ доступа (401/403) отличается от сбоя загрузки,
 * чтобы экран показывал отказ доступа, а не «проверь интернет». */
export function heroJourneyErrorKind(error) {
  return [401, 403].includes(error?.status) ? 'access' : 'load'
}
