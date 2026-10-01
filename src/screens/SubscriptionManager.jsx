import { BookOpen, LineChart, Lightbulb, Lock, Users } from 'lucide-react'
import { ProfileBody, ProfileNote, ProfilePage } from './settings/ProfileUi'
import { PotentialLockArt } from './settings/ProfileBannerArt'
import './SubscriptionManager.css'

/*
 * «подписка.» — единственный тариф Mentalix Pro, 690 ₽/мес.
 * Оплата пока не подключена: кнопка неактивна («Оплата скоро появится»),
 * ничего не списывает. Скидок и пробы нет.
 *
 * Функции — только то, что реально входит в Pro. Мысль дня, напоминания,
 * Следопыт — бесплатные, перечислены отдельно под списком.
 *
 * Логика тарифов (включая Pro + ИИ) в api.js и бэкенде не тронута —
 * убран только интерфейс переключателя.
 */
const FEATURES = [
  [Users, 'Собеседники без ограничений', 'Наставник и другие собеседники отвечают глубже и без лимита'],
  [BookOpen, 'Курсы', '«Путь героя» и новые курсы'],
  [LineChart, 'Полная аналитика и история', 'Все записи и связи между ними'],
  [Lightbulb, 'Персональные наблюдения', 'Что повторяется в твоих днях'],
]

export default function SubscriptionManager({ tier: _tier, onBack }) {
  return (
    <ProfilePage title="подписка." onBack={onBack} testId="profile-screen-subscription">
      <ProfileBody>
        <div className="mx-subscription-art" aria-hidden="true">
          <PotentialLockArt />
        </div>

        <h2 className="mx-subscription-promise">Готов открыть свой потенциал?</h2>
        <p className="mx-subscription-pitch">
          Собеседники без ограничений, курсы и полная аналитика — в одном тарифе.
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
          Чек-ины, Мысль дня, журнал, ритуалы, аскезы, Следопыт и напоминания — бесплатно всегда.
        </p>

        <button
          type="button"
          disabled
          data-testid="subscription-pay-button"
          className="mx-profile-disabled-cta"
        >
          <Lock size={14} aria-hidden="true" /> Оплата скоро появится
        </button>
        <ProfileNote>Оплата пока не подключена.</ProfileNote>
      </ProfileBody>
    </ProfilePage>
  )
}
