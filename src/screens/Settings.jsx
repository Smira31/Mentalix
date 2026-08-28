// src/screens/Settings.jsx
//
// Экран настроек Mentalix. Секции: 1. Профиль+тариф  2. Уведомления  3. Разбор дня
//         4. Карточки «Сегодня»  5. Внешний вид  6. Основные  7. Поддержка
//         8. Документы  9. Версия  10. Аккаунт

import { useCallback, useEffect, useState } from 'react'
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
  Download,
  ShieldCheck,
} from 'lucide-react'
import { api } from '../lib/api'
import { forget, useSynced } from '../lib/store'
import { requestMessages, biometric } from '../platform/telegram.hooks'
import { platform, platformName } from '../platform'
import { hasPinRecord, clearPinRecord, APP_LOCK_ENABLED_KEY } from '../lib/appLock'
import { MOOD_CHECK_ENABLED_KEY } from '../lib/moodCheckDraft'
import { clearCheckinDraft } from '../lib/checkinDraft'
import {
  TODAY_CARDS_HIDDEN_KEY,
  TODAY_CARD_IDS,
  TODAY_CARD_LABELS,
  parseHiddenCards,
} from '../lib/todayCardVisibility'
import { ACCENT_COLORS } from '../lib/accentColor'
import QuotesManager from './QuotesManager'
import SubscriptionManager from './SubscriptionManager'
import DonateScreen from './DonateScreen'
import LinkWebAccount from './LinkWebAccount'
import AppLock from './AppLock'
import PrivacyNotice from './PrivacyNotice'

