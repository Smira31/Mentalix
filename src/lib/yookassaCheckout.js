/*
 * PAY-UI-001 (веб): оплата Mentalix Pro через ЮKassa.
 *
 * Путь Tribute в Telegram не меняется: в Telegram ЮKassa не вызывается —
 * гейт checkoutAvailable() проверяется до запроса к API, а в компонентах
 * ветка веба и ветка Telegram разделены.
 *
 * Контракт бэкенда:
 *   POST /api/payments/yookassa/create — без тела; авторизация сессией
 *   веб-пользователя (cookie или Authorization: Bearer), user_id не передаём.
 *   200 → { confirmation_url } — редирект пользователя в текущей вкладке;
 *   401 (unauthorized | verified_identity_required) — нужен вход;
 *   403 guest_payment_forbidden — гость: сначала вход (в вебе — Telegram Login);
 *   503 (yookassa_disabled | yookassa_not_configured) — оплата недоступна;
 *   502 yookassa_create_failed — сбой, можно повторить.
 *
 * Возврат с ЮKassa сам по себе не считается оплатой: экран решает только
 * свежий GET /api/subscription (has_pro) — см. paymentReturnState().
 * Платёжные данные на фронтенде не вводятся и не хранятся.
 *
 * Модуль чистый: без импортов платформы и API-клиента. Флаг и платформа
 * передаются вызывающим компонентом (PAYMENT_UI_ENABLED, platformName), а
 * запрос и редирект — снаружи. Поэтому разбор ответов проверяется
 * Node-тестами, и «в Telegram ЮKassa не вызывается» проверяется поведением,
 * а не чтением исходника. Значения по умолчанию — самые безопасные:
 * оплата не запускается, пока её не разрешили явно.
 */

export const CHECKOUT_OK = 'ok'
export const CHECKOUT_CREATING = 'creating'
export const CHECKOUT_AUTH = 'auth'
export const CHECKOUT_GUEST = 'guest'
export const CHECKOUT_UNAVAILABLE = 'unavailable'
export const CHECKOUT_FAILED = 'failed'
/* Гейт не пройден (флаг выключен или платформа Telegram) — запроса не было. */
export const CHECKOUT_SKIPPED = 'skipped'

/* Тексты состояний — русские, без технических слов. */
export const CHECKOUT_COPY = {
  [CHECKOUT_CREATING]: 'Открываем оплату…',
  [CHECKOUT_AUTH]: 'Нужно войти в аккаунт',
  [CHECKOUT_GUEST]: 'Сначала сохрани прогресс по email',
  [CHECKOUT_UNAVAILABLE]: 'Оплата скоро будет доступна',
  [CHECKOUT_FAILED]: 'Не удалось открыть оплату',
}

export const CHECKOUT_ACTIONS = {
  [CHECKOUT_AUTH]: 'Войти',
  [CHECKOUT_GUEST]: 'Сохранить прогресс по email',
  [CHECKOUT_FAILED]: 'Попробовать снова',
}

/*
 * Копия экрана «Подписка» для гостя в вебе.
 *
 * Рабочий вход на вебе — Telegram Login (тот же экран входа WebAuthScreen, что
 * и по прежней кнопке «Сохранить прогресс по email»): вход по email выключен
 * флагом VITE_EMAIL_LOGIN_ENABLED=false, пока у проекта нет своего домена в
 * Resend. Поэтому гостю предлагаем Telegram, а email — только когда он включён
 * (emailCta = null — экран не упоминает email вовсе).
 *
 * Флоу возврата к оплате после входа не меняется: beginGuestCheckout() пишет
 * намерение, а экран подписки после входа сам продолжает оплату.
 */
export function webGuestLoginCopy({ emailLoginEnabled = false } = {}) {
  return {
    heading: 'Войди через Telegram, чтобы оформить Pro',
    pitch: 'Так подписка привяжется к твоему аккаунту, а записи не потеряются.',
    cta: 'Войти через Telegram',
    emailCta: emailLoginEnabled ? 'Войти по email' : null,
  }
}

/*
 * Гейт оплаты: только включённый флаг и не Telegram.
 * enabled (PAYMENT_UI_ENABLED) и platform (platformName) передаются явно,
 * чтобы функция осталась чистой; по умолчанию оплата запрещена.
 */
