// src/screens/Settings.jsx
//
// Профиль и настройки Mentalix по эталону Stoic (DESIGN_SYSTEM.md §5.4).
// Корень «твой профиль.»: НАСТРОЙ (чек-ины, о тебе, настройки, оформление) →
// АККАУНТ (уведомления, твои данные, подписка) → ПОМОЩЬ → ПРИЛОЖЕНИЕ → версия.
// Каждый пункт открывает под-экран с существующими настройками.

import { useCallback, useEffect, useState } from 'react'
import { version as appVersion } from '../../package.json'
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
import { getAccentColors } from '../lib/accentColor'
import { THEMES } from '../lib/theme'
import QuotesManager from './QuotesManager'
import SubscriptionManager from './SubscriptionManager'
import DonateScreen from './DonateScreen'
import LinkWebAccount from './LinkWebAccount'
import AppLock from './AppLock'
import PrivacyNotice from './PrivacyNotice'
import WillingnessToPayTest from './WillingnessToPayTest'
import Profile from './Profile'
import { ProfileBanners } from './settings/ProfileBanners'
import {
  ProfileBody,
  ProfileCard,
  ProfileChips,
  ProfileGroup,
  ProfileNote,
  ProfilePage,
  ProfileRow,
  ProfileVersion,
} from './settings/ProfileUi'

// iOS-переключатель, §5.4: включённый — белый.
function Toggle({ checked, label, onChange }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className="mx-profile-switch"
    />
  )
}

const hh = hour => `${String(hour).padStart(2, '0')}:00`

