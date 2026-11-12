// src/lib/aiContextConsent.js
//
// Приватность — «Доступ ИИ к записям». Один источник состояния согласия и
// всех формулировок на фронтенде: тихая строка в начале «Диалога» и
// переключатель в Профиле работают с уже существующим контрактом
// GET/PUT /api/mentalix/consent (api.mentalix.contextConsent /
// setContextConsent). Новых endpoint'ов нет.

import { platformName } from '../platform'

// Роли, в разговоре с которыми спрашиваем согласие: Наблюдатель, Наставник,
// Спутник. Даймона здесь нет — у него своя поверхность и свой перехват.
export const AI_CONTEXT_PERSONAS = ['mayak', 'kompas', 'dnevnik']

/*
 * Согласием управляет только живой Telegram и настоящий пользователь — то же
 * условие, что в «Истории» и в вечернем разборе. В вебе и у гостя (id <= 0)
 * поведение не меняется.
 */
export function canManageAiContext(user) {
  return platformName === 'telegram' && Number(user?.id) > 0
}

/*
 * Ответ GET /api/mentalix/consent: текущий бэкенд отдаёт `enabled`, прежние
 * ответы в тестах и моках — `context_consent`. Читаем оба, чтобы выключенное
 * согласие не выглядело включённым, а пустой ответ не включал строку
 * поверх уже разрешённого доступа.
 */
export function readAiConsentEnabled(payload) {
  if (!payload || typeof payload !== 'object') return false
  if (typeof payload.enabled === 'boolean') return payload.enabled
  return payload.context_consent === true
}

/*
 * «Диалог»: тихая строка вместо карточки. Согласие включается только
 * в Профиле, в окне; строка лишь объясняет состояние и ведёт туда.
 */
export const AI_CONSENT_LINE_TEXT = 'Собеседники не видят твои записи'
export const AI_CONSENT_LINE_ACTION = 'Настроить'

/* Профиль → «твои данные.» → «Приватность»: строка переключателя. */
export const AI_CONSENT_SWITCH_TITLE = 'Собеседники видят мои записи'
export const AI_CONSENT_SWITCH_SUBTITLE =
  'Видят отмеченные чек-ины, ритуалы, аскезы, цели и память разговоров. Ответы готовит GigaChat (Сбер).'

/*
 * Окно согласия открывается при включении переключателя. Текст называет
 * нейросеть и её оператора: это честное согласие, а не подсказка.
 */
export const AI_CONSENT_DIALOG_TITLE = 'Собеседники увидят твои записи'
export const AI_CONSENT_DIALOG_BODY =
  'Чтобы отвечать про твой день, Наблюдатель, Наставник и Спутник будут видеть чек-ины, которые ты отметишь в «Истории», ритуалы, аскезы, цели и то, что запомнят из ваших разговоров. Ответы готовит нейросеть GigaChat (ПАО Сбербанк) — записи передаются туда только для ответа. Выключить можно в любой момент здесь же.'
export const AI_CONSENT_DIALOG_CONFIRM = 'Включить'
export const AI_CONSENT_DIALOG_CANCEL = 'Не сейчас'
