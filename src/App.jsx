import { lazy, Suspense, useCallback, useEffect, useRef, useState } from 'react'

import { ChevronDown, Ellipsis, X } from 'lucide-react'

import ErrorBoundary from './components/ErrorBoundary'

import { platform, platformName } from './platform'
import { paintChrome, lockVerticalSwipes, useSettingsButton } from './platform/telegram.hooks'

import Today from './screens/Today'

import BookLogo from './components/BookLogo'
import BackButton from './components/BackButton'
import BottomNavigation from './components/BottomNavigation'
import PreviewApiDiagnostic from './components/PreviewApiDiagnostic'
import SessionRestoreError from './components/SessionRestoreError'
import TabSkeleton from './components/TabSkeleton'
import { useSynced } from './lib/store'
import { hasPinRecord, APP_LOCK_ENABLED_KEY } from './lib/appLock'
import { ACCENT_COLOR_KEY, DEFAULT_ACCENT, parseAccent } from './lib/accentColor'
import { DEFAULT_THEME, parseTheme, THEME_KEY } from './lib/theme'
import { api } from './lib/api'
import { claimReturnFlowEvent, returnFlowEvent, returnFlowEventKey, returnFlowOccurredAt } from './lib/returnFlow'
import { parseContextualDeepLink } from './lib/contextualDeepLink'
import { MOOD_CHECK_ENABLED_KEY, shouldOfferMoodCheck } from './lib/moodCheckDraft'
import { MOOD_CHECK_CHECKIN_ERROR, shouldShowMoodCheckGate } from './lib/moodCheckGate'
import {
  DEMO_USER,
  isPreviewDemoMode,
  isRealPhone,
  isDemoGuestMode,
  DEMO_GUEST_USER,
} from './lib/demoMode'
import { installDemoPressFeedback } from './lib/demoPressFeedback'
import { shouldRenderDemoTelegramChrome } from './lib/demoChrome'
import { switchUserDataScope } from './lib/userDataScope'
import { clearTodayDataCache } from './lib/todayDataCache'
import { clearHistoryCache } from './lib/mentalixHistoryCache'
import { clearSeriesSnapshots } from './lib/series'
import { clearTrendsDataCache } from './lib/trendsDataCache'
import { GUEST_MERGED_EVENT, loginAsGuest } from './lib/guestAuth'

import { getFullscreenSnapshot, initFullscreen } from './lib/tgFullscreen'
import { useVisualViewportHeight } from './lib/visualViewport'
import { useGlobalEdgeSwipeBack } from './lib/gestures/useGlobalEdgeSwipeBack'

/* ============================================================
   STORAGE
   ============================================================ */

const ONBOARDED_KEY = 'mx-onboarded-v2'

/* ============================================================
   LAZY SCREENS

   Первый экран (Today) и Splash остаются в стартовом bundle.
   Авторизация, онбординг и блокировка загружаются только когда
   нужны — большинство пользователей их не видит при запуске.
   Остальные вкладки и настройки — при первом переходе.
   ============================================================ */

// Первый экран (Today) и Splash остаются в стартовом bundle.
// Авторизация, онбординг и блокировка загружаются только когда нужны —
// большинство пользователей их не видит при запуске.
const WebAuthScreen = lazy(() => import('./screens/WebAuthScreen'))
const Onboarding = lazy(() => import('./screens/Onboarding'))
const AppLock = lazy(() => import('./screens/AppLock'))

const Practices = lazy(() => import('./screens/Practices'))
const Analytics = lazy(() => import('./screens/Analytics'))
const MentalixChat = lazy(() => import('./screens/Mentalix'))
// Профиль и его под-экраны («подписка.», «поддержать проект.», опрос) лежат
// в одном чанке. Грузим его заранее, когда «Сегодня» уже показан, — иначе
// первый тап по кнопке профиля ждёт загрузку кода.
const loadSettings = () => import('./screens/Settings')
const Settings = lazy(loadSettings)
const Library = lazy(() => import('./screens/Library'))
const History = lazy(() => import('./screens/History'))

// Opt-in (MOOD_CHECK_ENABLED_KEY по умолчанию '0') — большинство никогда
// его не увидит, поэтому вне стартового bundle, в отличие от AppLock.
const MoodCheckGate = lazy(() => import('./screens/MoodCheckGate'))
// Код панели попадает в сеть только после проверки демо и отсутствия Telegram.
const DemoPanel = lazy(() => import('./components/DemoPanel'))

/* ============================================================
   SPLASH
   ============================================================ */

function Splash() {
  return (
    <div
      className="
        min-h-screen
        bg-emerald-deep
        text-cream
        flex
        flex-col
        items-center
        justify-center
        font-body
      "
    >
      <BookLogo size={132} className="text-gold" />

      <div
        className="
          font-display
          text-[15px]
          tracking-[0.4em]
          text-muted
          mt-7
        "
      >
        MENTALIX
      </div>

      <div
        className="
          text-[12px]
          text-faint
          font-semibold
          mt-2
        "
      >
        выход находится шагами
      </div>
    </div>
  )
}

function DemoTelegramChrome({ onBack }) {
  const hasBack = typeof onBack === 'function'
  const requestedTab = new URLSearchParams(window.location.search).get('tab')
  const chromeTab = requestedTab === 'trends' ? 'progress' : requestedTab
  const tabTitle =
    chromeTab === 'progress'
      ? 'Прогресс'
      : chromeTab === 'library'
        ? 'Библиотека'
        : chromeTab === 'practices'
          ? 'Практики'
          : 'MENTALIX'
  const tabMeta = chromeTab === 'progress' ? '14 дней' : ''

  return (
    <div className="mx-demo-telegram-chrome" aria-label="Telegram preview controls">
      <button
        type="button"
        aria-label={hasBack ? 'Назад' : 'Закрыть превью'}
        className="mx-demo-telegram-chrome__close"
        onClick={hasBack ? onBack : undefined}
      >
        {hasBack ? (
          <ChevronDown size={18} strokeWidth={2.2} className="rotate-90" aria-hidden="true" />
        ) : (
          <X size={18} strokeWidth={2.2} aria-hidden="true" />
        )}
        {!hasBack && <span>Закрыть</span>}
      </button>
      {tabTitle && (
        <div
          className={`mx-demo-telegram-chrome__title${
            tabTitle === 'MENTALIX' ? ' mx-demo-telegram-chrome__title--wordmark' : ''
          }`}
        >
          {tabTitle}
        </div>
      )}
      <div className="mx-demo-telegram-chrome__right">
        <div className="mx-demo-telegram-chrome__menu" aria-hidden="true">
          <ChevronDown size={22} strokeWidth={2.2} />
          <Ellipsis size={22} strokeWidth={2.2} />
        </div>
        {tabMeta && <span className="mx-demo-telegram-chrome__meta">{tabMeta}</span>}
      </div>
    </div>
  )
}

