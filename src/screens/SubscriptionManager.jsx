import { useCallback, useEffect, useRef, useState } from 'react'
import { BookOpen, LineChart, Lightbulb, Lock, Users } from 'lucide-react'
import { ProfileBody, ProfilePage } from './settings/ProfileUi'
import { PotentialLockArt } from './settings/ProfileBannerArt'
import { api } from '../lib/api'
import { platform, platformName } from '../platform'
import { isPreviewDemoMode } from '../lib/demoMode'
import { PAYMENT_UI_ENABLED, PRO_PRICE, PRO_DURATION_LABEL, TRIBUTE_TG_LINK } from '../lib/paymentConfig'
import { getSubscriptionState, getDemoPayState } from '../lib/subscriptionState'
import './SubscriptionManager.css'

/*
 * «подписка.» — единственный тариф Mentalix Pro.
 *
 * При выключенном VITE_PAYMENT_UI_ENABLED — поведение ровно как сейчас:
 * статичный экран с описанием Pro и неактивной кнопкой «Оплата скоро появится».
 *
 * При включённом флаге — состояния экрана по ответу /api/subscription:
 *   guest   — «Сначала сохрани прогресс по email» + кнопка в сценарий
 *             «Сохранить прогресс по email», кнопки оплаты нет
 *   base    — описание Pro + кнопка «Оформить Pro — 990 ₽ на 30 дней»
 *   pro     — «Pro до <дата>», «осталось N дн.»
 *   expired — «Срок Pro закончился» + кнопка продления
 *   pending — «Оплата обрабатывается, это может занять несколько минут»
 *             + кнопка «Проверить оплату»
 *
 * Оплата идёт ВНЕ приложения, на стороне Tribute. Фронтенд не подтверждает
 * оплату локально, не отправляет платёжные данные и не кэширует has_pro
 * как истину: опирается только на свежий ответ /api/subscription.
 *
 * Вне Telegram (обычный браузер) кнопка оплаты не показывается, вместо неё —
 * «Оплата доступна в приложении Mentalix в Telegram».
 */
const FEATURES = [
  [Users, 'Спутники без ограничений', 'Наставник и другие спутники отвечают глубже и без лимита'],
  [BookOpen, 'Практикумы', '«Путь героя» и новые практикумы'],
  [LineChart, 'Полная аналитика и история', 'Все записи и связи между ними'],
  [Lightbulb, 'Персональные наблюдения', 'Что повторяется в твоих днях'],
]

const MONTHS = [
  'января', 'февраля', 'марта', 'апреля', 'мая', 'июня',
  'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря',
]

function formatProDate(isoDate) {
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

        <p className="mx-subscription-price">690 ₽<span>/мес</span></p>

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
  const isGuest = !user || user.is_guest || !user.email
  const [subscription, setSubscription] = useState(null)
  const [loading, setLoading] = useState(true)
  const [localPending, setLocalPending] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)
  const aliveRef = useRef(true)

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

  // Демо-режим: ?payState= переопределяет состояние
  const demoPayState = getDemoPayState(isPreviewDemoMode)

  // Определяем состояние экрана
  let displayState
  if (demoPayState) {
    displayState = demoPayState
  } else if (loading && !subscription) {
    displayState = 'loading'
  } else if (localPending && subscription && !subscription.has_pro) {
    displayState = 'pending'
  } else {
    displayState = getSubscriptionState(subscription, isGuest)
  }

  const inTelegram = platformName === 'telegram'

  function handlePay() {
    setLocalPending(true)
    // Открываем ссылку Tribute внутри Telegram
    platform.openTelegramLink(TRIBUTE_TG_LINK)
  }

  function handleCheckPayment() {
    setRefreshKey(k => k + 1)
  }

  return (
    <ProfilePage
      title="подписка."
      onBack={onBack}
      testId="profile-screen-subscription"
      footer={renderFooter(displayState, inTelegram, handlePay, handleCheckPayment, onGuestLogin)}
    >
      <ProfileBody>
        {displayState === 'loading' && (
          <p className="text-muted text-[13px]">Загрузка…</p>
        )}

        {displayState === 'guest' && (
          <GuestState onGuestLogin={onGuestLogin} />
        )}

        {displayState === 'base' && (
          <BaseState />
        )}

        {displayState === 'pro' && (
          <ProState subscription={demoPayState === 'pro' ? { expires_at: null, days_left: 30 } : subscription} />
        )}

        {displayState === 'expired' && (
          <ExpiredState />
        )}

        {displayState === 'pending' && (
          <PendingState />
        )}
      </ProfileBody>
    </ProfilePage>
  )
}

function renderFooter(state, inTelegram, handlePay, handleCheckPayment, onGuestLogin) {
  if (state === 'guest') {
    return (
      <button
        type="button"
        data-testid="subscription-save-progress"
        onClick={onGuestLogin}
      >
        Сохранить прогресс по email
      </button>
    )
  }

  if (state === 'base' || state === 'expired') {
    if (!inTelegram) {
      return (
        <p className="mx-subscription-web-note" data-testid="subscription-web-note">
          Оплата доступна в приложении Mentalix в Telegram
        </p>
      )
    }
    return (
      <button
        type="button"
        data-testid="subscription-pay-button"
        onClick={handlePay}
      >
        Оформить Pro — {PRO_PRICE} на {PRO_DURATION_LABEL}
      </button>
    )
  }

  if (state === 'pending') {
    return (
      <button
        type="button"
        data-testid="subscription-check-payment"
        onClick={handleCheckPayment}
      >
        Проверить оплату
      </button>
    )
  }

  // pro, loading — без кнопки
  return null
}

/* ── Состояние: гость ── */
function GuestState({ onGuestLogin }) {
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
      <p className="mx-subscription-price">{PRO_PRICE}<span> на {PRO_DURATION_LABEL}</span></p>
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

/* ── Состояние: Pro активен ── */
function ProState({ subscription }) {
  const proDate = formatProDate(subscription?.expires_at)
  const daysLeft = subscription?.days_left

  return (
    <>
      <div className="mx-subscription-art" aria-hidden="true">
        <PotentialLockArt />
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
      <p className="mx-subscription-price">{PRO_PRICE}<span> на {PRO_DURATION_LABEL}</span></p>
    </>
  )
}

/* ── Состояние: оплата обрабатывается ── */
function PendingState() {
  return (
    <>
      <div className="mx-subscription-art" aria-hidden="true">
        <PotentialLockArt />
      </div>
      <h2 className="mx-subscription-promise">Оплата обрабатывается</h2>
      <p className="mx-subscription-pitch">
        Это может занять несколько минут. Нажмите «Проверить оплату», когда вернётесь.
      </p>
    </>
  )
}

function pluralizeDays(n) {
  const mod10 = n % 10
  const mod100 = n % 100
  if (mod10 === 1 && mod100 !== 11) return 'день'
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return 'дня'
  return 'дней'
}
