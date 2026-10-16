import { useCallback, useEffect, useRef, useState } from 'react'
import { BookOpen, LineChart, Lightbulb, Lock, Users } from 'lucide-react'
import { ProfileBody, ProfilePage } from './settings/ProfileUi'
import { PotentialLockArt, ProUnlockedArt } from './settings/ProfileBannerArt'
import { api } from '../lib/api'
import { platform, platformName } from '../platform'
import { isPreviewDemoMode } from '../lib/demoMode'
import { PAYMENT_UI_ENABLED, PRO_PRICE, PRO_PERIOD_LABEL, TRIBUTE_TG_LINK } from '../lib/paymentConfig'
import { getSubscriptionState, getDemoPayState, lockArtKind } from '../lib/subscriptionState'
import { openSupportChat } from '../lib/support'
import {
  CHECKOUT_ACTIONS,
  CHECKOUT_AUTH,
  CHECKOUT_COPY,
  CHECKOUT_CREATING,
  CHECKOUT_FAILED,
  CHECKOUT_GUEST,
  CHECKOUT_OK,
  CHECKOUT_UNAVAILABLE,
  beginGuestCheckout,
  checkoutAvailable,
  clearPaymentStarted,
  consumeGuestCheckout,
  markSuccessShown,
  paymentReturnState,
  readPaymentStarted,
  readSuccessShown,
  startCheckout,
  webGuestLoginCopy,
} from '../lib/yookassaCheckout'
import SubscriptionSuccessScreen from './SubscriptionSuccess'
import './SubscriptionManager.css'

/* Единственная кнопка оплаты: цена и период — из paymentConfig, не хардкодим. */
const PAY_CTA = `Оформить Pro — ${PRO_PRICE} ${PRO_PERIOD_LABEL}`

/*
 * Вход по email на вебе выключен, пока у проекта нет своего домена в Resend
 * (продакшн-сборка задаёт VITE_EMAIL_LOGIN_ENABLED=false, см. WebAuthScreen.jsx).
 * Тогда экран гостя ведёт в Telegram Login и не упоминает email вовсе.
 */
const emailLoginEnabled = import.meta.env.VITE_EMAIL_LOGIN_ENABLED !== 'false'

/*
 * «подписка.» — единственный тариф Mentalix Pro.
 *
 * При выключенном VITE_PAYMENT_UI_ENABLED — поведение ровно как сейчас:
 * статичный экран с описанием Pro и неактивной кнопкой «Оплата скоро появится».
 *
 * При включённом флаге — состояния экрана по ответу /api/subscription:
 *   guest   — веб: «Войди через Telegram, чтобы оформить Pro» + кнопка
 *             «Войти через Telegram» — она ведёт в существующий экран входа
 *             (Telegram Login), после входа оплата продолжается сама;
 *             Telegram: прежний флоу «Сохранить прогресс по email»
 *   base    — описание Pro + кнопка «Оформить Pro» (цена из paymentConfig)
 *   pro     — «Pro до <дата>», «осталось N дн.»
 *   expired — «Срок Pro закончился» + кнопка продления
 *   pending — «Оплата обрабатывается, это может занять несколько минут»
 *             + кнопка «Проверить оплату»
 *   success — «Оплата прошла»: только по свежему has_pro от /api/subscription
 *
 * В Telegram оплата идёт ВНЕ приложения, на стороне Tribute (ссылка
 * открывается внутри Telegram) — этот путь не менялся. В вебе оплата идёт
 * через ЮKassa: POST /api/payments/yookassa/create → редирект в текущей
 * вкладке (src/lib/yookassaCheckout.js). Повторная оплата при активном Pro
 * разрешена — период продлевается, кнопка не блокируется.
 *
 * Возврат с ЮKassa сам по себе оплатой не считается: решение принимает
 * только свежий ответ /api/subscription (has_pro). Фронтенд ничего не
 * подтверждает локально, платёжные данные не вводит и не хранит.
 */
export const FEATURES = [
  [Users, 'Спутники без ограничений', 'Наставник и другие спутники отвечают глубже и без лимита'],
  [BookOpen, 'Практикумы', '«Путь героя» и новые практикумы'],
  [LineChart, 'Полная аналитика и история', 'Все записи и связи между ними'],
  [Lightbulb, 'Персональные наблюдения', 'Что повторяется в твоих днях'],
]

const MONTHS = [
  'января', 'февраля', 'марта', 'апреля', 'мая', 'июня',
  'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря',
]

export function formatProDate(isoDate) {
  if (!isoDate) return null
  const d = new Date(isoDate)
  if (Number.isNaN(d.getTime())) return null
  return `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]}`
}

