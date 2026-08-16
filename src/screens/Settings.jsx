// src/screens/Settings.jsx
//
// Экран настроек Mentalix. Секции: 1. Профиль+тариф  2. Уведомления  3. Разбор дня
//         4. Основные  5. Поддержка  6. Документы  7. Версия  8. Аккаунт

import { useEffect, useState } from 'react'
import BackButton from '../components/BackButton'
import {
  ChevronRight,
  User,
  Bell,
  Globe,
  Lock,
  LifeBuoy,
  RefreshCw,
  Heart,
  Moon,
} from 'lucide-react'
import { api } from '../lib/api'
import { forget, useSynced } from '../lib/store'
import { requestMessages, biometric } from '../platform/telegram.hooks'
import { platformName } from '../platform'
import { hasPinRecord, clearPinRecord, APP_LOCK_ENABLED_KEY } from '../lib/appLock'
import QuotesManager from './QuotesManager'
import SubscriptionManager from './SubscriptionManager'
import DonateScreen from './DonateScreen'
import LinkWebAccount from './LinkWebAccount'
import AppLock from './AppLock'

function SectionLabel({ children }) {
  return (
    <div className="px-1 mb-2 text-xs font-body uppercase tracking-wider text-muted">
      {children}
    </div>
  )
}

function Card({ children }) {
  return (
    <div className="bg-cream/[0.03] border border-cream/[0.08] rounded-2xl overflow-hidden mb-8 w-full">
      {children}
    </div>
  )
}

function Row({
  icon: Icon,
  title,
  subtitle,
  onClick,
  danger = false,
  right = null,
  divider = true,
}) {
  const Component = onClick ? 'button' : 'div'

  return (
    <Component
      {...(onClick ? { type: 'button', onClick } : {})}
      className={`w-full flex items-center gap-3 px-4 py-4 text-left ${
        divider ? 'border-b border-cream/[0.06]' : ''
      } active:bg-cream/[0.04] transition-colors`}
    >
      {Icon && <Icon size={18} className={danger ? 'text-red-400' : 'text-gold shrink-0'} />}
      <div className="flex-1 min-w-0">
        <div className={`font-body text-[15px] ${danger ? 'text-red-400' : 'text-cream'}`}>
          {title}
        </div>
        {subtitle && (
          <div className="font-body text-[13px] text-muted mt-0.5 truncate">{subtitle}</div>
        )}
      </div>
      {right ?? <ChevronRight size={18} className="text-muted shrink-0" />}
    </Component>
  )
}

