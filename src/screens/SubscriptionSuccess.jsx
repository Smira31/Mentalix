// Полноэкранный экран успеха «pro активен.» — показывается один раз
// после успешной оплаты. Чёрный фон, строчный заголовок с точкой,
// открытый замок вместо закрытого, лёгкая анимация появления.
// Платёжная логика не меняется: даты берутся из ответа API.

import { BookOpen, LineChart, Lightbulb, Users } from 'lucide-react'
import Screen from '../components/Screen'
import { useBackButton } from '../platform/telegram.hooks'
import { ProUnlockedArt } from './settings/ProfileBannerArt'
import { FEATURES, formatProDate, pluralizeDays } from './SubscriptionManager'
import './SubscriptionSuccess.css'

export default function SubscriptionSuccessScreen({ subscription, onContinue }) {
  // «Продолжить» и системная «Назад» (Telegram) — одно действие.
  useBackButton(onContinue)

  const proDate = formatProDate(subscription?.expires_at)
  const daysLeft = subscription?.days_left
  const hasDateLine = proDate && Number.isInteger(daysLeft) && daysLeft >= 0

  return (
    <Screen
      onBack={onContinue}
      showHeader={false}
      registerSystemBack={false}
      footer={
        <button
          type="button"
          className="mx-profile-primary mx-subscription-success-cta"
          data-testid="subscription-success-continue"
          onClick={onContinue}
        >
          Продолжить
        </button>
      }
    >
      <div className="mx-subscription-success">
        <div className="mx-subscription-success__icon" aria-hidden="true">
          <ProUnlockedArt />
        </div>

        <h1 className="mx-subscription-success__title" data-testid="subscription-success-title">
          pro активен.
        </h1>
        <p className="mx-subscription-success__subtitle" data-testid="subscription-success-subtitle">
          Спасибо, что поддерживаешь Mentalix
        </p>

        {hasDateLine && (
          <p className="mx-subscription-success__date" data-testid="subscription-success-date">
            Pro до {proDate} · осталось {daysLeft} {pluralizeDays(daysLeft)}
          </p>
        )}

        <ul className="mx-subscription-success__features">
          {FEATURES.map(([Icon, title, description]) => (
            <li key={title} className="mx-subscription-success__feature">
              <span className="mx-subscription-success__feature-icon" aria-hidden="true">
                <Icon size={22} strokeWidth={1.6} />
              </span>
              <span className="mx-subscription-success__feature-text">
                <strong>{title}</strong>
                <span>{description}</span>
              </span>
            </li>
          ))}
        </ul>
      </div>
    </Screen>
  )
}