export function checkoutAvailable({ enabled = false, platform = 'web' } = {}) {
  return enabled === true && platform !== 'telegram'
}

/*
 * Ответ create → состояние экрана.
 * 200 без confirmation_url — не 200: страницу открывать нечем, это сбой.
 */
export function createResponseState(status, body) {
  if (status === 200) return confirmationUrl(body?.confirmation_url) ? CHECKOUT_OK : CHECKOUT_FAILED

  return checkoutStateForError({ status, code: body?.code ?? body?.detail ?? null })
}

/* Ошибка create → состояние экрана (код ошибки важнее статуса, если он есть). */
export function checkoutStateForError({ status = null, code = null } = {}) {
  if (code === 'unauthorized' || code === 'verified_identity_required' || status === 401) {
    return CHECKOUT_AUTH
  }
  if (code === 'guest_payment_forbidden' || status === 403) return CHECKOUT_GUEST
  if (
    code === 'yookassa_disabled' ||
    code === 'yookassa_not_configured' ||
    status === 503
  ) {
    return CHECKOUT_UNAVAILABLE
  }
  return CHECKOUT_FAILED
}

/* Редиректим только на https-адрес подтверждения; остальное — сбой. */
export function confirmationUrl(value) {
  return typeof value === 'string' && /^https:\/\/\S+$/i.test(value) ? value : null
}

/*
 * Запуск оплаты: гейт → POST create → редирект в текущей вкладке.
 * create и navigate передаются вызывающим компонентом, поэтому
 * в Telegram ни запрос, ни редирект не выполняются.
 *
 * navigate обязателен: create(200) без функции перехода оплатой не является.
 * Раньше отсутствующий navigate молча пропускал редирект — экран оставался
 * в «Открываем оплату…», а вызывающий получал успех (CHECKOUT_OK).
 * Теперь это CHECKOUT_FAILED, и сбой виден в интерфейсе и в тестах.
 */
export async function startCheckout({ create, navigate, platform = 'web', enabled = false } = {}) {
  if (!checkoutAvailable({ enabled, platform })) return { state: CHECKOUT_SKIPPED }
  if (typeof create !== 'function') return { state: CHECKOUT_FAILED }

  let data
  try {
    data = await create()
  } catch (error) {
    return {
      state: checkoutStateForError({
        status: error?.status ?? null,
        code: error?.body?.code ?? error?.body?.detail ?? null,
      }),
    }
  }

  const state = createResponseState(200, data)
  if (state !== CHECKOUT_OK) return { state }

  const url = confirmationUrl(data.confirmation_url)
  if (!url) return { state: CHECKOUT_FAILED }

  // Перейти на оплату нечем — это сбой, а не успех: иначе кнопка «ничего не
  // делает», а экран навсегда остаётся в состоянии «Открываем оплату…».
  if (typeof navigate !== 'function') return { state: CHECKOUT_FAILED }

  // Отметку о начатой оплате ставим только после реального перехода:
  // по ней потом решается, показывать ли возврат с ЮKassa.
  navigate(url)
  markPaymentStarted()
  return { state: CHECKOUT_OK, url }
}

/* ── Возврат с ЮKassa ───────────────────────────────────────────────────── */

const STARTED_KEY = 'mx-yookassa-payment-started'
const GUEST_RESUME_KEY = 'mx-yookassa-payment-resume'
const SETTINGS_SCREEN_KEY = 'mx-settings-initial-screen'
const SUCCESS_SHOWN_KEY = 'mx-subscription-success-shown'

/* Возврат с оплаты старше суток оплатой уже не считается. */
export const PAYMENT_RETURN_WINDOW_MS = 24 * 60 * 60 * 1000

/* ЮKassa возвращает пользователя на этот адрес: ?payment=return. */
export const PAYMENT_RETURN_PARAM = 'payment'
export const PAYMENT_RETURN_VALUE = 'return'
export const PAYMENT_RETURN_URL = `https://mentalix-production.web.app/?${PAYMENT_RETURN_PARAM}=${PAYMENT_RETURN_VALUE}`

