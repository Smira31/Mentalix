import { useState } from 'react'
import {
  Bell,
  BookOpen,
  Lightbulb,
  LineChart,
  Lock,
  MessageCircle,
  Mountain,
  RefreshCw,
  Sparkles,
  Users,
} from 'lucide-react'
import { ProfileBody, ProfileNote, ProfilePage } from './settings/ProfileUi'
import './SubscriptionManager.css'

/*
 * «подписка.» — экран тарифов Mentalix Pro и Mentalix Pro + ИИ.
 * Оплата пока не подключена: кнопка неактивна («Оплата скоро появится»),
 * ничего не списывает. Скидок нет — цены показываем как есть, без процентов.
 *
 * Функции — только то, что реально есть в Mentalix (собеседники, аналитика,
 * курсы, «Мысль дня», напоминания, ИИ-собеседники, наблюдения Следопыта).
 * Stoic-функций, которых у нас нет (синхронизация с Apple-устройствами,
 * медитации, дыхание), здесь нет.
 */
const TIERS = [
  {
    key: 'pro',
    name: 'Mentalix Pro',
    price: '690 ₽/мес · 8 280 ₽/год',
    features: [
      [Users, 'Все три собеседника', 'Собеседник, Наставник и Следопыт'],
      [LineChart, 'Полная аналитика и история', 'Корреляции и вся лента записей'],
      [BookOpen, 'Курсы без ограничений', '«Путь героя» и новые курсы'],
      [RefreshCw, 'Чередование «Мысли дня»', 'Разные источники каждый день'],
      [Bell, 'Напоминания в Telegram', 'Поддержка ритма практики'],
    ],
  },
  {
    key: 'pro-ai',
    name: 'Mentalix Pro + ИИ',
    price: '1 290 ₽/мес · 15 480 ₽/год',
    features: [
      [Sparkles, 'Всё из Mentalix Pro', 'Собеседники, аналитика и курсы'],
      [MessageCircle, 'Собеседники с ИИ', 'Глубокие ответы Наставника и Следопыта'],
      [Lightbulb, 'Персональные наблюдения', 'Дайджест и инсайты от Следопыта'],
      [Mountain, 'Направления от Наставника', 'Следующий шаг к твоему намерению'],
    ],
  },
]

export default function SubscriptionManager({ tier: _tier, onBack }) {
  const [plan, setPlan] = useState('pro')
  const selected = TIERS.find(t => t.key === plan)

  return (
    <ProfilePage title="подписка." onBack={onBack} testId="profile-screen-subscription">
      <ProfileBody>
        {/* Переключатель тарифов — под заголовком, не наезжает на него. */}
        <div className="mx-subscription-switch" role="tablist" aria-label="Тариф">
          {TIERS.map(t => (
            <button
              key={t.key}
              type="button"
              role="tab"
              aria-selected={plan === t.key}
              onClick={() => setPlan(t.key)}
              data-testid={`subscription-tab-${t.key}`}
            >
              {t.name}
            </button>
          ))}
        </div>

        <p className="mx-subscription-price">{selected.price}</p>

        {/* Список функций — обычный список на странице, без внутренней прокрутки. */}
        <ul className="mx-subscription-features">
          {selected.features.map(([Icon, title, description]) => (
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
