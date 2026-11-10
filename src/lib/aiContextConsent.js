// src/lib/aiContextConsent.js
//
// Issue #1169 — «Доступ ИИ к записям». Один источник состояния согласия на
// фронтенде: карточка в начале «Диалога» и переключатель в Профиле работают
// с уже существующим контрактом GET/PUT /api/mentalix/consent
// (api.mentalix.contextConsent / setContextConsent). Новых endpoint'ов нет.

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
 * согласие не выглядело включённым, а пустой ответ не включал карточку
 * поверх уже разрешённого доступа.
 */
export function readAiConsentEnabled(payload) {
  if (!payload || typeof payload !== 'object') return false
  if (typeof payload.enabled === 'boolean') return payload.enabled
  return payload.context_consent === true
}

// «Не сейчас» скрывает карточку на неделю.
export const AI_CONSENT_SNOOZE_DAYS = 7
export const AI_CONSENT_SNOOZE_MS = AI_CONSENT_SNOOZE_DAYS * 24 * 60 * 60 * 1000

/*
 * Отметка «Не сейчас» живёт на устройстве (localStorage) и в облаке Telegram
 * через существующий useSynced: ключ привязан к человеку, чтобы отметка
 * одного профиля не прятала карточку другому.
 */
export function aiConsentSnoozeKey(userId) {
  return `mx-ai-consent-snooze-v1:${userId ?? 'anon'}`
}

export function isAiConsentSnoozed(value, now = Date.now()) {
  const since = Number(value)
  if (!Number.isFinite(since) || since <= 0) return false
  return now - since < AI_CONSENT_SNOOZE_MS
}

/*
 * Тексты карточки и переключателя — один источник для обеих поверхностей,
 * чтобы Диалог и Профиль не разошлись в формулировках.
 */
export const AI_CONSENT_CARD_TITLE = 'Показать собеседникам твои записи?'
export const AI_CONSENT_CARD_BODY =
  'Собеседники увидят чек-ины, которые ты отметишь в «Истории», твои ритуалы, аскезы и цели, а также то, что запомнят о тебе из ваших разговоров, — чтобы отвечать про твой день. Это передаётся в GigaChat (ПАО Сбербанк) только для ответа. Выключить можно в любой момент: Профиль → Твои данные → Доступ ИИ к записям.'
export const AI_CONSENT_ALLOW_LABEL = 'Разрешить'
export const AI_CONSENT_SNOOZE_LABEL = 'Не сейчас'
export const AI_CONSENT_SWITCH_TITLE = 'Доступ ИИ к записям'
export const AI_CONSENT_SWITCH_SUBTITLE =
  'Собеседники видят отмеченные чек-ины, ритуалы, аскезы, цели и память разговоров. Выключишь — перестанут видеть.'