function ScreenLoading() {
  return <TabSkeleton />
}

/* ============================================================
   THEME
   ============================================================ */

function getThemeBackground() {
  const channels = getComputedStyle(document.documentElement)
    .getPropertyValue('--c-bg')
    .trim()
    .split(/\s+/)
    .map(Number)

  if (
    channels.length !== 3 ||
    channels.some(channel => !Number.isFinite(channel) || channel < 0 || channel > 255)
  ) {
    return null
  }

  return `#${channels.map(channel => channel.toString(16).padStart(2, '0')).join('')}`
}

const LIGHT_THEME_PREVIEW_PARAM = 'light-preview'

function isLightThemePreviewEnabled() {
  if (typeof window === 'undefined') return false

  const previewBuild = import.meta.env.DEV || import.meta.env.VERCEL_ENV === 'preview'
  const requested = new URLSearchParams(window.location.search).get(LIGHT_THEME_PREVIEW_PARAM)

  return previewBuild && requested === '1'
}

function applyDarkTheme() {
  // Снимаем legacy-класс и при HMR, и после старой открытой сессии.
  document.body.classList.remove('light')

  const background = getThemeBackground()

  if (background) {
    platform.setThemeColors?.(background)

    /*
     * Шапка и нижняя полоса Telegram красятся в цвет
     * приложения: без этого на стыке видна граница из
     * двух разных чёрных.
     */
    paintChrome(background)
  }
}

/* ============================================================
   USER NAME
   ============================================================ */

/* ============================================================
   APP
   ============================================================ */

