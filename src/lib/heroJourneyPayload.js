/* Разбор ответа сервера для «Пути героя».
 * Ошибка формата отличается от корректного курса с trials: [].
 * Листы не создаём и не отбрасываем: серверная история сохраняется целиком.
 *
 * Права (#1122): ответ несёт access.has_pro и access.free_chapter_keys, а у
 * глав, шагов и финала — флаг locked. У закрытых шагов текстов нет, и это
 * норма, а не ошибка формата: их листы не проверяются и не достраиваются.
 * Контракт опционален — ответ без access (прежний backend) ничего не закрывает:
 * фронтенд не придумывает права, не подменяет закрытые тексты демо-данными и
 * решает только то, что видно пользователю (доступ проверяет сервер).
 */
export function validateHeroJourneyPayload(data) {
  if (
    !data ||
    typeof data.course?.title !== 'string' ||
    !Array.isArray(data.trials) ||
    !Array.isArray(data.chapters) ||
    data.trials.some(
      trial =>
        !trial?.id ||
        (!trial.locked &&
          trial.pages !== undefined &&
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

/* Права из ответа: { has_pro, free_chapter_keys }. Нет объекта — нет прав
 * (null), и тогда закрытых глав не рисуется: до контракта поведение прежнее. */
export function normalizeHeroAccess(raw) {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null

  return {
    hasPro: raw.has_pro === true,
    freeChapterKeys: Array.isArray(raw.free_chapter_keys)
      ? raw.free_chapter_keys.filter(key => typeof key === 'string' && key)
      : [],
  }
}

/* Глава закрыта: явный флаг сервера приоритетен, без прав — не закрываем. */
export function heroChapterLocked(chapter, access) {
  if (!chapter) return false
  if (typeof chapter.locked === 'boolean') return chapter.locked
  if (!access) return false

  return !access.hasPro && !access.freeChapterKeys.includes(chapter.key)
}

/* Шаг закрыт: флаг сервера или закрытая глава, в которой он лежит. Текстов у
 * закрытого шага нет — открывать его нечем, поэтому такой шаг ведёт на экран
 * подписки, а не в пустой шаг. */
export function heroTrialLocked(trial, chapters, access) {
  if (!trial) return false
  if (trial.locked === true) return true

  const chapter = (chapters || []).find(item => item?.trialIds?.includes(trial.id))

  return heroChapterLocked(chapter, access)
}

/* Финал «Возвращение» идёт после последней главы: без действующего Pro он
 * закрыт. Явный флаг сервера приоритетен; права неизвестны — не закрываем. */
export function heroFinaleLocked(finale, access) {
  if (!finale) return false
  if (typeof finale.locked === 'boolean') return finale.locked

  return Boolean(access) && !access.hasPro
}