export default function SubscriptionManager({ user, tier: _tier, onBack, onGuestLogin }) {
  // ── Флаг выключен: поведение ровно как сейчас ──
  if (!PAYMENT_UI_ENABLED) {
    return <LegacySubscriptionManager onBack={onBack} />
  }

  return (
    <SubscriptionManagerEnabled user={user} onBack={onBack} onGuestLogin={onGuestLogin} />
  )
}

/* Прежний статичный экран — при выключенном флаге. */
function LegacySubscriptionManager({ onBack }) {
  return (
    <ProfilePage
      title="подписка."
      onBack={onBack}
      testId="profile-screen-subscription"
      footer={
        <button
          type="button"
          disabled
          data-testid="subscription-pay-button"
          className="mx-profile-disabled-cta"
        >
          <Lock size={14} aria-hidden="true" /> Оплата скоро появится
        </button>
      }
    >
      <ProfileBody>
        <div className="mx-subscription-art" aria-hidden="true">
          <PotentialLockArt />
        </div>

        <h2 className="mx-subscription-promise">Готов открыть свой потенциал?</h2>
        <p className="mx-subscription-pitch">
          Спутники без ограничений, практикумы и полная аналитика — в одном тарифе.
        </p>

        <p className="mx-subscription-price">{PRO_PRICE}<span>{PRO_PERIOD_LABEL}</span></p>

        <ul className="mx-subscription-features">
          {FEATURES.map(([Icon, title, description]) => (
            <li key={title} className="mx-subscription-feature">
              <span className="mx-subscription-feature__icon" aria-hidden="true">
                <Icon size={22} strokeWidth={1.6} />
              </span>
              <span className="mx-subscription-feature__text">
                <strong>{title}</strong>
                <span>{description}</span>
              </span>
            </li>
          ))}
        </ul>

        <p className="mx-subscription-free">
          Чек-ины, Мысль дня, журнал, ритуалы, аскезы, Наблюдатель и напоминания — бесплатно всегда.
        </p>
      </ProfileBody>
    </ProfilePage>
  )
}

