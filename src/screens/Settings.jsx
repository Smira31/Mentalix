// src/screens/Settings.jsx
//
// Экран настроек Mentalix. Секции: 1. Профиль+тариф  2. Уведомления  3. Основные
//         4. Поддержка      5. Документы    6. Версия  7. Аккаунт

import { useEffect, useState } from 'react'
import {
  ChevronLeft,
  ChevronRight,
  User,
  Bell,
  Globe,
  LifeBuoy,
  FileText,
  RefreshCw,
  Trash2,
  Heart,
} from 'lucide-react'
import { api } from '../lib/api'
import QuotesManager from './QuotesManager'
import SubscriptionManager from './SubscriptionManager'
import DonateScreen from './DonateScreen'

function SectionLabel({ children }) {
  return (
    <div className="px-1 mb-2 text-xs font-body uppercase tracking-wider text-sage/70">
      {children}
    </div>
  )
}

function Card({ children }) {
  return (
    <div className="bg-white/[0.03] border border-white/[0.08] rounded-2xl overflow-hidden mb-8 w-full">
      {children}
    </div>
  )
}

function Row({ icon: Icon, title, subtitle, onClick, danger = false, right = null, divider = true }) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-4 text-left ${
        divider ? 'border-b border-white/[0.06]' : ''
      } active:bg-white/[0.04] transition-colors`}
    >
      {Icon && <Icon size={18} className={danger ? 'text-red-400' : 'text-gold shrink-0'} />}
      <div className="flex-1 min-w-0">
        <div className={`font-body text-[15px] ${danger ? 'text-red-400' : 'text-cream'}`}>{title}</div>
        {subtitle && <div className="font-body text-[13px] text-sage/70 mt-0.5 truncate">{subtitle}</div>}
      </div>
      {right ?? <ChevronRight size={18} className="text-sage/50 shrink-0" />}
    </button>
  )
}

function Toggle({ checked, onChange }) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className={`w-11 h-6 rounded-full transition-colors relative shrink-0 ${checked ? 'bg-gold' : 'bg-white/10'}`}
    >
      <span
        className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-cream transition-transform ${
          checked ? 'translate-x-5' : ''
        }`}
      />
    </button>
  )
}

export default function Settings({ user, onBack, onNavigate }) {
  const [telegramNotifs, setTelegramNotifs] = useState(false)
  const [screen, setScreen] = useState(null) // null | 'quotes' | 'subscription' | 'donate'
  const [tier, setTier] = useState('base')
  const go = (key) => onNavigate?.(key)

  useEffect(() => {
    if (!user) return
    api.subscription.get(user.id).then((s) => setTier(s.tier)).catch(console.error)
  }, [user, screen])

  if (screen === 'quotes') {
    return <QuotesManager user={user} onBack={() => setScreen(null)} />
  }

  if (screen === 'subscription') {
    return <SubscriptionManager user={user} tier={tier} onBack={() => setScreen(null)} />
  }

  if (screen === 'donate') {
    return <DonateScreen user={user} onBack={() => setScreen(null)} />
  }

  const tierLabel = tier === 'pro' ? 'Про' : 'Базовый'

  return (
    <div className="w-full max-w-md px-4 pt-2 pb-28 flex flex-col items-center">
      <div className="w-full flex items-center gap-2 mb-6">
        <button onClick={onBack} className="p-2 -ml-2 text-cream active:opacity-60">
          <ChevronLeft size={22} />
        </button>
        <h1 className="font-display text-xl text-cream">Настройки</h1>
      </div>

      <Card>
        <Row
          icon={User}
          title={user?.first_name ?? 'Профиль'}
          subtitle={`Тариф: ${tierLabel}`}
          right={
            <span className={`text-[10px] font-medium px-2.5 py-1 rounded-full ${tier === 'pro' ? 'bg-gold text-emerald-deep' : 'bg-white/10 text-sage/70'}`}>
              {tierLabel}
            </span>
          }
          onClick={() => go('profile-edit')}
        />
        <Row title="Управлять подпиской" onClick={() => setScreen('subscription')} divider={false} />
      </Card>

      <SectionLabel>Уведомления</SectionLabel>
      <Card>
        <Row icon={Bell} title="Уведомления в Telegram" right={<Toggle checked={telegramNotifs} onChange={setTelegramNotifs} />} />
        <Row title="Считка дня" subtitle="Мои фразы" onClick={() => setScreen('quotes')} />
        <Row title="Напоминания о ритуалах и аскезах" onClick={() => go('reminders')} divider={false} />
      </Card>

      <SectionLabel>Основные</SectionLabel>
      <Card>
        <Row title="Имя" subtitle={user?.first_name} onClick={() => go('name')} />
        <Row icon={Globe} title="Язык" subtitle="Русский" onClick={() => go('language')} divider={false} />
      </Card>

      <SectionLabel>Поддержка</SectionLabel>
      <Card>
        <Row icon={LifeBuoy} title="Написать в поддержку" subtitle="@mentalix_support_bot" onClick={() => window.open('https://t.me/mentalix_support_bot', '_blank')} />
        <Row icon={Heart} title="Поддержать проект" onClick={() => setScreen('donate')} divider={false} />
      </Card>

      <SectionLabel>Документы</SectionLabel>
      <Card>
        <Row icon={FileText} title="Пользовательское соглашение" onClick={() => go('terms')} />
        <Row icon={FileText} title="Политика конфиденциальности" onClick={() => go('privacy')} />
        <Row icon={FileText} title="Политика возврата" onClick={() => go('refund')} divider={false} />
      </Card>

      <SectionLabel>Обновление приложения</SectionLabel>
      <Card>
        <Row icon={RefreshCw} title="Текущая версия" right={<span className="text-sage/70 text-sm font-body">v1.0.0</span>} />
      </Card>

      <SectionLabel>Аккаунт</SectionLabel>
      <Card>
        <Row title="Очистить историю" subtitle="Удалить все записи собеседников" onClick={() => go('clear-history')} />
        <Row icon={Trash2} title="Удалить аккаунт" subtitle="Все данные будут удалены" danger onClick={() => go('delete-account')} divider={false} />
      </Card>
    </div>
  )
}