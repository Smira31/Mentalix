/*
 * Классификация ошибок API Pro (PRO-002b/c). Ошибки двух форматов:
 *   HTTPException → body.detail ('pro_required', 'pro_report_disabled',
 *     'pro_plan_disabled', 'pro_progress_disabled', 'version_conflict',
 *     'not_found', …);
 *   JSONResponse → body.code ('consent_required', 'insufficient_data',
 *     'generation_in_progress', 'report_required', 'rebuild_conflict', …).
 * Ключ ошибки — первое непустое из code/detail, независимо от формата.
 */

export function proErrorKey(error) {
  return error?.body?.code || error?.body?.detail || null
}

/*
 * Состояние Pro из ответа API. Ответ обязан быть объектом с непустым
 * статусом: пусто, массив или чужой формат означают, что данные не
 * доставлены. Тогда экран показывает своё состояние ошибки с повтором и
 * ничего не форматирует — подпись из отсутствующих полей не строится,
 * сборка не запускается.
 */
export function proStatePayload(data) {
  if (!data || typeof data !== 'object' || Array.isArray(data)) return null

  return typeof data.status === 'string' && data.status ? data : null
}

/*
 * Терминальные состояния доступа (402/404): экран показывает понятную
 * карточку вместо бесконечной загрузки. Для остальных ключей возвращает null.
 */
const BLOCKED_STATES = {
  pro_required: {
    title: 'Mentalix Pro недоступен',
    text: 'Разбор недели, план и прогресс — часть Pro. Оформить Pro можно в разделе «Подписка».',
  },
  pro_report_disabled: {
    title: 'Функция пока отключена',
    text: 'Разбор недели появится, когда его включат на сервере. Зайди позже.',
  },
  pro_plan_disabled: {
    title: 'Функция пока отключена',
    text: 'План недели появится, когда его включат на сервере. Зайди позже.',
  },
  pro_progress_disabled: {
    title: 'Функция пока отключена',
    text: 'Прогресс появится, когда его включат на сервере. Зайди позже.',
  },
}

export function proBlockedState(key) {
  return BLOCKED_STATES[key] || null
}