function App() {
  const [user, setUser] = useState(() => (isPreviewDemoMode() ? DEMO_USER : null))

  // Демо-гостевой режим: ?guest=1 переключает на гостевого пользователя.
  // isDemoGuestMode уже включает проверку isPreviewDemoMode — нового пути
  // включения демо нет.
  useEffect(() => {
    if (isDemoGuestMode()) setUser(DEMO_GUEST_USER)
  }, [])

  const [authChecked, setAuthChecked] = useState(() => isPreviewDemoMode())

  const [authError, setAuthError] = useState(null)
  const [showGuestAuth, setShowGuestAuth] = useState(false)

  const acceptUser = useCallback(nextUser => {
    if (nextUser?.id) {
      const changed = switchUserDataScope(nextUser.id)
      if (changed) {
        clearTodayDataCache()
        clearHistoryCache()
        clearSeriesSnapshots()
        clearTrendsDataCache()
      }
    }
    setUser(nextUser)
  }, [])

  const [overlay, setOverlay] = useState(null)

  const [fullscreen, setFullscreen] = useState(false)

  const [navCollapsed, setNavCollapsed] = useState(false)

  const viewportHeight = useVisualViewportHeight()

  /*
   * Отдельное состояние:
   * открыта ли конкретная AI-персона.
   *
   * false — экран выбора трёх персон,
   *         navbar виден.
   *
   * true  — Собеседник / Наставник /
   *         Следопыт открыт,
   *         navbar полностью скрыт.
   */
  const [mentorPersonaOpen, setMentorPersonaOpen] = useState(false)

  const [todayFlowOpen, setTodayFlowOpen] = useState(false)

  const [todaySeriesOpen, setTodaySeriesOpen] = useState(false)

  const [practiceGameOpen, setPracticeGameOpen] = useState(false)
  const [libraryInputMode, setLibraryInputMode] = useState(false)
  const demoBackRefs = useRef({ mentor: null, today: null, practices: null, settings: null })
  const [demoMotionTick, setDemoMotionTick] = useState(0)

  const registerDemoBack = useCallback((key, handler) => {
    if (demoBackRefs.current[key] === handler) return
    demoBackRefs.current[key] = handler
    setDemoMotionTick(tick => tick + 1)
  }, [])

  const registerTodayBack = useCallback(
    handler => registerDemoBack('today', handler),
    [registerDemoBack]
  )

  const registerPracticesBack = useCallback(
    handler => registerDemoBack('practices', handler),
    [registerDemoBack]
  )

  const registerSettingsBack = useCallback(
    handler => registerDemoBack('settings', handler),
    [registerDemoBack]
  )

  const registerMentorBack = useCallback(
    handler => registerDemoBack('mentor', handler),
    [registerDemoBack]
  )

  const closeTodaySeries = useCallback(() => setTodaySeriesOpen(false), [])

  const openSettings = useCallback(() => setOverlay('settings'), [])
  const openTodaySeries = useCallback(() => setTodaySeriesOpen(true), [])
  const openDemoPanel = useCallback(() => setDemoPanelOpen(true), [])

  useEffect(() => {
    if (!isPreviewDemoMode()) return undefined

    return installDemoPressFeedback(document)
  }, [])

  /*
   * Последняя реальная позиция скролла.
   */
  const lastScrollY = useRef(0)

  /*
   * Направление текущего жеста.
   */
  const scrollDirection = useRef(null)

  /*
   * Накопленная дистанция движения.
   */
  const scrollDistance = useRef(0)

  /*
   * requestAnimationFrame скролла.
   */
  const scrollFrame = useRef(null)

  /* Единый scroll-root обычных вкладок, ограниченный видимым viewport. */
  const scrollRootRef = useRef(null)

  /* Корневой элемент приложения — на нём висит глобальный edge-swipe. */
  const appRootRef = useRef(null)
  const [appRootMounted, setAppRootMounted] = useState(false)
  const setAppRootElement = useCallback(el => {
    appRootRef.current = el
    setAppRootMounted(Boolean(el))
  }, [])
  useGlobalEdgeSwipeBack(appRootRef, { enabled: appRootMounted })

  /*
   * Оба значения принадлежат человеку, а не устройству: знакомство
   * пройдено один раз, тема выбрана один раз. Поэтому они живут в
   * облаке Telegram и переезжают на другой телефон или десктоп.
   * Локальная копия остаётся, чтобы первый кадр не мигал, — см.
   * src/lib/store.js.
   */
  /*
   * Значение по умолчанию — «не пройдено». Прежний код читал
   * `getItem(...) === '1'`, то есть отсутствие ключа означало
   * нового человека, и знакомство показывалось. Поставить здесь
   * '1' значило бы навсегда спрятать онбординг от всех новых.
   */
  const [onboardedFlag, setOnboardedFlag] = useSynced(ONBOARDED_KEY, '0')

  // Demo builds are synthetic users only: they skip onboarding in DEV or
  // Vercel Preview, without writing the user's synced onboarding flag.
  // isPreviewDemoMode itself requires ?demo=1 and an allowed preview host.
  const onboarded = onboardedFlag === '1' || isPreviewDemoMode()

  /*
   * Блокировка приложения (PIN/биометрия). Синхронизируется только факт
   * «включена» — сам PIN живёт исключительно локально, см.
   * src/lib/appLock.js. Экран блокировки живёт поверх остального UI:
   * показывается на холодном старте и при каждом возврате из фона, но
   * только если PIN действительно задан на этом устройстве — синхронный
   * флаг «включено», пришедший с другого устройства, сам по себе экран
   * не показывает (там нечего проверять).
   */
  const [appLockEnabledFlag] = useSynced(APP_LOCK_ENABLED_KEY, '0')

  const appLockEnabled = appLockEnabledFlag === '1'

  /*
   * Акцентный цвет (MXL-THEME-ACCENT-001) — косметическая персонализация,
   * выбор живёт вместе с человеком (облако), как и onboarded/appLock выше.
   * Фон (--c-bg) этим не затрагивается.
   *
   * Состояние живёт здесь, а не в самом Settings: useSynced — это просто
   * useState без канала синхронизации между инстансами (нет storage-
   * listener, нет контекста), поэтому смена значения внутри Settings не
   * долетала бы до этого эффекта, если бы Settings держал свой отдельный
   * вызов useSynced на тот же ключ. Settings получает setAccentRaw пропом
   * (onAccentChange) и меняет именно это состояние.
   */
  const [accentRaw, setAccentRaw] = useSynced(ACCENT_COLOR_KEY, DEFAULT_ACCENT)

  const [themeRaw, setThemeRaw] = useSynced(THEME_KEY, DEFAULT_THEME)

  const theme = parseTheme(themeRaw)

  const accent = parseAccent(accentRaw, theme)

  const [locked, setLocked] = useState(() => appLockEnabled && hasPinRecord())

  /*
   * MXL-MOOD-CHECK-001 — быстрый mood-check при запуске (opt-in,
   * см. src/lib/moodCheckDraft.js). Тумблер синхронизируется как
   * appLockEnabled/accent выше; "показывать сегодня" и данные
   * чек-ина за сегодня — чисто локальные и решаются здесь, а не в
   * Today.jsx, потому что гейт должен показаться ДО монтирования
   * Today (см. рендер ниже, сразу после AppLock).
   *
   * moodCheckCheckin: undefined — ещё не фетчили, null — фетчили,
   * чек-ина на сегодня нет, объект — чек-ин уже есть, error — backend
   * недоступен. Гейт разрешён только для null: неизвестное состояние не
   * должно блокировать запуск приложения.
   * Фетчится только если тумблер включён — большинство его не видит.
   */
  const [moodCheckEnabledFlag] = useSynced(MOOD_CHECK_ENABLED_KEY, '0')

  const moodCheckEnabled = moodCheckEnabledFlag === '1'

  const [moodCheckDismissedToday, setMoodCheckDismissedToday] = useState(
    () => !shouldOfferMoodCheck()
  )

  const [moodCheckCheckin, setMoodCheckCheckin] = useState(undefined)

  useEffect(() => {
    if (!user || !onboarded || locked || !moodCheckEnabled || moodCheckDismissedToday) return

    let alive = true

    api.checkin
      .today(user.id)
      .then(checkin => {
        if (alive) setMoodCheckCheckin(checkin ?? null)
      })
      .catch(() => {
        if (alive) setMoodCheckCheckin(MOOD_CHECK_CHECKIN_ERROR)
      })

    return () => {
      alive = false
    }
  }, [user, onboarded, locked, moodCheckEnabled, moodCheckDismissedToday])

  const showMoodCheckGate = shouldShowMoodCheckGate({
    user,
    onboarded,
    locked,
    enabled: moodCheckEnabled,
    dismissedToday: moodCheckDismissedToday,
    todayCheckin: moodCheckCheckin,
  })

  const searchParams = new URLSearchParams(window.location.search)
  const { sub: initialTodaySub, returnFlow: initialReturnFlow } = parseContextualDeepLink(
    window.location.search,
    platform.getStartParam?.()
  )
  const initialTab = initialTodaySub ? null : searchParams.get('tab')
  const validTabs = ['today', 'practices', 'mentor', 'library', 'trends']

  // ?tab=history → открывает «Прогресс» на вкладке «История»
  const isHistoryInitial = initialTab === 'history'
  const [tab, setTab] = useState(
    isHistoryInitial ? 'trends' : validTabs.includes(initialTab) ? initialTab : 'today'
  )
  const [progressHistoryTrigger, setProgressHistoryTrigger] = useState(() =>
    isHistoryInitial ? 1 : 0
  )
  const tabRef = useRef(tab)
  useEffect(() => {
    tabRef.current = tab
  }, [tab])

  // ?tab=history → заменяем на ?tab=trends (история теперь сегмент внутри Прогресса)
  useEffect(() => {
    if (isHistoryInitial) {
      const url = new URL(window.location.href)
      url.searchParams.set('tab', 'trends')
      window.history.replaceState(null, '', url)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const bottomNavigationHidden =
    mentorPersonaOpen || todayFlowOpen || todaySeriesOpen || practiceGameOpen || libraryInputMode

  useEffect(() => {
    if (!isPreviewDemoMode()) return

    // Demo-only motion tick intentionally follows route/overlay transitions.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setDemoMotionTick(tick => tick + 1)
  }, [overlay, tab, mentorPersonaOpen, todayFlowOpen, todaySeriesOpen, practiceGameOpen])

  const demoBackAction =
    overlay === 'settings'
      ? demoBackRefs.current.settings || (() => setOverlay(null))
      : tab === 'mentor'
        ? demoBackRefs.current.mentor
        : tab === 'today'
          ? demoBackRefs.current.today
          : tab === 'practices'
            ? demoBackRefs.current.practices
            : null

  // Только разрешённые contextual deep-links открывают вложенный экран «Сегодня».
  const [practicesSub, setPracticesSub] = useState(null)

  const reportReturnFlowEvent = useCallback(
    async suffix => {
      if (!user?.id || user.demo || (user.is_guest && !platform.getSessionToken?.()) ||
          isPreviewDemoMode() || !initialReturnFlow) return

      const event = returnFlowEvent(initialReturnFlow, suffix)
      if (!claimReturnFlowEvent(user.id, initialReturnFlow, event)) return
      try {
        await api.returnFlow.log(
          event, returnFlowEventKey(user.id, event, initialReturnFlow),
          returnFlowOccurredAt(), initialReturnFlow
        )
      } catch {
        // События необязательны; недоступность сети не влияет на чек-ин.
      }
    },
    [initialReturnFlow, user]
  )

  useEffect(() => {
    if (user && initialReturnFlow) reportReturnFlowEvent('flow_opened')
  }, [initialReturnFlow, reportReturnFlowEvent, user])

  /* ============================================================
     THEME
     ============================================================ */

  useEffect(() => {
    if (accentRaw !== accent) {
      setAccentRaw(accent)
    }
  }, [accent, accentRaw, setAccentRaw])

  useEffect(() => {
    // Manual user preference is production behavior. The diagnostic gate
    // remains independent and is only consulted while the preference is dark.
    const root = document.documentElement
    if (theme === 'light') {
      root.setAttribute('data-theme', 'light')
    } else if (isLightThemePreviewEnabled()) {
      root.setAttribute('data-theme', 'light-preview')
    } else {
      root.removeAttribute('data-theme')
    }

    applyDarkTheme()
  }, [theme])

  useEffect(() => {
    document.documentElement.setAttribute('data-accent', accent)
  }, [accent])

  /* ============================================================
     TELEGRAM FULLSCREEN
     ============================================================ */

  useEffect(() => {
    return initFullscreen(({ fullscreen: fs }) => {
      setFullscreen(fs)
    })
  }, [])

  /* ============================================================
     AUTH
     ============================================================ */

  const previewDemoMode = isPreviewDemoMode()
  const demoPanelAllowed = previewDemoMode && platformName !== 'telegram'
  const [demoPanelOpen, setDemoPanelOpen] = useState(
    () => new URLSearchParams(window.location.search).get('panel') === '1'
  )
  const realPhone = isRealPhone()
  const toolbarParam = searchParams.get('toolbar') === '1'
  const frameParam = searchParams.get('frame')
  // На настоящем телефоне в демо-режиме инструменты ПК выключены;
  // ?toolbar=1 принудительно включает переключатель, ?frame=0 — выключает фрейм на ПК.
  const demoToolbar = previewDemoMode ? !realPhone || toolbarParam : toolbarParam
  const [demoDevice, setDemoDevice] = useState(() => {
    const device = new URLSearchParams(window.location.search).get('device')
    return device === 'max' ? 'max' : 'standard'
  })
  const demoViewport =
    demoDevice === 'max'
      ? { width: 440, height: 956, label: 'iPhone 16 Pro Max' }
      : { width: 393, height: 852, label: 'iPhone 15 Pro' }
  const [demoScale, setDemoScale] = useState(1)
  const [desktopDeviceFrame, setDesktopDeviceFrame] = useState(
    () =>
      window.innerWidth > 700 &&
      !['localhost', '127.0.0.1'].includes(window.location.hostname) &&
      !window.matchMedia?.('(display-mode: standalone)')?.matches
  )

  useEffect(() => {
    const updateDesktopFrame = () => {
      setDesktopDeviceFrame(
        window.innerWidth > 700 &&
          !['localhost', '127.0.0.1'].includes(window.location.hostname) &&
          !window.matchMedia?.('(display-mode: standalone)')?.matches
      )
    }
    updateDesktopFrame()
    window.addEventListener('resize', updateDesktopFrame)
    return () => window.removeEventListener('resize', updateDesktopFrame)
  }, [])

  const deviceFrameMode = previewDemoMode ? !realPhone && frameParam !== '0' : desktopDeviceFrame

  useEffect(() => {
    if (!deviceFrameMode) return undefined
    const updateScale = () => {
      // Единый базовый масштаб во всех web-режимах. Если окно ПК ниже
      // iPhone viewport, фрейм может выходить за высоту окна, но интерфейс
      // не должен становиться мельче только из-за высоты окна.
      setDemoScale(1)
    }
    updateScale()
    window.addEventListener('resize', updateScale)
    return () => window.removeEventListener('resize', updateScale)
  }, [demoDevice, demoToolbar, demoViewport.height, deviceFrameMode, previewDemoMode])

  const checkAuth = useCallback(async () => {
    setAuthError(null)
    try {
      const existing = await platform.requestAuth()

      if (existing) {
        acceptUser(existing)
      } else if (platformName === 'web' && !platform.getSessionToken?.()) {
        const params = new URLSearchParams(window.location.search)
        const emailLink =
          window.location.pathname.startsWith('/auth/') ||
          ['email', 'code', 'token'].some(key => params.has(key))
        if (!emailLink) {
          try {
            await loginAsGuest(api, acceptUser)
          } catch {
            // Не прячем email и Telegram вход, если гостевой сервер недоступен.
          }
        }
      }
    } catch {
      // Бэкенд недоступен (Render спит, нет сети, таймаут) — показываем
      // экран ошибки с «Повторить» вместо бесконечного splash или входа.
      setAuthError(true)
    } finally {
      setAuthChecked(true)
    }
  }, [acceptUser])

  const retryAuth = useCallback(() => {
    setAuthChecked(false)
    checkAuth()
  }, [checkAuth])

  useEffect(() => {
    platform.init()

    if (previewDemoMode) return

    // eslint-disable-next-line react-hooks/set-state-in-effect
    checkAuth()
  }, [checkAuth, previewDemoMode])

  // 401 guest_merged: гостевая cookie устарела после переноса записей.
  // Сбрасываем user → показывается экран входа.
  useEffect(() => {
    function handleGuestMerged() {
      setUser(null)
    }

    window.addEventListener(GUEST_MERGED_EVENT, handleGuestMerged)
    return () => window.removeEventListener(GUEST_MERGED_EVENT, handleGuestMerged)
  }, [])

  /* ============================================================
     БЛОКИРОВКА ПРИЛОЖЕНИЯ

     Возврат из фона — единственный триггер повторной блокировки:
     без таймера неактивности, каждое возвращение в приложение
     показывает экран блокировки заново, если она включена и
     настроена на этом устройстве.
     ============================================================ */

  useEffect(() => {
    function handleVisibility() {
      if (document.hidden) return

      if (appLockEnabled && hasPinRecord()) {
        setLocked(true)
      }
    }

    document.addEventListener('visibilitychange', handleVisibility)

    return () => {
      document.removeEventListener('visibilitychange', handleVisibility)
    }
  }, [appLockEnabled])

  /* ============================================================
     ПЛАТФОРМА

     Шапка и нижняя полоса Telegram красятся в цвет приложения:
     без этого на стыке видна граница из двух разных чёрных.
     Вертикальный свайп закрывает Mini App — на длинных
     прокручиваемых экранах это срабатывает случайно.
     ============================================================ */

  useEffect(() => {
    lockVerticalSwipes()
  }, [])

  // На реальном телефоне в демо-режиме без фрейма document может
  // прокручиваться вместо scroll-root. Блокируем прокрутку html/body,
  // чтобы единственным скролл-контейнером оставался mx-app-scroll-root.
  useEffect(() => {
    if (!previewDemoMode || !realPhone) return

    document.documentElement.classList.add('mx-real-phone-demo')

    return () => {
      document.documentElement.classList.remove('mx-real-phone-demo')
    }
  }, [previewDemoMode, realPhone])

  /*
   * Настройки уезжают в системное меню «⋯»: они нужны редко,
   * а место на экране занимали каждый день.
   */
  useSettingsButton(() => {
    setOverlay('settings')
  })

  useEffect(() => {
    if (!user) return undefined
    const timeoutId = window.setTimeout(() => {
      // Профиль — грузим заранее (нужен чаще всего).
      loadSettings().catch(() => {})
      // Остальные вкладки — prefetch после первой отрисовки «Сегодня»,
      // чтобы первый тап по вкладке не ждал загрузки чанка.
      import('./screens/Practices').catch(() => {})
      import('./screens/History').catch(() => {})
      import('./screens/Library').catch(() => {})
      import('./screens/Analytics').catch(() => {})
      import('./screens/Mentalix').catch(() => {})
    }, 1500)
    return () => window.clearTimeout(timeoutId)
  }, [user])

  /* ============================================================
     ZOOM

     Здесь раньше жил блок, который на
     уровне документа подавлял pinch,
     multi-touch и double tap. Он лечил
     один симптом — iOS увеличивал
     страницу при фокусе в поле мельче
     16px — но ценой того, что человек
     вообще не мог увеличить экран
     пальцами. Для приложения про
     внимание к себе это плохой обмен.

     Причина устранена по месту: все
     поля ввода теперь 16px и фокус сам
     по себе масштаб не меняет. Поэтому
     системный зум больше не глушим.

     Если понадобится вернуть какое-то
     ограничение — делать это точечно на
     конкретном элементе, а не на
     document, и не трогая доступность.
     ============================================================ */

  /* ============================================================
     COLLAPSIBLE NAVIGATION
     ============================================================ */

  useEffect(() => {
    const COLLAPSE_DISTANCE = 20
    const EXPAND_DISTANCE = 14
    const COLLAPSE_AFTER_Y = 96
    const TOP_ZONE = 32

    const resetGesture = () => {
      scrollDirection.current = null
      scrollDistance.current = 0
    }

    const processScroll = () => {
      scrollFrame.current = null

      /*
       * Пока открыта AI-персона,
       * BottomNavigation вообще не рендерится,
       * поэтому скролл не должен пытаться
       * управлять его состоянием.
       */
      if (bottomNavigationHidden) {
        return
      }

      /*
       * Dialog — fullscreen-сценарий: нижняя панель остаётся якорем
       * навигации и не должна исчезать при прокрутке истории сообщений.
       */
      if (tabRef.current === 'mentor') {
        setNavCollapsed(false)
        resetGesture()
        return
      }

      const currentY = Math.max(scrollRootRef.current?.scrollTop || 0, window.scrollY || 0)

      const previousY = lastScrollY.current

      const difference = currentY - previousY

      lastScrollY.current = currentY

      /*
       * Наверху страницы navbar
       * всегда раскрыт.
       */
      if (currentY <= TOP_ZONE) {
        resetGesture()

        setNavCollapsed(false)

        return
      }

      /*
       * Игнорируем микродвижения.
       */
      if (Math.abs(difference) < 1) {
        return
      }

      const direction = difference > 0 ? 'down' : 'up'

      /*
       * При смене направления
       * начинаем считать дистанцию заново.
       */
      if (scrollDirection.current !== direction) {
        scrollDirection.current = direction

        scrollDistance.current = 0
      }

      scrollDistance.current += Math.abs(difference)

      /*
       * Сворачивание.
       */
      if (
        direction === 'down' &&
        currentY > COLLAPSE_AFTER_Y &&
        scrollDistance.current >= COLLAPSE_DISTANCE
      ) {
        setNavCollapsed(true)

        scrollDistance.current = 0

        return
      }

      /*
       * Раскрытие.
       */
      if (direction === 'up' && scrollDistance.current >= EXPAND_DISTANCE) {
        setNavCollapsed(false)

        scrollDistance.current = 0
      }
    }

    const handleScroll = () => {
      if (scrollFrame.current !== null) {
        return
      }

      scrollFrame.current = window.requestAnimationFrame(processScroll)
    }

    lastScrollY.current = Math.max(scrollRootRef.current?.scrollTop || 0, window.scrollY || 0)

    resetGesture()

    const scrollRoot = scrollRootRef.current

    if (!scrollRoot) return

    scrollRoot.addEventListener('scroll', handleScroll, { passive: true })

    // На реальном телефоне без фрейма document может прокручиваться вместо
    // scroll-root. Слушаем оба источника — currentY берёт максимум.
    window.addEventListener('scroll', handleScroll, { passive: true })

    return () => {
      scrollRoot.removeEventListener('scroll', handleScroll)
      window.removeEventListener('scroll', handleScroll)

      if (scrollFrame.current !== null) {
        window.cancelAnimationFrame(scrollFrame.current)

        scrollFrame.current = null
      }
    }
  }, [authChecked, bottomNavigationHidden, locked, onboarded, user])

  /* ============================================================
     NAVIGATION
     ============================================================ */

  const scrollAppToTop = useCallback((behavior = 'auto') => {
    scrollRootRef.current?.scrollTo({
      top: 0,
      left: 0,
      behavior,
    })
  }, [])

  function resetNavigationGesture() {
    lastScrollY.current = Math.max(scrollRootRef.current?.scrollTop || 0, 0)

    scrollDirection.current = null
    scrollDistance.current = 0
  }

  function syncTabUrl(nextTab) {
    const url = new URL(window.location.href)

    if (nextTab === 'today') {
      url.searchParams.delete('tab')
    } else {
      url.searchParams.set('tab', nextTab)
    }

    url.searchParams.delete('action')
    window.history.replaceState(null, '', url)
  }

  function switchTab(key) {
    /*
     * При уходе с вкладки Наставник
     * всегда сбрасываем состояние
     * открытой персоны.
     */
    if (key !== 'mentor') {
      setMentorPersonaOpen(false)
    }

    if (key === tab) {
      scrollAppToTop('smooth')

      setNavCollapsed(false)

      scrollDirection.current = null
      scrollDistance.current = 0

      return
    }

    platform.haptic('light')

    setPracticesSub(null)

    syncTabUrl(key)
    setTab(key)

    setNavCollapsed(false)

    lastScrollY.current = 0
    scrollDirection.current = null
    scrollDistance.current = 0

    scrollAppToTop()
  }

  const goToday = useCallback(() => {
    platform.haptic('light')

    syncTabUrl('today')
    setMentorPersonaOpen(false)
    setPracticesSub(null)
    setTab('today')
    setNavCollapsed(false)
    resetNavigationGesture()
    scrollAppToTop()
  }, [scrollAppToTop])

  const openPractice = useCallback(
    sub => {
      platform.haptic('light')

      syncTabUrl('practices')
      setMentorPersonaOpen(false)

      setPracticesSub(sub || null)

      setTab('practices')

      setNavCollapsed(false)

      lastScrollY.current = 0
      scrollDirection.current = null
      scrollDistance.current = 0

      scrollAppToTop()
    },
    [scrollAppToTop]
  )

  const goMentor = useCallback(() => {
    platform.haptic('light')

    syncTabUrl('mentor')
    setMentorPersonaOpen(false)

    setTab('mentor')

    setNavCollapsed(false)

    lastScrollY.current = 0
    scrollDirection.current = null
    scrollDistance.current = 0

    scrollAppToTop()
  }, [scrollAppToTop])

  const completeOnboarding = useCallback(() => {
    /*
     * The onboarding surface owns the first fullscreen mount. When it is
     * removed, Today can otherwise render in the same batch before App has
     * observed the Telegram fullscreen snapshot and added the 56px control
     * reserve. Start/read the shared store synchronously before exposing the
     * main shell so its first frame already has the correct top inset.
     */
    setFullscreen(getFullscreenSnapshot())
    setOnboardedFlag('1')
  }, [setOnboardedFlag])

  /* ============================================================
     LOADING
     ============================================================ */

  if (!authChecked) {
    return <Splash />
  }

  /* ============================================================
     ОШИБКА ВОССТАНОВЛЕНИЯ СЕССИИ

     Бэкенд недоступен (Render спит, нет сети, таймаут 7с) —
     показываем понятное сообщение и «Повторить» вместо
     бесконечного splash или экрана входа. Только для web —
     Telegram requestAuth не бросает.
     ============================================================ */

  if (authError && !user && platformName === 'web') {
    return <SessionRestoreError onRetry={retryAuth} />
  }

  /* ============================================================
     ONBOARDING
     ============================================================ */

  if (user && !onboarded && !showGuestAuth) {
    return (
      <Suspense fallback={<Splash />}>
        <Onboarding user={user} onFinish={completeOnboarding} />
      </Suspense>
    )
  }

  /* ============================================================
     WEB AUTH
     ============================================================ */

  if ((!user || showGuestAuth) && platformName === 'web') {
    return (
      <div
        className="mx-web-auth-shell
          min-h-screen
          bg-emerald-deep
          text-cream
          flex
          flex-col
          items-center
          font-body
        "
      >
        <Suspense fallback={<Splash />}>
          <WebAuthScreen
            onAuthed={nextUser => {
              setShowGuestAuth(false)
              acceptUser(nextUser)
            }}
          />
        </Suspense>
      </div>
    )
  }

  /* ============================================================
     БЛОКИРОВКА ПРИЛОЖЕНИЯ

     После того, как личность уже подтверждена (Telegram или
     web-логин), но до основного UI — экран-гейт поверх готового
     приложения, не альтернативная авторизация.
     ============================================================ */

  if (user && locked) {
    return (
      <Suspense fallback={<Splash />}>
        <AppLock mode="unlock" onUnlock={() => setLocked(false)} />
      </Suspense>
    )
  }

  /* ============================================================
     MOOD-CHECK ПРИ ЗАПУСКЕ (MXL-MOOD-CHECK-001)

     Тот же порядок, что у AppLock выше: гейт поверх готового
     приложения, ДО основного UI, но не альтернативная авторизация.
     Условия показа — см. showMoodCheckGate.
     ============================================================ */

  if (showMoodCheckGate) {
    return (
      <Suspense fallback={null}>
        <MoodCheckGate onDismiss={() => setMoodCheckDismissedToday(true)} />
      </Suspense>
    )
  }

  /* ============================================================
     HEADER VISIBILITY
     ============================================================ */

  /*
   * Вложенный экран Today — отдельный сценарий, и
   * приветствие с шестерёнкой там чужие. Today уже
   * сообщает об этом через onFlowChange; раньше флаг
   * гасил только нижнюю навигацию.
   */
  const showTodayHeader =
    !previewDemoMode && !overlay && tab === 'today' && !todayFlowOpen && !todaySeriesOpen

  const topSafeArea =
    tab === 'mentor' && !overlay
      ? 'var(--app-safe-top)'
      : fullscreen
        ? 'calc(var(--app-safe-top) + 56px)'
        : 'var(--app-safe-top)'

  /*
   * КОНТРАКТ ОТСТУПОВ ЭКРАНА
   *
   * Отступы сверху и снизу принадлежат
   * App и только ему: сверху — safe area
   * плюс компенсация контролов Telegram,
   * снизу — место под нижнюю навигацию.
   *
   * Экраны-вкладки не задают собственные
   * pt/pb и используют одну обёртку
   * «w-full max-w-md px-5». Раньше каждый
   * экран решал сам: кто-то max-w-sm px-6,
   * кто-то max-w-md px-5, кто-то добавлял
   * pb-40 поверх этих ста пикселей. Отсюда
   * и разный визуальный масштаб вкладок, и
   * ощущение, что часть экранов «стоит
   * слишком низко».
   *
   * Когда navbar скрыт fullscreen-сценарием,
   * оставляем только системную нижнюю safe area.
   */
  const contentBottomPadding = bottomNavigationHidden
    ? 'var(--app-safe-bottom)'
    : 'var(--app-content-bottom)'

  // Полноэкранные листы Истории остаются внутри shell, но не закрывают шапку Telegram.
  const shellTopPadding =
    previewDemoMode && !realPhone && (!overlay || overlay === 'settings') &&
    !todaySeriesOpen && !todayFlowOpen
      ? '56px'
      : topSafeArea

  /* ============================================================
     UI
     ============================================================ */

  return (
    <div
      ref={setAppRootElement}
      data-mentalix-app-root="true"
      className={deviceFrameMode ? 'mx-preview-stage' : undefined}
    >
      {previewDemoMode && demoToolbar && (
        <div className="mx-preview-device-switcher" role="tablist" aria-label="Размер экрана">
          <span className="mx-preview-device-switcher__label">Demo viewport</span>
          {[
            { key: 'standard', label: '393', size: 'iPhone 15 Pro' },
            { key: 'max', label: '440', size: 'iPhone 16 Pro Max' },
          ].map(device => (
            <button
              key={device.key}
              type="button"
              role="tab"
              aria-selected={demoDevice === device.key}
              className={demoDevice === device.key ? 'is-active' : ''}
              onClick={() => {
                setDemoDevice(device.key)
                const params = new URLSearchParams(window.location.search)
                params.set('device', device.key)
                window.history.replaceState({}, '', `${window.location.pathname}?${params}`)
              }}
            >
              <strong>{device.label}</strong>
              <small>{device.size}</small>
            </button>
          ))}
        </div>
      )}
      {previewDemoMode && tab !== 'mentor' && (
        <div className="mx-preview-demo-note" role="status">
          Preview Demo Mode · данные только в этом браузере
        </div>
      )}
      <div
        data-mentalix-demo-frame={deviceFrameMode ? 'true' : undefined}
        data-mentalix-desktop-frame={desktopDeviceFrame ? 'true' : undefined}
        data-demo-tab={previewDemoMode ? (tab === 'trends' ? 'progress' : tab) : undefined}
        className={`
        h-screen
        relative
        overflow-hidden
        bg-emerald-deep
        text-cream
        flex
        flex-col
        items-center
        font-body
        mx-app-shell
        ${tab === 'mentor' && !overlay ? 'mx-dialog-app-shell' : ''}
        ${fullscreen ? 'mx-app-shell--fullscreen' : ''}
      `}
        style={{
          height: deviceFrameMode
            ? `${demoViewport.height}px`
            : viewportHeight
              ? `${viewportHeight}px`
              : '100dvh',
          width: deviceFrameMode ? `${demoViewport.width}px` : undefined,
          transform: deviceFrameMode ? `scale(${demoScale})` : undefined,
          marginBottom: deviceFrameMode
            ? `${-(demoViewport.height * (1 - demoScale))}px`
            : undefined,
          /* Профиль (overlay 'settings') в демо живёт под шапкой Telegram,
             как на устройстве: инсет шапки сохраняется и внутри оверлея. */
          paddingTop: shellTopPadding,
          '--mx-progress-overlay-top': shellTopPadding,
          paddingRight: 'var(--app-safe-right)',
          paddingLeft: 'var(--app-safe-left)',
        }}
      >
        {shouldRenderDemoTelegramChrome({ previewDemoMode, platformName, realPhone }) &&
          (!overlay || overlay === 'settings') &&
          !todaySeriesOpen &&
          !todayFlowOpen && (
            // eslint-disable-next-line react-hooks/refs
            <DemoTelegramChrome onBack={demoBackAction} />
          )}

        {/* ========================================================
          MENTALIX WORDMARK
          Только Сегодня.
         ======================================================== */}

        {fullscreen && showTodayHeader && (
          <div
            className="
              absolute
              left-0
              right-0
              z-40

              flex
              items-center
              justify-center

              pointer-events-none
            "
            style={{
              top: 'var(--app-safe-top)',
              height: '56px',
            }}
          >
            <span
              className="
                font-display
                text-[16px]
                tracking-[0.42em]
                text-muted
              "
            >
              MENTALIX
            </span>
          </div>
        )}

        <div
          ref={scrollRootRef}
          className={`mx-app-scroll-root w-full flex-1 min-h-0 flex flex-col items-center ${
            tab === 'mentor' && !overlay ? 'mx-dialog-runtime-scroll' : 'overflow-y-auto'
          }`}
          style={{
            scrollPaddingBottom: contentBottomPadding,
          }}
        >
          {/* ========================================================
          TODAY HEADER
         ======================================================== */}

          {/* ========================================================
          CONTENT
         ======================================================== */}

          <div
            key={overlay || 'main'}
            className={[
              'mx-scroll-content flex-1 w-full flex flex-col items-center',
              tab === 'mentor' && !overlay
                ? 'mx-dialog-runtime-shell'
                : mentorPersonaOpen
                  ? ''
                  : 'animate-fade-in',
              previewDemoMode && 'mx-demo-screen-transition',
              previewDemoMode && `mx-demo-screen-transition--${demoMotionTick % 2}`,
            ].join(' ')}
            // Нижний отступ — внутри содержимого, а не на скролл-контейнере:
            // WebKit (iPhone/Telegram) игнорирует padding-bottom у flex-контейнера
            // с overflow, и конец экрана уходил под нижнюю панель.
            style={
              tab === 'mentor' && !overlay ? undefined : { paddingBottom: contentBottomPadding }
            }
          >
            <Suspense fallback={<ScreenLoading />}>
              {!user && (
                <p
                  className="
              text-muted
              text-[13px]
              px-6
              text-center
              pt-8
            "
                >
                  Открой приложение через кнопку в боте, чтобы Менталикс увидел тебя
                </p>
              )}

              {/* Settings */}

              {overlay === 'settings' && (
                <Settings
                  user={user}
                  onBack={() => {
                    setOverlay(null)
                  }}
                  onRegisterBack={registerSettingsBack}
                  onScrollTop={scrollAppToTop}
                  accent={accent}
                  onAccentChange={setAccentRaw}
                  theme={theme}
                  onThemeChange={setThemeRaw}
                  onGuestLogin={() => setShowGuestAuth(true)}
                />
              )}

              {/* ======================================================
            MAIN TABS
           ====================================================== */}

              {!overlay && (
                <>
                  {user && tab === 'today' && (
                    <Today
                      user={user}
                      onOpenPractice={openPractice}
                      initialSub={initialTodaySub}
                      returnFlowActive={initialReturnFlow}
                      onReturnFlowEvent={reportReturnFlowEvent}
                      onGoMentor={goMentor}
                      onFlowChange={setTodayFlowOpen}
                      onRegisterBack={registerTodayBack}
                      onOpenSettings={openSettings}
                      onOpenDemoPanel={demoPanelAllowed ? openDemoPanel : undefined}
                      onOpenSeries={openTodaySeries}
                      seriesOpen={todaySeriesOpen}
                      onCloseSeries={closeTodaySeries}
                    />
                  )}

                  {user && tab === 'practices' && (
                    <Practices
                      user={user}
                      initialSub={practicesSub}
                      onGameChange={setPracticeGameOpen}
                      onRegisterBack={registerPracticesBack}
                      onReturnToToday={goToday}
                    />
                  )}

                  {user && tab === 'mentor' && (
                    <MentalixChat
                      user={user}
                      onPersonaChange={setMentorPersonaOpen}
                      onRegisterBack={registerMentorBack}
                    />
                  )}

                  {user && tab === 'library' && (
                    <Library user={user} onInputModeChange={setLibraryInputMode} />
                  )}

                  {user && tab === 'trends' && (
                    <Analytics
                      user={user}
                      historyTrigger={progressHistoryTrigger}
                      navCollapsed={navCollapsed}
                      onOpenHistory={() => {
                        platform.haptic('light')
                        setProgressHistoryTrigger(n => n + 1)
                        scrollAppToTop()
                      }}
                      onGoCheckin={() => {
                        platform.haptic('light')

                        setMentorPersonaOpen(false)

                        setTab('today')

                        setPracticesSub(null)

                        setNavCollapsed(false)

                        resetNavigationGesture()

                        scrollAppToTop()
                      }}
                      onStartMood={() => {
                        platform.haptic('light')
                        setMentorPersonaOpen(false)
                        setTab('practices')
                        setPracticesSub('mood')
                        setNavCollapsed(false)
                        resetNavigationGesture()
                        scrollAppToTop()
                      }}
                      onOpenNotifications={() => {
                        platform.haptic('light')
                        try { sessionStorage.setItem('mx-settings-initial-sub', 'notifications') } catch { /* */ }
                        setOverlay('settings')
                      }}
                      onRedo={() => {
                        platform.haptic('light')
                        setMentorPersonaOpen(false)
                        setTab('today')
                        setPracticesSub(null)
                        setNavCollapsed(false)
                        resetNavigationGesture()
                        scrollAppToTop()
                      }}
                      onRedoReview={() => {
                        platform.haptic('light')
                        setMentorPersonaOpen(false)
                        setTab('today')
                        setPracticesSub(null)
                        setNavCollapsed(false)
                        resetNavigationGesture()
                        scrollAppToTop()
                      }}
                    />
                  )}
                </>
              )}
            </Suspense>
          </div>
        </div>

        {/* ========================================================
          COLLAPSIBLE NAVIGATION
         ======================================================== */}

        {user && !overlay && !bottomNavigationHidden && (
          <BottomNavigation
            tab={tab}
            collapsed={navCollapsed}
            onCollapseChange={setNavCollapsed}
            onTabChange={switchTab}
          />
        )}

        <PreviewApiDiagnostic />
        {demoPanelAllowed && (
          <Suspense fallback={null}>
            <DemoPanel
              open={demoPanelOpen}
              onOpen={() => setDemoPanelOpen(true)}
              onClose={() => setDemoPanelOpen(false)}
            />
          </Suspense>
        )}
      </div>
    </div>
  )
}

/* ============================================================
   ERROR BOUNDARY WRAPPER
   ============================================================
   ErrorBoundary оборачивает всё приложение. Тестовый компонент
   активируется через ?error_test=1 для проверки ловушки.
   */

function ErrorTest() {
  throw new Error('Тестовая ошибка ErrorBoundary')
}

export default function AppRoot() {
  const errorTest = new URLSearchParams(window.location.search).get('error_test') === '1'

  return <ErrorBoundary>{errorTest ? <ErrorTest /> : <App />}</ErrorBoundary>
}
