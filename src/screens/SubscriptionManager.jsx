import { Check, Lock } from 'lucide-react'
import BackButton from '../components/BackButton'

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

export default function SubscriptionManager({ user: _user, tier, onBack }) {
  return (
    <div className="w-full max-w-md px-4 pt-2 pb-28 flex flex-col items-center">
      <div className="w-full grid grid-cols-[1fr_auto_1fr] items-center min-h-[42px] mb-6">
        <div className="justify-self-start">
          <BackButton onClick={onBack} />
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
