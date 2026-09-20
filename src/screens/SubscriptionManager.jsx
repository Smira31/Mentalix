import { useState } from 'react'
import { Check, Cloud, Lightbulb, Lock, LockKeyhole, PenLine, Sparkles } from 'lucide-react'
import { createPortal } from 'react-dom'
import BackButton from '../components/BackButton'
import { isPreviewDemoMode } from '../lib/demoMode'
import { getFullscreenPortalTarget } from '../lib/fullscreenSurface'
import './SubscriptionManager.css'

const TIERS = [
  {
    key: 'base',
    name: 'Базовый',
    price: 'Бесплатно',
    features: [
      'Ритуалы и аскезы',
      'Один собеседник (Компас)',
      'Базовая аналитика',
      '1 блок нейротренажёра в день',
      'Считка дня — один источник',
    ],
  },
  {
    key: 'pro',
    name: 'Про',
    price: 'скоро можно будет оформить',
    features: [
      'Все три собеседника',
      'Полная аналитика с корреляциями',
      'Весь нейротренажёр без ограничений',
      'Чередование источников считки дня',
      'Напоминания в Telegram',
      'Курсы без ограничений',
    ],
  },
]

const DEMO_PLANS = {
  premium: {
    label: 'Premium',
    discount: 'Скидка 58% на функции Premium.',
    price: '690 ₽ в месяц · 8 280 ₽ в год',
    detail: 'Выгоднее помесячной оплаты для участников Mentalix.',
    features: [
      [PenLine, 'Ежедневные подсказки и журналы', 'Новые вопросы и короткие практики каждый день'],
      [Lightbulb, 'Разблокировать все упражнения', 'Медитации, дыхание, упражнения и больше'],
      [
        Cloud,
        'Автоматическая синхронизация',
        'Синхронизация между iPhone, Mac, iPad и Apple Watch',
      ],
      [Sparkles, 'Персональные отражения', 'Наблюдения, которые помогают замечать свой путь'],
      [LockKeyhole, 'Защитить записи', 'Личные записи остаются только на твоём устройстве'],
    ],
  },
  ai: {
    label: 'Premium + AI',
    discount: 'Скидка 40% на функции Premium + AI.',
    price: '1 290 ₽ в месяц · 15 480 ₽ в год',
    detail: 'Самый полный набор возможностей Mentalix.',
    features: [
      [Sparkles, 'Персональные отражения', 'Более точные подсказки на основе твоего пути'],
      [Lightbulb, 'Рефлексия с AI', 'Замечай закономерности и новые направления'],
      [Cloud, 'Умные уведомления', 'Напоминания, которые подстраиваются под тебя'],
      [PenLine, 'Ежедневные подсказки и журналы', 'Новые вопросы и короткие практики каждый день'],
      [LockKeyhole, 'Разблокировать все упражнения', 'Медитации, дыхание, упражнения и больше'],
    ],
  },
}

function DemoSubscriptionOffer({ onBack }) {
  const [plan, setPlan] = useState('premium')
  const selected = DEMO_PLANS[plan]

  return (
    <div className="mx-demo-subscription-offer">
      <div className="mx-demo-subscription-offer__topbar">
        <BackButton showInDemo onClick={onBack} />
        <div className="mx-demo-subscription-offer__switch" role="tablist" aria-label="Тариф">
          {Object.entries(DEMO_PLANS).map(([key, value]) => (
            <button
              key={key}
              type="button"
              role="tab"
              aria-selected={plan === key}
              onClick={() => setPlan(key)}
            >
              {value.label}
            </button>
          ))}
        </div>
        <span aria-hidden="true" />
      </div>

      <div className="mx-demo-subscription-offer__intro">
        <h1>
          Готов открыть
          <br />
          свой потенциал?
        </h1>
        <p>{selected.discount}</p>
      </div>

      <div className="mx-demo-subscription-offer__features">
        {selected.features.map(([Icon, title, description]) => (
          <div className="mx-demo-subscription-offer__feature" key={title}>
            <Icon size={20} strokeWidth={1.7} aria-hidden="true" />
            <div>
              <strong>{title}</strong>
              <span>{description}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="mx-demo-subscription-offer__price">
        <strong>{selected.price}</strong>
        <span>{selected.detail}</span>
      </div>
      <button type="button" className="mx-demo-subscription-offer__cta">
        Начать бесплатную пробу
      </button>
      <p className="mx-demo-subscription-offer__fineprint">
        Оплата пока не подключена.
        <br />
        Отменить можно в любой момент.
      </p>
    </div>
  )
}

export default function SubscriptionManager({ user: _user, tier, onBack }) {
  if (isPreviewDemoMode()) {
    return createPortal(<DemoSubscriptionOffer onBack={onBack} />, getFullscreenPortalTarget())
  }

  return (
    <div className="w-full max-w-md px-4 pt-2 pb-28 flex flex-col items-center">
      <div className="w-full grid grid-cols-[1fr_auto_1fr] items-center min-h-[42px] mb-6">
        <div className="justify-self-start">
          <BackButton showInDemo onClick={onBack} />
        </div>
        <h1 className="font-display text-[18px] text-cream">Подписка</h1>
        <span aria-hidden="true" />
      </div>

      {TIERS.map(t => {
        const isCurrent = tier === t.key
        return (
          <div
            key={t.key}
            className={`w-full rounded-2xl border p-5 mb-4 ${
              isCurrent ? 'border-gold bg-gold/5' : 'border-cream/[0.08] bg-cream/[0.03]'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <h2 className="font-display text-[16px] text-cream">{t.name}</h2>
              {isCurrent && (
                <span className="text-[10px] font-medium px-2.5 py-1 rounded-full bg-gold text-emerald-deep">
                  Текущий
                </span>
              )}
            </div>
            <p className="text-[13px] text-muted mb-4">{t.price}</p>
            <ul className="space-y-2 mb-4">
              {t.features.map(f => (
                <li key={f} className="flex items-start gap-2 text-[13px] text-cream">
                  <Check size={15} className="text-gold shrink-0 mt-0.5" />
                  {f}
                </li>
              ))}
            </ul>
            {t.key === 'pro' && !isCurrent && (
              <button
                disabled
                className="w-full py-3 rounded-xl bg-cream/10 text-muted text-[13px] font-medium flex items-center justify-center gap-2 cursor-not-allowed"
              >
                <Lock size={14} /> Оплата скоро появится
              </button>
            )}
          </div>
        )
      })}

      <p className="text-[11px] text-muted text-center px-4">
        Приём платежей за тариф Про пока не подключён — раздел появится здесь в следующем
        обновлении.
      </p>
    </div>
  )
}