/* Экран с состояниями оплаты — при включённом флаге. */
function SubscriptionManagerEnabled({ user, onBack, onGuestLogin }) {
  const inTelegram = platformName === 'telegram'
  /*
   * Гость — анонимная веб-сессия (is_guest): подписку не к чему привязать.
   * В вебе отсутствие email гостём не считается: после входа через Telegram
   * аккаунт есть, email не обязателен, и оплата должна открываться — на этом
   * же условии держится возврат к оплате после входа (consumeGuestCheckout).
   * В Telegram прежний признак сохранён: там экран ведёт в «Сохранить прогресс
   * по email» (путь Tribute не меняется).
   */
  const isGuest = !user || Boolean(user.is_guest) || (inTelegram && !user.email)
  const [subscription, setSubscription] = useState(null)
  const [loading, setLoading] = useState(true)
  const [localPending, setLocalPending] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)
  // Состояние оплаты ЮKassa: null — обычный экран, иначе состояние кнопки.
  const [checkoutState, setCheckoutState] = useState(null)
  // Начатая оплата переживает редирект на ЮKassa и обратную загрузку страницы.
  const [startedAt, setStartedAt] = useState(() => readPaymentStarted())
  const aliveRef = useRef(true)
  const paidRef = useRef(false)

  // ЮKassa — только в вебе и только при включённом флаге: в Telegram путь Tribute.
  const webCheckout = checkoutAvailable({ enabled: PAYMENT_UI_ENABLED, platform: platformName })

  const fetchSubscription = useCallback(() => {
    if (!user) return
    setLoading(true)
    api.subscription
      .get(user.id)
      .then(data => {
        if (!aliveRef.current) return
        setSubscription(data)
        setLoading(false)
        // Если оплата прошла — выходим из pending
        if (data?.has_pro) setLocalPending(false)
      })
      .catch(() => {
        if (!aliveRef.current) return
        setLoading(false)
      })
  }, [user])

  useEffect(() => {
    aliveRef.current = true
    fetchSubscription()
    return () => {
      aliveRef.current = false
    }
  }, [fetchSubscription, refreshKey])

  // Перечитываем при возврате в приложение (visibilitychange / Telegram activated)
  useEffect(() => {
    function onVisible() {
      if (document.visibilityState === 'visible') {
        setRefreshKey(k => k + 1)
      }
    }

    document.addEventListener('visibilitychange', onVisible)

    // Telegram WebApp activated event
    if (typeof window !== 'undefined' && window.Telegram?.WebApp?.onEvent) {
      window.Telegram.WebApp.onEvent('activated', onVisible)
    }

    return () => {
      document.removeEventListener('visibilitychange', onVisible)
      if (typeof window !== 'undefined' && window.Telegram?.WebApp?.offEvent) {
        window.Telegram.WebApp.offEvent('activated', onVisible)
      }
    }
  }, [])

  // Возврат с ЮKassa: оплатой считается только свежий has_pro.
  const returnState = paymentReturnState({ subscription, startedAt })

  useEffect(() => {
    if (returnState === 'success') paidRef.current = true
  }, [returnState])

  // Отметку о начатой оплате снимаем при уходе с экрана: экран успеха
  // показывается до конца визита, следующий вход видит обычное состояние Pro.
  useEffect(
    () => () => {
      if (paidRef.current) clearPaymentStarted()
    },
    []
  )

  // Демо-режим: ?payState= переопределяет состояние
  const demoPayState = getDemoPayState(isPreviewDemoMode)

  // Экран успеха показывается один раз: флаг в sessionStorage читается при
  // монтировании (useState), а не на каждом рендере — иначе двойной вызов API
  // в StrictMode после markSuccessShown() переключал бы экран на «Pro активен».
  const [successAlreadyShown] = useState(() => readSuccessShown())

  // Определяем состояние экрана
  let displayState
  if (demoPayState) {
    displayState = demoPayState
  } else if (loading && !subscription) {
    displayState = 'loading'
  } else if (localPending && subscription && !subscription.has_pro) {
    displayState = 'pending'
  } else if (returnState === 'success' && !successAlreadyShown) {
    displayState = 'success'
  } else if (returnState === 'pending') {
    displayState = 'pending'
  } else {
    displayState = getSubscriptionState(subscription, isGuest)
  }

  // Отмечаем показанный экран успеха в sessionStorage — повторное открытие
  // (новый монтируемый экземпляр) даст обычный «Pro активен».
  useEffect(() => {
    if (displayState === 'success') markSuccessShown()
  }, [displayState])

  /* Гость: сначала вход (в вебе — Telegram), после входа — возврат к оплате. */
  function beginGuestFlow() {
    beginGuestCheckout()
    onGuestLogin?.()
  }

  /* Веб: POST create → редирект на ЮKassa в текущей вкладке. */
  async function handleWebPay() {
    if (isGuest) {
      beginGuestFlow()
      return
    }

    setCheckoutState(CHECKOUT_CREATING)
    const result = await startCheckout({
      platform: platformName,
      enabled: PAYMENT_UI_ENABLED,
      create: () => api.payments.yookassa.create(),
      // Переход на ЮKassa — в текущей вкладке, без нового окна.
      navigate: url => window.location.assign(url),
    })

    // Успех — страница уже уходит на оплату, состояние не меняем.
    if (result.state === CHECKOUT_OK) return
    if (result.state === CHECKOUT_GUEST) {
      setCheckoutState(null)
      beginGuestFlow()
      return
    }

    setCheckoutState(result.state)
  }

  /* Telegram: прежний путь — ссылка Tribute открывается внутри Telegram. */
  function handleTributePay() {
    setLocalPending(true)
    platform.openTelegramLink(TRIBUTE_TG_LINK)
  }

  function handleCheckPayment() {
    setRefreshKey(k => k + 1)
  }

  // Гость сохранил прогресс по email — продолжаем оплату без второго нажатия.
  useEffect(() => {
    if (!webCheckout || isGuest || loading) return
    if (!consumeGuestCheckout()) return
    handleWebPay()
    // handleWebPay меняется вместе с isGuest; намерение одноразовое, повтор невозможен.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [webCheckout, isGuest, loading])

  // Полноэкранный экран успеха — один раз после оплаты, вместо обычного экрана.
  if (displayState === 'success') {
    return (
      <SubscriptionSuccessScreen
        subscription={
          demoPayState === 'success'
            ? { expires_at: new Date(Date.now() + 30 * 86400000).toISOString(), days_left: 30 }
            : subscription
        }
        onContinue={onBack}
      />
    )
  }

  return (
    <ProfilePage
      title="подписка."
      onBack={onBack}
      testId="profile-screen-subscription"
      footer={renderFooter({
        state: displayState,
        webCheckout,
        checkoutState,
        guestCopy: webGuestLoginCopy({ emailLoginEnabled }),
        onGuestCta: beginGuestFlow,
        onTributePay: handleTributePay,
        onWebPay: handleWebPay,
        onCheckPayment: handleCheckPayment,
        onLogin: onGuestLogin,
      })}
    >
      <ProfileBody>
        {displayState === 'loading' && (
          <p className="text-muted text-[13px]">Загрузка…</p>
        )}

        {displayState === 'guest' && (
          <GuestState
            webCheckout={webCheckout}
            emailLoginEnabled={emailLoginEnabled}
            onLogin={beginGuestFlow}
          />
        )}

        {displayState === 'base' && (
          <BaseState />
        )}

        {displayState === 'pro' && (
          <ProState
            subscription={
              demoPayState === 'pro'
                ? { expires_at: new Date(Date.now() + 30 * 86400000).toISOString(), days_left: 30 }
                : subscription
            }
          />
        )}

        {displayState === 'expired' && (
          <ExpiredState />
        )}

        {displayState === 'pending' && (
          <PendingState showSupportHint={webCheckout} />
        )}
      </ProfileBody>
    </ProfilePage>
  )
}

function renderFooter({
  state,
  webCheckout,
  checkoutState,
  guestCopy,
  onGuestCta,
  onTributePay,
  onWebPay,
  onCheckPayment,
  onLogin,
}) {
  if (state === 'guest') {
    // В вебе кнопка оплаты гостя ведёт на экран входа (Telegram Login),
    // после успеха возвращаемся к оплате.
    if (webCheckout) {
      return (
        <button
          type="button"
          className="mx-profile-primary"
          data-testid="subscription-pay-button"
          onClick={onGuestCta}
        >
          {guestCopy.cta}
        </button>
      )
    }
    // Telegram: прежний сценарий, кнопка открывает экран входа по email.
    return (
      <button
        type="button"
        className="mx-profile-primary"
        data-testid="subscription-save-progress"
        onClick={onLogin}
      >
        Сохранить прогресс по email
      </button>
    )
  }

  if (state === 'base' || state === 'expired') {
    if (!webCheckout) {
      return (
        <button
          type="button"
          className="mx-profile-primary"
          data-testid="subscription-pay-button"
          onClick={onTributePay}
        >
          {PAY_CTA}
        </button>
      )
    }

    // Оплата недоступна на стороне провайдера — без технических слов.
    if (checkoutState === CHECKOUT_UNAVAILABLE) {
      return (
        <p className="mx-subscription-web-note" data-testid="subscription-payment-unavailable">
          {CHECKOUT_COPY[CHECKOUT_UNAVAILABLE]}
        </p>
      )
    }

    // Сбой или нужен вход: сообщение + одно действие.
    if (checkoutState === CHECKOUT_FAILED || checkoutState === CHECKOUT_AUTH) {
      const needLogin = checkoutState === CHECKOUT_AUTH
      return (
        <div
          className="mx-subscription-pay-error"
          data-testid={needLogin ? 'subscription-login-required' : 'subscription-pay-failed'}
        >
          <p className="mx-subscription-pay-error__text">{CHECKOUT_COPY[checkoutState]}</p>
          <button
            type="button"
            className="mx-profile-primary"
            data-testid={needLogin ? 'subscription-login' : 'subscription-pay-retry'}
            onClick={needLogin ? onLogin : onWebPay}
          >
            {CHECKOUT_ACTIONS[checkoutState]}
          </button>
        </div>
      )
    }

    return (
      <button
        type="button"
        className="mx-profile-primary"
        data-testid="subscription-pay-button"
        disabled={checkoutState === CHECKOUT_CREATING}
        onClick={onWebPay}
      >
        {checkoutState === CHECKOUT_CREATING ? CHECKOUT_COPY[CHECKOUT_CREATING] : PAY_CTA}
      </button>
    )
  }

  if (state === 'pending') {
    return (
      <button
        type="button"
        className="mx-profile-primary"
        data-testid="subscription-check-payment"
        onClick={onCheckPayment}
      >
        Проверить оплату
      </button>
    )
  }

  // pro, success, loading — без кнопки
  return null
}

/* ── Состояние: гость ── */
function GuestState({ webCheckout, emailLoginEnabled, onLogin }) {
  // Веб: рабочий вход — Telegram Login; email упоминается только когда включён.
  if (webCheckout) {
    const copy = webGuestLoginCopy({ emailLoginEnabled })
    return (
      <>
        <div className="mx-subscription-art" aria-hidden="true">
          <PotentialLockArt />
        </div>
        <h2 className="mx-subscription-promise">{copy.heading}</h2>
        <p className="mx-subscription-pitch">{copy.pitch}</p>
        {copy.emailCta && (
          <button
            type="button"
            className="mx-subscription-support"
            data-testid="subscription-guest-email-login"
            onClick={onLogin}
          >
            {copy.emailCta}
          </button>
        )}
      </>
    )
  }

  // Telegram: прежний сценарий — сохранение прогресса по email.
  return (
    <>
      <div className="mx-subscription-art" aria-hidden="true">
        <PotentialLockArt />
      </div>
      <h2 className="mx-subscription-promise">Сначала сохрани прогресс по email</h2>
      <p className="mx-subscription-pitch">
        Чтобы оформить Pro, нужно привязать email — тогда записи не потеряются.
      </p>
    </>
  )
}

/* ── Состояние: base (без Pro) ── */
function BaseState() {
  return (
    <>
      <div className="mx-subscription-art" aria-hidden="true">
        <PotentialLockArt />
      </div>
      <h2 className="mx-subscription-promise">Готов открыть свой потенциал?</h2>
      <p className="mx-subscription-pitch">
        Спутники без ограничений, практикумы и полная аналитика — в одном тарифе.
      </p>
      <p className="mx-subscription-price">{PRO_PRICE}<span>{PRO_PERIOD_LABEL}</span></p>
      <ul className="mx-subscription-features">
        {FEATURES.map(([Icon, title, description]) => (
          <li key={title} className="mx-subscription-feature">
            <span className="mx-subscription-feature__icon" aria-hidden="true">
              <Icon size={22} strokeWidth={1.6} />
            </span>
            <span className="mx-subscription-feature__text">
              <strong>{title}</strong>
              <span>{description}</span>
            </span>
          </li>
        ))}
      </ul>
      <p className="mx-subscription-free">
        Чек-ины, Мысль дня, журнал, ритуалы, аскезы, Наблюдатель и напоминания — бесплатно всегда.
      </p>
    </>
  )
}

/* ── Состояние: Pro активен (обычное, не экран успеха) ── */
function ProState({ subscription }) {
  const proDate = formatProDate(subscription?.expires_at)
  const daysLeft = subscription?.days_left

  return (
    <>
      <div className="mx-subscription-art" aria-hidden="true">
        <ProUnlockedArt />
      </div>
      <h2 className="mx-subscription-promise">Pro активен</h2>
      {proDate && (
        <p className="mx-subscription-pitch">
          Pro до {proDate}
        </p>
      )}
      {Number.isInteger(daysLeft) && daysLeft >= 0 && (
        <p className="mx-subscription-pitch">
          осталось {daysLeft} {pluralizeDays(daysLeft)}
        </p>
      )}
      <ul className="mx-subscription-features">
        {FEATURES.map(([Icon, title, description]) => (
          <li key={title} className="mx-subscription-feature">
            <span className="mx-subscription-feature__icon" aria-hidden="true">
              <Icon size={22} strokeWidth={1.6} />
            </span>
            <span className="mx-subscription-feature__text">
              <strong>{title}</strong>
              <span>{description}</span>
            </span>
          </li>
        ))}
      </ul>
    </>
  )
}

/* ── Состояние: Pro истёк ── */
function ExpiredState() {
  return (
    <>
      <div className="mx-subscription-art" aria-hidden="true">
        <PotentialLockArt />
      </div>
      <h2 className="mx-subscription-promise">Срок Pro закончился</h2>
      <p className="mx-subscription-pitch">
        Спутники без ограничений, практикумы и полная аналитика — продли, чтобы вернуть доступ.
      </p>
      <p className="mx-subscription-price">{PRO_PRICE}<span>{PRO_PERIOD_LABEL}</span></p>
    </>
  )
}

/* ── Состояние: оплата обрабатывается ── */
function PendingState({ showSupportHint = false }) {
  return (
    <>
      <div className="mx-subscription-art" aria-hidden="true">
        <PotentialLockArt />
      </div>
      <h2 className="mx-subscription-promise">Оплата обрабатывается</h2>
      <p className="mx-subscription-pitch">
        Это может занять несколько минут. Нажмите «Проверить оплату», когда вернётесь.
      </p>
      {/* Подсказка про поддержку — только в вебе, где оплата идёт через ЮKassa. */}
      {showSupportHint && (
        <button
          type="button"
          className="mx-subscription-support"
          data-testid="subscription-support-hint"
          onClick={openSupportChat}
        >
          Оплата не пришла? Напишите в поддержку
        </button>
      )}
    </>
  )
}

export function pluralizeDays(n) {
  const mod10 = n % 10
  const mod100 = n % 100
  if (mod10 === 1 && mod100 !== 11) return 'день'
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return 'дня'
  return 'дней'
}