const SUB_TITLES = {
  checkins: 'чек-ины.',
  about: 'о тебе.',
  prefs: 'настройки.',
  appearance: 'оформление.',
  notifications: 'уведомления.',
  data: 'твои данные.',
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

export default function Settings({
  user,
  onBack,
  onRegisterBack,
  onScrollTop,
  accent,
  onAccentChange,
  theme,
  onThemeChange,
}) {
  const accentColors = getAccentColors(theme)
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
    const previousEnabled = writingGoalOn
    const previousCount = writingGoalCount
    setWritingGoalOn(nextEnabled)
    setWritingGoalCount(nextCount)
    try {
      await api.profile.saveSettings(user.id, {
        writing_goal_enabled: nextEnabled,
        writing_goal_weekly_count: nextCount,
      })
      await loadWritingGoalProgress()
    } catch {
      setWritingGoalOn(previousEnabled)
      setWritingGoalCount(previousCount)
      setReminderStatus('Не удалось сохранить цель записи. Настройка возвращена без изменений.')
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
      'Удалить аккаунт Mentalix и все связанные данные? Будут удалены записи дневника, теги, цели, привычки, шаблоны, история разговоров с ИИ и настройки. Отменить это нельзя.'
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
        'Отключить напоминания и удалить их тихие часы, откладывание и цель записей? Дневник и другие настройки не изменятся.'
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

  const [screen, setScreen] = useState(null) // null | 'quotes' | 'subscription' | 'donate' | 'link-web' | 'privacy-notice' | 'app-lock-setup' | 'wtp-test'
  // null — тариф ещё не загружен: «подписка.» показывает скелетон.
  const [tier, setTier] = useState(null)
  // Под-экран профиля: null — корень «твой профиль.».
  const [sub, setSub] = useState(null) // null | 'checkins' | 'about' | 'prefs' | 'appearance' | 'notifications' | 'data'

  function openSub(next) {
    setSub(next)
    onScrollTop?.()
  }

  // Demo Preview: «Назад» демо-шапки Telegram ведёт на шаг назад внутри профиля.
  useEffect(() => {
    if (!onRegisterBack) return undefined
    onRegisterBack(screen ? () => setScreen(null) : sub ? () => openSub(null) : null)
    return () => onRegisterBack(null)
    // openSub стабилен по смыслу: меняет только sub и скролл.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [screen, sub, onRegisterBack])

  useEffect(() => {
    if (!user) return
    api.subscription
      .get(user.id)
      .then(s => setTier(s.tier))
      .catch(error => {
        console.error(error)
        // Как и раньше: без ответа сервера показываем базовый тариф.
        setTier(current => current ?? 'base')
      })
  }, [user, screen])

  if (screen === 'quotes') {
    return <QuotesManager user={user} onBack={() => setScreen(null)} />
  }

  if (screen === 'subscription') {
    return <SubscriptionManager user={user} tier={tier} onBack={() => setScreen(null)} />
  }

  if (screen === 'donate') {
    return <DonateScreen onBack={() => setScreen(null)} />
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

  if (screen === 'wtp-test') {
    return <WillingnessToPayTest user={user} onBack={() => setScreen(null)} />
  }

  const tierLabel = tier == null ? null : tier === 'pro' ? 'Про' : 'Базовый'

  /*
   * Баннер «Mentalix на сайте» (§5.4): скрыт, если аккаунт уже связан
   * (user.linked). В веб-версии без входа ведёт на вход, иначе — в
   * существующий сценарий «Связать с сайтом».
   */
  const showWebBanner = !user?.linked
  function openWebBanner() {
    if (platformName === 'web' && !user) {
      platform.clearUser?.()
      window.location.reload()
      return
    }
    setScreen('link-web')
  }

  if (accountErased) {
    return (
      <div className="w-full max-w-md px-[var(--mx-screen-x)] pt-12 text-center">
        <div className="rounded-3xl bg-emerald p-6">
          <h1 className="font-display text-[26px] text-cream">данные удалены.</h1>
          <p className="mt-3 text-[14px] leading-relaxed text-muted">
            Мы получили подтверждение удаления аккаунта Mentalix и связанных серверных данных.
            Локальный незавершённый чек-ин на этом устройстве также очищен.
          </p>
          <p className="mt-3 text-[12px] leading-relaxed text-muted">
            В Telegram закрой мини-приложение. Если захочешь начать с чистого листа, сначала отправь
            боту команду /start, а затем открой приложение снова.
          </p>
          <button
            type="button"
            onClick={() => platform.close?.()}
            className="mt-6 min-h-11 rounded-full bg-gold px-[var(--mx-screen-x)] text-[13px] font-semibold text-emerald-deep"
          >
            Закрыть приложение
          </button>
        </div>
      </div>
    )
  }

  function renderCheckins() {
    return (
      <ProfileBody>
        <ProfileGroup label="Разбор дня">
          <ProfileCard>
            <ProfileRow
              title="Когда показывать разбор"
              subtitle="«Сегодня» сам предложит подвести итоги"
              value={hh(reviewHour)}
            />
            <div className="mx-profile-inset">
              <ProfileChips
                label="Время разбора"
                value={reviewHour}
                onChange={saveReviewHour}
                options={REVIEW_HOURS.map(h => ({ value: h, label: String(h).padStart(2, '0') }))}
              />
            </div>
          </ProfileCard>
        </ProfileGroup>

        {/* MXL-MOOD-CHECK-001 — opt-in: дефолт '0', см.
            src/lib/moodCheckDraft.js. Не пишет в бэкенд — только черновик
            для CheckIn.jsx при следующем открытии. */}
        <ProfileGroup label="Быстрая отметка настроения">
          <ProfileCard>
            <ProfileRow
              title="Спрашивать настроение при запуске"
              subtitle="Один тап поверх приложения, отдельно от полного чек-ина"
              right={
                <Toggle
                  checked={moodCheckOn}
                  label="Быстрая отметка настроения при запуске"
                  onChange={setMoodCheckOn}
                />
              }
            />
          </ProfileCard>
        </ProfileGroup>

        <ProfileGroup label="Цель письма">
          <ProfileCard>
            <ProfileRow
              title="Записей в неделю"
              subtitle={
                writingGoalOn
                  ? `${writingGoalCount} в неделю — без штрафов за пропуск`
                  : 'Выключено'
              }
              right={
                <Toggle
                  checked={writingGoalOn}
                  label="Цель записей в неделю"
                  onChange={saveWritingGoal}
                />
              }
            />
            {writingGoalOn && (
              <div className="mx-profile-inset">
                <ProfileChips
                  label="Записей в неделю"
                  value={writingGoalCount}
                  onChange={count => saveWritingGoal(true, count)}
                  options={[1, 3, 5, 7].map(count => ({ value: count, label: String(count) }))}
                />
              </div>
            )}
          </ProfileCard>
          {writingGoalOn && (
            <div className="mx-profile-panel" style={{ marginTop: 8 }}>
              {writingGoalProgress?.enabled ? (
                <div>
                  <div className="flex items-baseline justify-between gap-3">
                    <p className="text-[15px] font-semibold text-cream">
                      Эта неделя: {writingGoalProgress.completed} из {writingGoalProgress.goal}
                    </p>
                    <span className="shrink-0 text-[13px] font-semibold text-cream">
                      {writingGoalProgress.reached
                        ? 'Цель достигнута'
                        : `Осталось ${writingGoalProgress.remaining}`}
                    </span>
                  </div>
                  <div
                    className="mx-profile-progress"
                    aria-label={`Прогресс цели письма: ${writingGoalProgress.completed} из ${writingGoalProgress.goal}`}
                  >
                    <div
                      style={{
                        width: `${Math.min(100, Math.round((writingGoalProgress.completed / writingGoalProgress.goal) * 100))}%`,
                      }}
                    />
                  </div>
                  <p className="mt-3 text-[13px] leading-relaxed text-muted">
                    {writingGoalProgress.reached
                      ? 'Цель на эту неделю уже выполнена. Можно писать дальше только если тебе хочется.'
                      : 'Это мягкий ориентир, не серия и не оценка: пропущенные дни не считаются против тебя.'}
                  </p>
                </div>
              ) : (
                <p className="text-[13px] leading-relaxed text-muted">
                  Прогресс появится, когда цель будет включена и выбрано число записей в неделю.
                </p>
              )}
              {writingGoalProgressError && (
                <div className="flex flex-wrap items-center gap-3">
                  <p role="status" className="text-[13px] leading-relaxed text-muted">
                    {writingGoalProgressError}
                  </p>
                  <button
                    type="button"
                    onClick={loadWritingGoalProgress}
                    className="mx-profile-text-button"
                  >
                    Повторить
                  </button>
                </div>
              )}
            </div>
          )}
          {reminderStatus && <ProfileNote role="status">{reminderStatus}</ProfileNote>}
        </ProfileGroup>
      </ProfileBody>
    )
  }

  function renderPrefs() {
    return (
      <ProfileBody>
        <ProfileGroup label="Наблюдения">
          <ProfileCard>
            <ProfileRow
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
            />
          </ProfileCard>
          {insightsStatus && (
            <ProfileNote role="status">
              {insightsSaving ? 'Сохраняем настройку…' : insightsStatus}
            </ProfileNote>
          )}
        </ProfileGroup>

        <ProfileGroup label="Карточки «Сегодня»">
          <ProfileCard>
            {TODAY_CARD_IDS.map(id => (
              <ProfileRow
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
              />
            ))}
          </ProfileCard>
        </ProfileGroup>

        <ProfileGroup label="Основные">
          <ProfileCard>
            <ProfileRow
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
            />
            <ProfileRow title="Связать с сайтом" onClick={() => setScreen('link-web')} />
            <ProfileRow
              title="Пройти знакомство заново"
              onClick={async () => {
                /*
                 * Стираем отметку и локально, и в облаке. Иначе после
                 * перезагрузки облако вернёт её обратно, и знакомство
                 * не начнётся — кнопка будет молча не работать.
                 */
                await forget('mx-onboarded-v2')

                window.location.reload()
              }}
            />
          </ProfileCard>
        </ProfileGroup>
      </ProfileBody>
    )
  }

  function renderAppearance() {
    // Акцентный цвет: состояние живёт в App.jsx (MXL-THEME-ACCENT-001).
    return (
      <ProfileBody>
        <ProfileGroup label="Тема">
          <ProfileCard>
            <div className="mx-profile-inset">
              <ProfileChips
                label="Тема приложения"
                value={theme}
                onChange={onThemeChange}
                options={Object.entries(THEMES).map(([id, { label }]) => ({ value: id, label }))}
              />
            </div>
          </ProfileCard>
        </ProfileGroup>
        <ProfileGroup label="Акцентный цвет">
          <ProfileCard>
            <ProfileRow
              title={accentColors[accent].label}
              right={
                <div className="flex gap-1">
                  {Object.entries(accentColors).map(([id, { label, hex }]) => (
                    <button
                      key={id}
                      type="button"
                      aria-label={label}
                      aria-pressed={accent === id}
                      onClick={() => onAccentChange(id)}
                      className="mx-profile-swatch"
                    >
                      <span aria-hidden="true" style={{ background: hex }} />
                    </button>
                  ))}
                </div>
              }
            />
          </ProfileCard>
        </ProfileGroup>
      </ProfileBody>
    )
  }

  function renderNotifications() {
    return (
      <ProfileBody>
        <ProfileGroup label="Бот">
          <ProfileCard>
            <ProfileRow
              title="Напоминание от бота"
              subtitle={reminderOn ? `Каждый день в ${hh(reminderHour)}` : 'Выключено'}
              right={
                <Toggle
                  checked={reminderOn}
                  label="Напоминание от бота"
                  onChange={() => saveReminder(reminderHour ?? 19, !reminderOn)}
                />
              }
            />
            {reminderOn && (
              <div className="mx-profile-inset">
                <ProfileChips
                  label="Время напоминания"
                  value={reminderHour}
                  onChange={hour => saveReminder(hour, true)}
                  options={REMINDER_TIMES.map(t => ({
                    value: t.hour,
                    label: t.label,
                    hint: hh(t.hour),
                  }))}
                />
              </div>
            )}
          </ProfileCard>
          {reminderOn && (
            <div className="mx-profile-panel" style={{ marginTop: 8 }}>
              <label className="mx-profile-label">
                Часовой пояс
                <select
                  value={reminderTimezone}
                  onChange={event => saveTimezone(event.target.value)}
                  className="mx-profile-select"
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
                  <p className="text-[15px] font-semibold text-cream">Тихие часы</p>
                  <p className="mt-1 text-[13px] text-muted">В это время бот не пишет.</p>
                </div>
                <Toggle checked={quietHoursOn} label="Тихие часы" onChange={saveQuietHours} />
              </div>
              {quietHoursOn && (
                <div className="grid grid-cols-2 gap-2">
                  <label className="mx-profile-label">
                    С
                    <select
                      value={quietStart}
                      onChange={event => {
                        const value = Number(event.target.value)
                        setQuietStart(value)
                        saveQuietHours(true, value, quietEnd)
                      }}
                      className="mx-profile-select"
                    >
                      {Array.from({ length: 24 }, (_, h) => (
                        <option key={h} value={h}>
                          {hh(h)}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="mx-profile-label">
                    До
                    <select
                      value={quietEnd}
                      onChange={event => {
                        const value = Number(event.target.value)
                        setQuietEnd(value)
                        saveQuietHours(true, quietStart, value)
                      }}
                      className="mx-profile-select"
                    >
                      {Array.from({ length: 24 }, (_, h) => (
                        <option key={h} value={h}>
                          {hh(h)}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
              )}
              <div className="flex flex-wrap gap-2">
                <button type="button" onClick={snoozeReminders} className="mx-profile-text-button">
                  Отложить на 2 часа
                </button>
                <button
                  type="button"
                  onClick={clearAllReminderSettings}
                  className="mx-profile-text-button mx-profile-text-button--danger"
                >
                  Отключить и очистить
                </button>
              </div>
            </div>
          )}
          {reminderStatus && <ProfileNote role="status">{reminderStatus}</ProfileNote>}
        </ProfileGroup>
        <ProfileGroup label="Сообщения">
          <ProfileCard>
            <ProfileRow title="Мысль дня" value="Мои фразы" onClick={() => setScreen('quotes')} />
          </ProfileCard>
        </ProfileGroup>
      </ProfileBody>
    )
  }

  function renderData() {
    return (
      <ProfileBody>
        <ProfileGroup label="Личные данные">
          <ProfileCard>
            {privacyProtectedByTelegram ? (
              <>
                <ProfileRow
                  title="Политика и данные"
                  subtitle="Хранение, черновики, синхронизация и ограничения"
                  onClick={() => setScreen('privacy-notice')}
                />
                <ProfileRow
                  title="Экспорт JSON"
                  subtitle="Сохранённые данные и завершённые направленные записи"
                  onClick={() => downloadPersonalExport('json')}
                />
                <ProfileRow
                  title="Экспорт Markdown"
                  subtitle="Записи для чтения или передачи специалисту"
                  onClick={() => downloadPersonalExport('markdown')}
                />
                <ProfileRow
                  title="Экспорт CSV"
                  subtitle="Табличные метрики и чек-ин"
                  onClick={() => downloadPersonalExport('csv')}
                />
              </>
            ) : (
              <>
                <ProfileRow
                  title="Политика и данные"
                  subtitle="Хранение, черновики, синхронизация и ограничения"
                  onClick={() => setScreen('privacy-notice')}
                />
                <div className="mx-profile-inset text-[13px] leading-relaxed text-muted">
                  Экспорт и серверное удаление доступны только в Telegram Mini App с проверенной
                  подписью. В веб-версии нет входа на сервере, поэтому мы не выполняем
                  чувствительные операции по переданному id.
                </div>
              </>
            )}
            <ProfileRow
              title="Очистить черновик"
              subtitle="Только незавершённый текст на этом устройстве"
              onClick={clearLocalDraft}
              danger
            />
            {privacyProtectedByTelegram && (
              <ProfileRow
                title={erasingAccount ? 'Удаляем данные…' : 'Удалить аккаунт и данные'}
                subtitle="Необратимо; потребуется два подтверждения"
                onClick={eraseAccountAndData}
                danger
              />
            )}
          </ProfileCard>
          {exportStatus && <ProfileNote role="status">{exportStatus}</ProfileNote>}
          {accountEraseError && (
            <ProfileNote role="alert" danger>
              {accountEraseError}
            </ProfileNote>
          )}
          <ProfileNote>
            Незавершённый черновик остаётся только на этом устройстве и не является резервной копией
            в облаке. Блокировка приложения — локальный экранный барьер, а не шифрование данных.
            Подробности о хранении и ограничениях синхронизации — в разделе «Политика и данные».
          </ProfileNote>
        </ProfileGroup>
      </ProfileBody>
    )
  }

  const subContent = {
    checkins: renderCheckins,
    about: () => <Profile user={user} />,
    prefs: renderPrefs,
    appearance: renderAppearance,
    notifications: renderNotifications,
    data: renderData,
  }

  if (sub && subContent[sub]) {
    return (
      <ProfilePage
        key={sub}
        title={SUB_TITLES[sub]}
        onBack={() => openSub(null)}
        testId={`profile-sub-${sub}`}
      >
        {subContent[sub]()}
      </ProfilePage>
    )
  }

  return (
    <ProfilePage key="root" title="твой профиль." isRoot onBack={onBack} testId="profile-screen">
      <ProfileBody>
        <ProfileBanners
          showWeb={showWebBanner}
          onOpenSubscription={() => setScreen('subscription')}
          onOpenDonate={() => setScreen('donate')}
          onOpenWeb={openWebBanner}
        />
        <ProfileGroup label="Настрой">
          <ProfileCard testId="profile-card-setup">
            <ProfileRow
              title="Чек-ины"
              value={hh(reviewHour)}
              onClick={() => openSub('checkins')}
              testId="profile-row-checkins"
            />
            <ProfileRow
              title="О тебе"
              value={user?.first_name}
              onClick={() => openSub('about')}
              testId="profile-row-about"
            />
            <ProfileRow
              title="Настройки"
              onClick={() => openSub('prefs')}
              testId="profile-row-prefs"
            />
            <ProfileRow
              title="Оформление"
              value={THEMES[theme]?.label}
              onClick={() => openSub('appearance')}
              testId="profile-row-appearance"
            />
          </ProfileCard>
        </ProfileGroup>

        <ProfileGroup label="Аккаунт">
          <ProfileCard>
            <ProfileRow
              title="Уведомления"
              value={reminderOn ? 'Вкл.' : 'Выкл.'}
              onClick={() => openSub('notifications')}
              testId="profile-row-notifications"
            />
            <ProfileRow
              title="Твои данные"
              onClick={() => openSub('data')}
              testId="profile-row-data"
            />
            <ProfileRow
              title="Подписка"
              value={tierLabel}
              onClick={() => setScreen('subscription')}
            />
          </ProfileCard>
        </ProfileGroup>

        <ProfileGroup label="Помощь">
          <ProfileCard>
            <ProfileRow
              title="Написать в поддержку"
              onClick={() => window.open('https://t.me/mentalix_support_bot', '_blank')}
            />
            <ProfileRow
              title="Что было бы полезно?"
              subtitle="Короткий опрос — без оплаты и подписки"
              onClick={() => setScreen('wtp-test')}
            />
          </ProfileCard>
        </ProfileGroup>

        <ProfileGroup label="Приложение">
          <ProfileCard>
            <ProfileRow title="Конфиденциальность" onClick={() => setScreen('privacy-notice')} />
          </ProfileCard>
        </ProfileGroup>

        <ProfileVersion>Mentalix {appVersion}</ProfileVersion>
      </ProfileBody>
    </ProfilePage>
  )
}