/*
 * Открытие приложения по возврату с ЮKassa: в адресе есть ?payment=return.
 * Служебный параметр — единственный признак возврата; сам он оплатой не
 * считается (см. paymentReturnState). Остальные параметры не мешают.
 */
export function isPaymentReturn(search) {
  if (typeof search !== 'string') return false
  try {
    return new URLSearchParams(search).get(PAYMENT_RETURN_PARAM) === PAYMENT_RETURN_VALUE
  } catch {
    return false
  }
}

/*
 * Адрес без служебного параметра возврата: остальные параметры сохраняются.
 * Возвращает query-строку с ведущим «?» или пустую строку.
 */
export function stripPaymentReturnParam(search) {
  if (typeof search !== 'string') return ''
  const params = new URLSearchParams(search)
  params.delete(PAYMENT_RETURN_PARAM)
  const query = params.toString()
  return query ? `?${query}` : ''
}

/*
 * Состояние экрана после возврата с ЮKassa.
 * null — оплату не начинали (или возврат слишком старый): экран показывает
 * обычное состояние подписки.
 * 'success' — только по свежему ответу /api/subscription с has_pro=true.
 * 'pending' — «Оплата обрабатывается» + «Проверить оплату».
 */
export function paymentReturnState({ subscription, startedAt = null, now = Date.now() }) {
  const started = normalizeStartedAt(startedAt)
  if (!started || now - started > PAYMENT_RETURN_WINDOW_MS) return null

  return subscription?.has_pro === true ? 'success' : 'pending'
}

function writeSession(key, value) {
  try {
    if (typeof window !== 'undefined') window.sessionStorage.setItem(key, value)
  } catch {
    /* приватный режим: оплата от этого не ломается */
  }
}

function readSession(key) {
  try {
    return typeof window !== 'undefined' ? window.sessionStorage.getItem(key) : null
  } catch {
    return null
  }
}

function removeSession(key) {
  try {
    if (typeof window !== 'undefined') window.sessionStorage.removeItem(key)
  } catch {
    /* см. writeSession */
  }
}

/*
 * Экран успеха показывается один раз: флаг в sessionStorage отмечает,
 * что успех уже показан. При новой оплате флаг снимается (markPaymentStarted),
 * чтобы следующий возврат снова показал экран успеха.
 */
export function markSuccessShown() {
  writeSession(SUCCESS_SHOWN_KEY, '1')
}

export function readSuccessShown() {
  try {
    return typeof window !== 'undefined' && window.sessionStorage.getItem(SUCCESS_SHOWN_KEY) === '1'
  } catch {
    return false
  }
}

export function clearSuccessShown() {
  removeSession(SUCCESS_SHOWN_KEY)
}

/* Страница уходит на ЮKassa и загружается заново — отметку держим в sessionStorage. */
export function markPaymentStarted(now = Date.now()) {
  writeSession(STARTED_KEY, String(now))
  // Новая оплата — снимаем флаг показанного успеха.
  removeSession(SUCCESS_SHOWN_KEY)
}

export function readPaymentStarted() {
  return normalizeStartedAt(readSession(STARTED_KEY))
}

/* Отметка времени из sessionStorage: только конечное число миллисекунд. */
function normalizeStartedAt(value) {
  const parsed = Number(value)
  return value === null || value === '' || value === undefined || !Number.isFinite(parsed)
    ? null
    : parsed
}

export function clearPaymentStarted() {
  removeSession(STARTED_KEY)
}

/*
 * Гость нажал «Оплатить» → флоу «Сохранить прогресс по email».
 * Запоминаем намерение и экран, чтобы после успешного входа вернуться
 * к оплате (экран «Подписка» восстанавливается по ключу Settings).
 */
export function beginGuestCheckout(now = Date.now()) {
  writeSession(GUEST_RESUME_KEY, String(now))
  writeSession(SETTINGS_SCREEN_KEY, 'subscription')
}

/* Намерение одноразовое: продолжение оплаты выполняется один раз. */
export function consumeGuestCheckout(now = Date.now()) {
  const started = normalizeStartedAt(readSession(GUEST_RESUME_KEY))
  if (!started || now - started > PAYMENT_RETURN_WINDOW_MS) {
    removeSession(GUEST_RESUME_KEY)
    return false
  }

  removeSession(GUEST_RESUME_KEY)
  return true
}