function Toggle({ checked, label, onChange }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={`w-11 h-6 rounded-full transition-colors relative shrink-0 ${checked ? 'bg-gold' : 'bg-cream/10'}`}
    >
      <span
        className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-cream transition-transform ${
          checked ? 'translate-x-5' : ''
        }`}
      />
    </button>
  )
}

const REMINDER_TIMES = [
  { label: 'Утро', hour: 8 },
  { label: 'День', hour: 14 },
  { label: 'Вечер', hour: 19 },
  { label: 'Ночь', hour: 22 },
]

// Часы, с которых «Сегодня» переключается на разбор дня.
// Это не рассылка: приложение ничего не присылает, просто меняет экран.
const REVIEW_HOURS = [18, 19, 20, 21, 22]

export default function Settings({ user, onBack, onNavigate }) {
  const [reminderHour, setReminderHour] = useState(null)
  const [reminderOn, setReminderOn] = useState(false)
  const [reviewHour, setReviewHour] = useState(19)

  useEffect(() => {
    if (!user) return
    api.profile
      .getSettings(user.id)
      .then(s => {
        setReminderHour(s?.reminder_hour ?? 19)
        setReminderOn(!!s?.reminder_enabled)
        setReviewHour(s?.review_hour ?? 19)
      })
      .catch(() => {
        setReminderHour(19)
      })
  }, [user])

  async function saveReminder(hour, enabled) {
    /*
     * Право писать спрашиваем ровно здесь и больше нигде.
     *
     * Telegram позволяет запросить его в любой момент, и соблазн
     * сделать это на старте велик. Но человек, которого просят о
     * разрешении до того, как он о чём-то попросил сам, почти
     * всегда отказывает — и второй раз спросить будет уже нельзя.
     * Здесь он сам включает напоминание, то есть сам просит бота
     * ему написать: вопрос очевиден и уместен.
     *
     * Отказ не блокирует настройку. Напоминание останется
     * включённым, просто не придёт, — а человек сможет разрешить
     * позже, написав боту.
     */
    if (enabled && !reminderOn) {
      await requestMessages()
    }

    setReminderHour(hour)
    setReminderOn(enabled)

    try {
      await api.profile.saveSettings(user.id, { reminder_enabled: enabled, reminder_hour: hour })
    } catch (e) {
      console.error(e)
    }
  }

  async function saveReviewHour(hour) {
    const prev = reviewHour
    setReviewHour(hour)
    try {
      await api.profile.saveSettings(user.id, { review_hour: hour })
    } catch (e) {
      console.error(e)
      setReviewHour(prev)
    }
  }

  // ── Блокировка приложения: см. src/lib/appLock.js и App.jsx.
  // Синхронизируется только флаг «включено», сам PIN — только локально,
  // поэтому на новом устройстве флаг может быть «включено», а PIN ещё
  // не задан здесь (lockConfiguredHere = false).
  const [lockEnabledFlag, setLockEnabledFlag] = useSynced(APP_LOCK_ENABLED_KEY, '0')
  const lockOn = lockEnabledFlag === '1'
  const lockConfiguredHere = hasPinRecord()
  const [biometricAvailable, setBiometricAvailable] = useState(false)

  useEffect(() => {
    if (platformName !== 'telegram') return
    let alive = true
    biometric.isAvailable().then(available => {
      if (alive) setBiometricAvailable(available)
    })
    return () => {
      alive = false
    }
  }, [])

  function handleLockPress() {
    if (lockOn && lockConfiguredHere) {
      clearPinRecord()
      setLockEnabledFlag('0')
      return
    }

    setScreen('app-lock-setup')
  }

  const [screen, setScreen] = useState(null) // null | 'quotes' | 'subscription' | 'donate' | 'link-web' | 'app-lock-setup'
  const [tier, setTier] = useState('base')
  const go = key => onNavigate?.(key)

  useEffect(() => {
    if (!user) return
    api.subscription
      .get(user.id)
      .then(s => setTier(s.tier))
      .catch(console.error)
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

  if (screen === 'link-web') {
    return <LinkWebAccount onBack={() => setScreen(null)} />
  }

  if (screen === 'app-lock-setup') {
    return (
      <AppLock
        mode="setup"
        onCancel={() => setScreen(null)}
        onSetupDone={() => {
          setLockEnabledFlag('1')
          setScreen(null)
        }}
      />
    )
  }

  const tierLabel = tier === 'pro' ? 'Про' : 'Базовый'

  return (
    <div className="w-full max-w-md px-5 flex flex-col items-center">
      <div className="w-full grid grid-cols-[1fr_auto_1fr] items-center min-h-[42px] mb-6">
        <div className="justify-self-start">
          <BackButton
            onClick={onBack}
            className="max-[359px]:w-10 max-[359px]:justify-center max-[359px]:gap-0 max-[359px]:px-0 max-[359px]:[&>span]:hidden"
          />
        </div>
        <h1 className="font-display text-xl text-cream lowercase">настройки.</h1>
        <span aria-hidden="true" />
      </div>

      <SectionLabel>Профиль</SectionLabel>
      <Card>
        <Row
          icon={User}
          title={user?.first_name ?? 'Профиль'}
          subtitle="Профиль и мой путь"
          right={
            <span className="flex items-center gap-2">
              <span
                className={`text-[10px] font-medium px-2.5 py-1 rounded-full ${tier === 'pro' ? 'bg-gold text-emerald-deep' : 'bg-cream/10 text-muted'}`}
              >
                {tierLabel}
              </span>
              <ChevronRight size={18} className="text-muted shrink-0" />
            </span>
          }
          onClick={() => go('profile')}
        />
        <Row
          title="Управлять подпиской"
          onClick={() => setScreen('subscription')}
          divider={false}
        />
      </Card>

      <SectionLabel>Уведомления</SectionLabel>
      <Card>
        <Row title="Мысль дня" subtitle="Мои фразы" onClick={() => setScreen('quotes')} />
        <Row
          icon={Bell}
          title="Напоминание от бота"
          subtitle={
            reminderOn
              ? `Каждый день в ${String(reminderHour).padStart(2, '0')}:00 (МСК)`
              : 'Выключено'
          }
          right={
            <Toggle
              checked={reminderOn}
              label="Напоминание от бота"
              onChange={() => saveReminder(reminderHour ?? 19, !reminderOn)}
            />
          }
          divider={false}
        />
      </Card>

      {reminderOn && (
        <div className="flex gap-2 mb-8 w-full">
          {REMINDER_TIMES.map(t => (
            <button
              key={t.hour}
              onClick={() => saveReminder(t.hour, true)}
              className={[
                'flex-1 py-3 rounded-2xl text-[13px] font-bold border-0 transition-colors',
                reminderHour === t.hour
                  ? 'bg-gold text-emerald-deep'
                  : 'bg-cream/[0.04] text-muted',
              ].join(' ')}
            >
              {t.label}
              <span className="block text-[11px] font-semibold opacity-60 mt-0.5">
                {String(t.hour).padStart(2, '0')}:00
              </span>
            </button>
          ))}
        </div>
      )}

      <SectionLabel>Разбор дня</SectionLabel>
      <Card>
        <Row
          icon={Moon}
          title="Когда показывать разбор"
          subtitle="«Сегодня» сам предложит подвести итоги"
          right={
            <span className="text-[11px] font-mono text-gold bg-gold/10 rounded-full px-2.5 py-1 shrink-0">
              {String(reviewHour).padStart(2, '0')}:00
            </span>
          }
          divider={false}
        />
      </Card>
      <div className="flex gap-2 mb-8 w-full">
        {REVIEW_HOURS.map(h => (
          <button
            key={h}
            onClick={() => saveReviewHour(h)}
            className={[
              'flex-1 py-3 rounded-2xl text-[13px] font-bold border-0 transition-colors',
              reviewHour === h ? 'bg-gold text-emerald-deep' : 'bg-cream/[0.04] text-muted',
            ].join(' ')}
          >
            {String(h).padStart(2, '0')}
          </button>
        ))}
      </div>

      <SectionLabel>Основные</SectionLabel>
      <Card>
        <Row
          icon={Globe}
          title="Связать с сайтом"
          subtitle="Использовать те же данные в браузере"
          onClick={() => setScreen('link-web')}
        />
        <Row
          icon={Lock}
          title="Блокировка приложения"
          subtitle={
            !lockOn
              ? 'Код доступа при входе'
              : !lockConfiguredHere
                ? 'Включено, но не задано на этом устройстве'
                : biometricAvailable
                  ? 'Код + Face ID/Touch ID'
                  : 'Код доступа'
          }
          right={
            <Toggle checked={lockOn} label="Блокировка приложения" onChange={handleLockPress} />
          }
          divider={false}
        />
      </Card>

      <SectionLabel>Поддержка</SectionLabel>
      <Card>
        <Row
          icon={LifeBuoy}
          title="Написать в поддержку"
          subtitle="@mentalix_support_bot"
          onClick={() => window.open('https://t.me/mentalix_support_bot', '_blank')}
        />
        <Row
          icon={Heart}
          title="Поддержать проект"
          onClick={() => setScreen('donate')}
          divider={false}
        />
      </Card>

      <SectionLabel>Обновление приложения</SectionLabel>
      <Card>
        <div className="w-full flex items-center gap-3 px-4 py-4 border-b border-cream/[0.06]">
          <RefreshCw size={18} className="text-gold shrink-0" />
          <span className="flex-1 font-body text-[15px] text-cream">Текущая версия</span>
          <span className="text-muted text-sm font-body">v1.0.0</span>
        </div>
        <Row
          title="Пройти знакомство заново"
          subtitle="Показать первые экраны и заново собрать план"
          onClick={async () => {
            /*
             * Стираем отметку и локально, и в облаке. Иначе после
             * перезагрузки облако вернёт её обратно, и знакомство
             * не начнётся — кнопка будет молча не работать.
             */
            await forget('mx-onboarded-v2')

            window.location.reload()
          }}
          divider={false}
        />
      </Card>
    </div>
  )
}
