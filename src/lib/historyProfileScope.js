/*
 * JOURNAL-001 — привязка состояния поверхностей истории к профилю.
 *
 * Экран «История» (ProgressHistory внутри «Прогресса») и legacy-поверхность
 * History держат данные, загруженные для конкретного профиля. При смене
 * профиля чужие записи не должны ни отрисоваться, ни «дождаться» ответа
 * запроса, начатого для прошлого профиля.
 *
 * profileScopeKey даёт границу React-ремонта: у каждого профиля свой key,
 * поэтому состояние поверхности создаётся заново при смене профиля, а не
 * сбрасывается эффектом на кадр позже — в этот кадр успевает отрисоваться
 * старый текст.
 *
 * beginProfileLoad/acceptsProfileLoad — токен загрузки: ответ применяется
 * только если профиль запроса всё ещё активен, то есть запоздавший ответ A
 * не попадает в B.
 */

function normalizeProfileId(userId) {
  if (typeof userId === 'string' && userId.trim()) return userId.trim()
  if (typeof userId === 'number' && Number.isFinite(userId)) return String(userId)
  return null
}

/**
 * Ключ профильной границы для React.
 *
 * Без подтверждённого профиля — 'anonymous': неавторизованное состояние не
 * наследует данные последнего открытого профиля.
 */
function profileScopeKey(userId) {
  return normalizeProfileId(userId) ?? 'anonymous'
}

/** Токен асинхронной загрузки данных профиля. */
function beginProfileLoad(userId) {
  return { profileId: normalizeProfileId(userId) }
}

/**
 * Можно ли применять ответ загрузки: профиль запроса должен совпадать с
 * текущим и быть подтверждённым.
 */
function acceptsProfileLoad(token, userId) {
  const current = normalizeProfileId(userId)
  return Boolean(token) && token.profileId !== null && token.profileId === current
}

export { acceptsProfileLoad, beginProfileLoad, normalizeProfileId, profileScopeKey }