function SectionLabel({ children }) {
  return (
    <div className="px-1 mb-2 text-[11px] font-label uppercase tracking-wider text-muted">
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
        <div className={`font-body text-[14px] ${danger ? 'text-red-400' : 'text-cream'}`}>
          {title}
        </div>
        {subtitle && (
          <div className="font-body text-[12px] text-muted mt-0.5 truncate">{subtitle}</div>
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
const TIMEZONES = [
  ['Europe/Moscow', 'Москва'],
  ['Europe/Kaliningrad', 'Калининград'],
  ['Asia/Yekaterinburg', 'Екатеринбург'],
  ['Asia/Novosibirsk', 'Новосибирск'],
  ['Asia/Vladivostok', 'Владивосток'],
]

export default function Settings({ user, onBack, onNavigate, accent, onAccentChange }) {
  const [reminderHour, setReminderHour] = useState(null)
  const [reminderOn, setReminderOn] = useState(false)
  const [reviewHour, setReviewHour] = useState(19)
  const [reminderTimezone, setReminderTimezone] = useState('Europe/Moscow')
  const [quietHoursOn, setQuietHoursOn] = useState(false)
  const [quietStart, setQuietStart] = useState(22)
  const [quietEnd, setQuietEnd] = useState(8)
  const [writingGoalOn, setWritingGoalOn] = useState(false)
  const [writingGoalCount, setWritingGoalCount] = useState(3)
  const [writingGoalProgress, setWritingGoalProgress] = useState(null)
  const [writingGoalProgressError, setWritingGoalProgressError] = useState('')
  const [insightsEnabled, setInsightsEnabled] = useState(true)
  const [insightsSaving, setInsightsSaving] = useState(false)
  const [insightsStatus, setInsightsStatus] = useState('')
  const [reminderStatus, setReminderStatus] = useState('')
  const [exportStatus, setExportStatus] = useState('')
  const [exporting, setExporting] = useState(false)
  const [erasingAccount, setErasingAccount] = useState(false)
  const [accountErased, setAccountErased] = useState(false)
  const [accountEraseError, setAccountEraseError] = useState('')
  const privacyProtectedByTelegram = platformName === 'telegram' && Number(user?.id) > 0

  useEffect(() => {
    if (!user) return
    api.profile
      .getSettings(user.id)
      .then(s => {
        setReminderHour(s?.reminder_hour ?? 19)
        setReminderOn(!!s?.reminder_enabled)
        setReviewHour(s?.review_hour ?? 19)
        setReminderTimezone(s?.reminder_timezone ?? 'Europe/Moscow')
        setQuietHoursOn(s?.quiet_hours_start !== null && s?.quiet_hours_start !== undefined)
        setQuietStart(s?.quiet_hours_start ?? 22)
        setQuietEnd(s?.quiet_hours_end ?? 8)
        setWritingGoalOn(!!s?.writing_goal_enabled)
        setWritingGoalCount(s?.writing_goal_weekly_count || 3)
        setInsightsEnabled(s?.insights_enabled !== false)
      })
      .catch(() => {
        setReminderHour(19)
      })
  }, [user])

  const loadWritingGoalProgress = useCallback(async () => {
    if (!user) return
    setWritingGoalProgressError('')
    try {
      setWritingGoalProgress(await api.profile.writingGoalProgress(user.id))
    } catch {
      setWritingGoalProgress(null)
      setWritingGoalProgressError('Не удалось загрузить прогресс цели. Сама цель не изменилась.')
    }
  }, [user])

  useEffect(() => {
    if (!user) return
    const timeoutId = window.setTimeout(() => {
      void loadWritingGoalProgress()
    }, 0)
    return () => window.clearTimeout(timeoutId)
  }, [user, loadWritingGoalProgress])

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

  async function saveQuietHours(
    nextEnabled = quietHoursOn,
    nextStart = quietStart,
    nextEnd = quietEnd
  ) {
    setQuietHoursOn(nextEnabled)
    try {
      await api.profile.saveSettings(user.id, {
        quiet_hours_enabled: nextEnabled,
        quiet_hours_start: nextStart,
        quiet_hours_end: nextEnd,
      })
    } catch {
      setReminderStatus('Не удалось сохранить тихие часы.')
    }
  }

  async function saveTimezone(nextTimezone) {
    const previous = reminderTimezone
    setReminderTimezone(nextTimezone)
    try {
      await api.profile.saveSettings(user.id, { reminder_timezone: nextTimezone })
    } catch {
      setReminderTimezone(previous)
      setReminderStatus('Не удалось изменить часовой пояс.')
    }
  }

  async function saveWritingGoal(nextEnabled = writingGoalOn, nextCount = writingGoalCount) {
    setWritingGoalOn(nextEnabled)
    setWritingGoalCount(nextCount)
    try {
      await api.profile.saveSettings(user.id, {
        writing_goal_enabled: nextEnabled,
        writing_goal_weekly_count: nextCount,
      })
      await loadWritingGoalProgress()
    } catch {
      setReminderStatus('Не удалось сохранить цель записи.')
    }
  }

  async function saveInsightsVisibility(nextEnabled) {
    if (insightsSaving) return
    const previous = insightsEnabled
    setInsightsEnabled(nextEnabled)
    setInsightsSaving(true)
    setInsightsStatus('')
    try {
      const settings = await api.profile.saveSettings(user.id, { insights_enabled: nextEnabled })
      setInsightsEnabled(settings?.insights_enabled !== false)
      setInsightsStatus(
        nextEnabled
          ? 'Описательные наблюдения снова показываются. Данные не изменялись.'
          : 'Описательные наблюдения скрыты. Сохранённые данные и обычные цифры не удалены.'
      )
    } catch {
      setInsightsEnabled(previous)
      setInsightsStatus(
        'Не удалось изменить видимость наблюдений. Настройка возвращена без изменений.'
      )
    } finally {
      setInsightsSaving(false)
    }
  }

  async function snoozeReminders() {
    try {
      const result = await api.profile.snoozeReminders(user.id, 2)
      setReminderStatus(
        `Напоминания отложены до ${new Date(result.reminder_snoozed_until).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}.`
      )
    } catch {
      setReminderStatus('Не удалось отложить напоминания.')
    }
  }

  async function downloadPersonalExport(format) {
    if (
      exporting ||
      !window.confirm(
        'Скачать копию личных данных на это устройство? Файл не будет отправлен третьей стороне.'
      )
    )
      return
    setExporting(true)
    setExportStatus('')
    try {
      await api.privacy.downloadExport(user.id, { format })
      setExportStatus('Файл подготовлен для скачивания на этом устройстве.')
    } catch {
      setExportStatus('Не удалось подготовить файл. Проверь соединение и попробуй ещё раз.')
    } finally {
      setExporting(false)
    }
  }

  function clearLocalDraft() {
    if (
      !window.confirm(
        'Очистить незавершённую утреннюю запись только на этом устройстве? Сохранённые записи не изменятся.'
      )
    )
      return
    const cleared = clearCheckinDraft({ userId: user.id })
    setExportStatus(
      cleared
        ? 'Локальный черновик очищен. Сохранённые записи не затронуты.'
        : 'Не удалось очистить локальный черновик.'
    )
  }

  async function eraseAccountAndData() {
    if (!privacyProtectedByTelegram || erasingAccount) return
    const firstConfirmation = window.confirm(
      'Удалить аккаунт Mentalix и все связанные данные? Будут удалены journal-записи, теги, цели, привычки, шаблоны, история AI и настройки. Отменить это нельзя.'
    )
    if (!firstConfirmation) return
    const finalConfirmation = window.confirm(
      'Это последнее подтверждение. Удалить все данные сейчас?'
    )
    if (!finalConfirmation) return

    setErasingAccount(true)
    setAccountEraseError('')
    try {
      await api.privacy.eraseAccount(user.id)
      clearCheckinDraft({ userId: user.id })
      platform.clearUser?.()
      setAccountErased(true)
    } catch {
      setAccountEraseError(
        'Не удалось удалить данные. Ничего не было подтверждено как удалённое — проверь соединение и попробуй ещё раз.'
      )
    } finally {
      setErasingAccount(false)
    }
  }

  async function clearAllReminderSettings() {
    if (
      !window.confirm(
        'Отключить напоминания и удалить их тихие часы, snooze и цель записей? Journal и другие настройки не изменятся.'
      )
    )
      return
    try {
      const settings = await api.profile.clearReminderSettings(user.id)
      setReminderOn(Boolean(settings?.reminder_enabled))
      setQuietHoursOn(false)
      setWritingGoalOn(false)
      setWritingGoalCount(0)
      setReminderStatus('Напоминания и связанные настройки отключены.')
    } catch {
      setReminderStatus('Не удалось отключить напоминания. Ничего не менялось.')
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

  // ── Быстрый mood-check при запуске: см. src/lib/moodCheckDraft.js.
  const [moodCheckEnabledFlag, setMoodCheckEnabledFlag] = useSynced(MOOD_CHECK_ENABLED_KEY, '0')
  const moodCheckOn = moodCheckEnabledFlag === '1'

  function setMoodCheckOn(next) {
    setMoodCheckEnabledFlag(next ? '1' : '0')
  }

  // ── Видимость карточек «Сегодня»: см. src/lib/todayCardVisibility.js.
  const [hiddenCardsRaw, setHiddenCardsRaw] = useSynced(TODAY_CARDS_HIDDEN_KEY, '[]')
  const hiddenCards = parseHiddenCards(hiddenCardsRaw)

  function toggleTodayCard(id) {
    const next = hiddenCards.includes(id)
      ? hiddenCards.filter(cardId => cardId !== id)
      : [...hiddenCards, id]

    setHiddenCardsRaw(JSON.stringify(next))
  }

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

  const [screen, setScreen] = useState(null) // null | 'quotes' | 'subscription' | 'donate' | 'link-web' | 'privacy-notice' | 'app-lock-setup'
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

  if (screen === 'privacy-notice') {
    return <PrivacyNotice onBack={() => setScreen(null)} />
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

  if (accountErased) {
    return (
      <div className="w-full max-w-md px-5 pt-12 text-center">
        <div className="rounded-3xl bg-emerald p-6">
          <h1 className="font-display text-[26px] text-cream">данные удалены.</h1>
          <p className="mt-3 text-[14px] leading-relaxed text-muted">
            Мы получили подтверждение удаления аккаунта Mentalix и связанных серверных данных.
            Локальный незавершённый check-in на этом устройстве также очищен.
          </p>
          <p className="mt-3 text-[12px] leading-relaxed text-faint">
            В Telegram закрой мини-приложение. Если захочешь начать с чистого листа, сначала отправь
            боту команду /start, а затем открой приложение снова.
          </p>
          <button
            type="button"
            onClick={() => platform.close?.()}
            className="mt-6 min-h-11 rounded-full bg-gold px-5 text-[13px] font-semibold text-emerald-deep"
          >
            Закрыть приложение
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full max-w-md px-5 flex flex-col items-center">
      <div className="w-full grid grid-cols-[1fr_auto_1fr] items-center min-h-[42px] mb-6">
        <div className="justify-self-start">
          <BackButton
            onClick={onBack}
            className="max-[359px]:w-10 max-[359px]:justify-center max-[359px]:gap-0 max-[359px]:px-0 max-[359px]:[&>span]:hidden"
          />
        </div>
        <h1 className="font-display text-[18px] text-cream lowercase">настройки.</h1>
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
                'flex-1 py-3 rounded-2xl text-[12px] font-bold border-0 transition-colors',
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

      {reminderOn && (
        <div className="mb-8 w-full space-y-3 rounded-3xl bg-emerald p-4">
          <label className="block text-[12px] text-muted">
            Часовой пояс
            <select
              value={reminderTimezone}
              onChange={event => saveTimezone(event.target.value)}
              className="mt-2 min-h-11 w-full rounded-2xl bg-emerald-light px-3 text-[14px] text-cream"
            >
              {TIMEZONES.map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[14px] font-semibold text-cream">Тихие часы</p>
              <p className="mt-1 text-[12px] text-muted">В это время бот не пишет.</p>
            </div>
            <Toggle checked={quietHoursOn} label="Тихие часы" onChange={saveQuietHours} />
          </div>
          {quietHoursOn && (
            <div className="grid grid-cols-2 gap-2">
              <label className="text-[12px] text-muted">
                С
                <select
                  value={quietStart}
                  onChange={event => {
                    const value = Number(event.target.value)
                    setQuietStart(value)
                    saveQuietHours(true, value, quietEnd)
                  }}
                  className="mt-1 min-h-10 w-full rounded-xl bg-emerald-light px-2 text-cream"
                >
                  {Array.from({ length: 24 }, (_, h) => (
                    <option key={h} value={h}>
                      {String(h).padStart(2, '0')}:00
                    </option>
                  ))}
                </select>
              </label>
              <label className="text-[12px] text-muted">
                До
                <select
                  value={quietEnd}
                  onChange={event => {
                    const value = Number(event.target.value)
                    setQuietEnd(value)
                    saveQuietHours(true, quietStart, value)
                  }}
                  className="mt-1 min-h-10 w-full rounded-xl bg-emerald-light px-2 text-cream"
                >
                  {Array.from({ length: 24 }, (_, h) => (
                    <option key={h} value={h}>
                      {String(h).padStart(2, '0')}:00
                    </option>
                  ))}
                </select>
              </label>
            </div>
          )}
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={snoozeReminders}
              className="min-h-11 rounded-full border border-cream/15 px-4 text-[13px] font-semibold text-cream"
            >
              Отложить на 2 часа
            </button>
            <button
              type="button"
              onClick={clearAllReminderSettings}
              className="min-h-11 rounded-full px-4 text-[13px] font-semibold text-red-300"
            >
              Отключить и очистить
            </button>
          </div>
        </div>
      )}

      <SectionLabel>Цель письма</SectionLabel>
      <Card>
        <Row
          icon={Heart}
          title="Записей в неделю"
          subtitle={
            writingGoalOn ? `${writingGoalCount} в неделю — без штрафов за пропуск` : 'Выключено'
          }
          right={
            <Toggle
              checked={writingGoalOn}
              label="Цель записей в неделю"
              onChange={saveWritingGoal}
            />
          }
          divider={false}
        />
      </Card>
      {writingGoalOn && (
        <div className="mb-8 flex gap-2 w-full">
          {[1, 3, 5, 7].map(count => (
            <button
              type="button"
              key={count}
              onClick={() => saveWritingGoal(true, count)}
              className={[
                'flex-1 min-h-11 rounded-2xl text-[13px] font-bold',
                writingGoalCount === count
                  ? 'bg-gold text-emerald-deep'
                  : 'bg-cream/[0.04] text-muted',
              ].join(' ')}
            >
              {count}
            </button>
          ))}
        </div>
      )}
      {writingGoalOn && (
        <div className="-mt-5 mb-8 w-full rounded-2xl border border-gold/15 bg-gold/5 px-4 py-3.5">
          {writingGoalProgress?.enabled ? (
            <>
              <div className="flex items-baseline justify-between gap-3">
                <p className="text-[13px] font-semibold text-cream">
                  Эта неделя: {writingGoalProgress.completed} из {writingGoalProgress.goal}
                </p>
                <span className="shrink-0 text-[11px] font-semibold text-gold">
                  {writingGoalProgress.reached
                    ? 'Цель достигнута'
                    : `Осталось ${writingGoalProgress.remaining}`}
                </span>
              </div>
              <div
                className="mt-3 h-2 overflow-hidden rounded-full bg-emerald-light"
                aria-label={`Прогресс цели письма: ${writingGoalProgress.completed} из ${writingGoalProgress.goal}`}
              >
                <div
                  className="h-full rounded-full bg-gold transition-[width] duration-500"
                  style={{
                    width: `${Math.min(100, Math.round((writingGoalProgress.completed / writingGoalProgress.goal) * 100))}%`,
                  }}
                />
              </div>
              <p className="mt-3 text-[12px] leading-relaxed text-muted">
                {writingGoalProgress.reached
                  ? 'Цель на эту неделю уже выполнена. Можно писать дальше только если тебе хочется.'
                  : 'Это мягкий ориентир, не серия и не оценка: пропущенные дни не считаются против тебя.'}
              </p>
            </>
          ) : (
            <p className="text-[12px] leading-relaxed text-muted">
              Прогресс появится, когда цель будет включена и выбрано число записей в неделю.
            </p>
          )}
          {writingGoalProgressError && (
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <p role="status" className="text-[12px] leading-relaxed text-muted">
                {writingGoalProgressError}
              </p>
              <button
                type="button"
                onClick={loadWritingGoalProgress}
                className="min-h-9 rounded-full border border-cream/15 px-3 text-[12px] font-semibold text-gold"
              >
                Повторить
              </button>
            </div>
          )}
        </div>
      )}
      {reminderStatus && (
        <p role="status" className="mb-5 w-full text-[12px] text-muted">
          {reminderStatus}
        </p>
      )}

      <SectionLabel>Наблюдения</SectionLabel>
      <Card>
        <Row
          icon={Heart}
          title="Показывать описательные наблюдения"
          subtitle={
            insightsEnabled
              ? 'Основаны на сохранённых отметках; не являются диагнозом'
              : 'Скрыты; данные и обычные цифры остаются доступными'
          }
          right={
            <Toggle
              checked={insightsEnabled}
              label="Показывать описательные наблюдения"
              onChange={saveInsightsVisibility}
            />
          }
          divider={false}
        />
      </Card>
      {insightsStatus && (
        <p role="status" className="-mt-5 mb-5 w-full text-[12px] leading-relaxed text-muted">
          {insightsSaving ? 'Сохраняем настройку…' : insightsStatus}
        </p>
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
              'flex-1 py-3 rounded-2xl text-[12px] font-bold border-0 transition-colors',
              reviewHour === h ? 'bg-gold text-emerald-deep' : 'bg-cream/[0.04] text-muted',
            ].join(' ')}
          >
            {String(h).padStart(2, '0')}
          </button>
        ))}
      </div>

      {/* MXL-MOOD-CHECK-001 — opt-in: дефолт '0', см.
          src/lib/moodCheckDraft.js. Не пишет в бэкенд — только черновик
          для CheckIn.jsx при следующем открытии. */}
      <SectionLabel>Быстрый mood-check</SectionLabel>
      <Card>
        <Row
          icon={Heart}
          title="Спрашивать настроение при запуске"
          subtitle="Один тап поверх приложения, отдельно от полного чек-ина"
          right={
            <Toggle
              checked={moodCheckOn}
              label="Быстрый mood-check при запуске"
              onChange={setMoodCheckOn}
            />
          }
          divider={false}
        />
      </Card>

      <SectionLabel>Карточки «Сегодня»</SectionLabel>
      <Card>
        {TODAY_CARD_IDS.map((id, index) => (
          <Row
            key={id}
            title={TODAY_CARD_LABELS[id].title}
            subtitle={TODAY_CARD_LABELS[id].subtitle}
            right={
              <Toggle
                checked={!hiddenCards.includes(id)}
                label={TODAY_CARD_LABELS[id].title}
                onChange={() => toggleTodayCard(id)}
              />
            }
            divider={index < TODAY_CARD_IDS.length - 1}
          />
        ))}
      </Card>

      {/* Акцентный цвет: состояние живёт в App.jsx (MXL-THEME-ACCENT-001) —
          см. комментарий у useSynced(ACCENT_COLOR_KEY, ...) там. */}
      <SectionLabel>Внешний вид</SectionLabel>
      <Card>
        <Row
          title="Акцентный цвет"
          subtitle={ACCENT_COLORS[accent].label}
          divider={false}
          right={
            <div className="flex gap-2">
              {Object.entries(ACCENT_COLORS).map(([id, { label, hex }]) => (
                <button
                  key={id}
                  type="button"
                  aria-label={label}
                  aria-pressed={accent === id}
                  onClick={() => onAccentChange(id)}
                  className={`w-8 h-8 rounded-full shrink-0 transition-transform ${
                    accent === id ? 'ring-2 ring-cream ring-offset-2 ring-offset-emerald-deep' : ''
                  }`}
                  style={{ background: hex }}
                />
              ))}
            </div>
          }
        />
      </Card>

      <SectionLabel>Личные данные</SectionLabel>
      <Card>
        {privacyProtectedByTelegram ? (
          <>
            <Row
              icon={ShieldCheck}
              title="Политика и данные"
              subtitle="Хранение, local draft, синхронизация и ограничения"
              onClick={() => setScreen('privacy-notice')}
            />
            <Row
              icon={Download}
              title="Экспорт JSON"
              subtitle="Сохранённые данные и завершённые направленные записи"
              onClick={() => downloadPersonalExport('json')}
            />
            <Row
              icon={Download}
              title="Экспорт Markdown"
              subtitle="Записи для чтения или передачи специалисту"
              onClick={() => downloadPersonalExport('markdown')}
            />
            <Row
              icon={Download}
              title="Экспорт CSV"
              subtitle="Табличные метрики и check-in"
              onClick={() => downloadPersonalExport('csv')}
            />
          </>
        ) : (
          <>
            <Row
              icon={ShieldCheck}
              title="Политика и данные"
              subtitle="Хранение, local draft, синхронизация и ограничения"
              onClick={() => setScreen('privacy-notice')}
            />
            <div className="px-4 py-4 text-[13px] leading-relaxed text-muted">
              Экспорт и серверное удаление доступны только в Telegram Mini App с проверенной
              подписью. В web-версии нет серверной сессии, поэтому мы не выполняем чувствительные
              операции по переданному id.
            </div>
          </>
        )}
        <Row
          icon={Lock}
          title="Очистить local draft"
          subtitle="Только незавершённый текст на этом устройстве"
          onClick={clearLocalDraft}
          danger
          divider={!privacyProtectedByTelegram}
        />
        {privacyProtectedByTelegram && (
          <Row
            icon={Lock}
            title={erasingAccount ? 'Удаляем данные…' : 'Удалить аккаунт и данные'}
            subtitle="Необратимо; потребуется два подтверждения"
            onClick={eraseAccountAndData}
            danger
            divider={false}
          />
        )}
      </Card>
      {exportStatus && (
        <p role="status" className="-mt-5 mb-5 w-full text-[12px] text-muted">
          {exportStatus}
        </p>
      )}
      {accountEraseError && (
        <p role="alert" className="-mt-5 mb-5 w-full text-[12px] text-red-300">
          {accountEraseError}
        </p>
      )}
      <p className="-mt-3 mb-8 w-full px-1 text-[12px] leading-relaxed text-faint">
        Незавершённый draft остаётся только на текущем устройстве и не является cloud backup.
        Блокировка приложения — локальный экранный барьер, а не шифрование данных. Подробности о
        хранении и ограничениях синхронизации — в разделе «Политика и данные».
      </p>

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
          <span className="flex-1 font-body text-[14px] text-cream">Текущая версия</span>
          <span className="text-muted text-[13px] font-body">v1.0.0</span>
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
