import { Suspense, useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'

import DemoTelegramChrome from './components/DemoTelegramChrome'

import ErrorBoundary from './components/ErrorBoundary'
import ScreenErrorBoundary from './components/ScreenErrorBoundary'

import { lazyWithRetry } from './lib/lazyWithRetry'

import { platform, platformName } from './platform'
import { paintChrome, useSettingsButton } from './platform/telegram.hooks'

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
import {
  claimReturnFlowEvent,
  returnFlowEvent,
  returnFlowEventKey,
  returnFlowOccurredAt,
} from './lib/returnFlow'
import { parseContextualDeepLink } from './lib/contextualDeepLink'
import {
  DEMO_USER,
  isPreviewDemoMode,
  isRealPhone,
  isDemoGuestMode,
  DEMO_GUEST_USER,
  previewSeriesAction,
  isProfileDemoRequested,
  previewProfileAction,
} from './lib/demoMode'
import { installDemoPressFeedback } from './lib/demoPressFeedback'
import { shouldRenderDemoTelegramChrome } from './lib/demoChrome'
import { switchUserDataScope } from './lib/userDataScope'
import { clearTodayDataCache } from './lib/todayDataCache'
import { dispatchTabRefresh, dispatchTabReset } from './lib/tabRefresh'
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
/*
 * lazyWithRetry (src/lib/lazyWithRetry.js): у ленивого импорта есть
 * срок и один повтор, при окончательной ошибке чанка — одна
 * перезагрузка страницы, и только затем ошибка уходит в границу.
 * Это лечит «чёрный экран» под-экранов в Telegram WebView: зависший
 * или исчезнувший после деплоя чанк больше не оставляет пустой
 * shell без кнопок.
 */
const WebAuthScreen = lazyWithRetry(() => import('./screens/WebAuthScreen'))
const Onboarding = lazyWithRetry(() => import('./screens/Onboarding'))
const AppLock = lazyWithRetry(() => import('./screens/AppLock'))

const Practices = lazyWithRetry(() => import('./screens/Practices'))
const Analytics = lazyWithRetry(() => import('./screens/Analytics'))
const MentalixChat = lazyWithRetry(() => import('./screens/Mentalix'))
// Профиль и его под-экраны («подписка.», «поддержать проект.», опрос) лежат
// в одном чанке. Грузим его заранее, когда «Сегодня» уже показан, — иначе
// первый тап по кнопке профиля ждёт загрузку кода.
const loadSettings = () => import('./screens/Settings')
const Settings = lazyWithRetry(loadSettings)
const Library = lazyWithRetry(() => import('./screens/Library'))
const History = lazyWithRetry(() => import('./screens/History'))

// Код панели попадает в сеть только после проверки демо и отсутствия Telegram.
const DemoPanel = lazyWithRetry(() => import('./components/DemoPanel'))

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

  // ?demo=1&action=profile — превью-ссылка прямо на «твой профиль.»
  const [overlay, setOverlay] = useState(
    isProfileDemoRequested() || previewProfileAction() ? 'settings' : null
  )

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

  const [todaySeriesOpen, setTodaySeriesOpen] = useState(() => Boolean(previewSeriesAction()))

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

  /* Позиция скролла каждой вкладки для восстановления при возврате. */
  const scrollPositions = useRef({})

  /* Флаг: прокрутить новую вкладку наверх (программный переход) или
     восстановить сохранённую позицию (переключение через navbar). */
  const shouldScrollToTop = useRef(false)

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
  const [recoveryAllowedAtLaunch] = useState(() => onboardedFlag === '1' || isPreviewDemoMode())

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

  const searchParams = new URLSearchParams(window.location.search)
  const { sub: initialTodaySub, returnFlow: initialReturnFlow, practicesSub: initialPracticesSub } =
    parseContextualDeepLink(
      window.location.search,
      platform.getStartParam?.()
    )
  const initialTab = initialTodaySub
    ? null
    : initialPracticesSub
      ? 'practices'
      : searchParams.get('tab')
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

  /*
   * Однажды открытые вкладки остаются смонтированными (display:none),
   * а не удаляются — данные и позиция скролла сохраняются при возврате.
   */
  const [openedTabs, setOpenedTabs] = useState(() => new Set([tab]))

  // Добавляем текущую вкладку в набор открытых — useLayoutEffect
  // выполняется до paint, поэтому панель рендерится без вспышки.
  useLayoutEffect(() => {
    setOpenedTabs(prev => {
      if (prev.has(tab)) return prev
      return new Set([...prev, tab])
    })
  }, [tab])

  // Восстанавливаем позицию скролла при переключении вкладки.
  // Зависимость от openedTabs гарантирует, что панель уже отрендерена.
  useLayoutEffect(() => {
    if (!scrollRootRef.current) return
    if (shouldScrollToTop.current) {
      scrollRootRef.current.scrollTop = 0
      shouldScrollToTop.current = false
    } else {
      const savedPos = scrollPositions.current[tab] ?? 0
      scrollRootRef.current.scrollTop = savedPos
    }
    lastScrollY.current = scrollRootRef.current.scrollTop
    scrollDirection.current = null
    scrollDistance.current = 0
  }, [tab, openedTabs])

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

  // Только разрешённые contextual deep-links открывают вложенный экран «Сегодня».
  const [practicesSub, setPracticesSub] = useState(initialPracticesSub || null)

  const reportReturnFlowEvent = useCallback(
    async suffix => {
      if (
        !user?.id ||
        user.demo ||
        (user.is_guest && !platform.getSessionToken?.()) ||
        isPreviewDemoMode() ||
        !initialReturnFlow
      )
        return

      const event = returnFlowEvent(initialReturnFlow, suffix)
      if (!claimReturnFlowEvent(user.id, initialReturnFlow, event)) return
      try {
        await api.returnFlow.log(
          event,
          returnFlowEventKey(user.id, event, initialReturnFlow),
          returnFlowOccurredAt(),
          initialReturnFlow
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

      // Тихое фоновое обновление активной вкладки при возврате из фона
      dispatchTabRefresh(tabRef.current)

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
    // Prefetch вкладок — после загрузки данных «Сегодня» (событие из Today.jsx)
    // или через 3 с, что раньше: чтобы не конкурировать с запросами к API.
    let started = false
    let idleId = null
    const prefetch = () => {
      if (started) return
      started = true
      window.removeEventListener('mentalix:today-loaded', schedule)
      window.clearTimeout(fallbackId)
      // Профиль — грузим заранее (нужен чаще всего).
      loadSettings().catch(() => {})
      // Остальные вкладки — чтобы первый тап по вкладке не ждал загрузки чанка.
      import('./screens/Practices').catch(() => {})
      import('./screens/History').catch(() => {})
      import('./screens/Library').catch(() => {})
      import('./screens/Analytics').catch(() => {})
      import('./screens/Mentalix').catch(() => {})
    }
    // requestIdleCallback не блокирует отрисовку, setTimeout — fallback.
    function schedule() {
      window.removeEventListener('mentalix:today-loaded', schedule)
      if (typeof window.requestIdleCallback === 'function') {
        idleId = window.requestIdleCallback(prefetch, { timeout: 1000 })
      } else {
        window.setTimeout(prefetch, 0)
      }
    }
    window.addEventListener('mentalix:today-loaded', schedule)
    const fallbackId = window.setTimeout(prefetch, 3000)
    return () => {
      started = true
      window.removeEventListener('mentalix:today-loaded', schedule)
      window.clearTimeout(fallbackId)
      if (idleId != null) window.cancelIdleCallback?.(idleId)
    }
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
       * «Шаги» — нижняя навигация не сворачивается: у Stoic
       * нет плавающей лампочки, и свёрнутая кнопка с иконкой
       * Lightbulk здесь лишняя. На остальных вкладках — как было.
       */
      if (tabRef.current === 'practices') {
        setNavCollapsed(false)
        resetGesture()
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

      // Сохраняем позицию скролла текущей вкладки для восстановления
      if (scrollRootRef.current && tabRef.current) {
        scrollPositions.current[tabRef.current] = scrollRootRef.current.scrollTop
      }

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

      dispatchTabRefresh(key)
      dispatchTabReset(key)

      return
    }

    platform.haptic('light')

    syncTabUrl(key)

    // Сохраняем позицию скролла текущей вкладки перед уходом
    if (scrollRootRef.current) {
      scrollPositions.current[tab] = scrollRootRef.current.scrollTop
    }

    // Переключение через navbar — восстанавливаем сохранённую позицию
    shouldScrollToTop.current = false
    setOpenedTabs(prev => (prev.has(key) ? prev : new Set([...prev, key])))
    setTab(key)

    setNavCollapsed(false)

    lastScrollY.current = 0
    scrollDirection.current = null
    scrollDistance.current = 0

    dispatchTabRefresh(key)
  }

  const goToday = useCallback(() => {
    platform.haptic('light')

    syncTabUrl('today')
    setMentorPersonaOpen(false)
    setPracticesSub(null)
    shouldScrollToTop.current = true
    setOpenedTabs(prev => (prev.has('today') ? prev : new Set([...prev, 'today'])))
    setTab('today')
    setNavCollapsed(false)
    resetNavigationGesture()
    scrollAppToTop()

    dispatchTabRefresh('today')
  }, [scrollAppToTop])

  /*
   * Выход из ошибки экрана в ScreenErrorBoundary: снимает оверлей
   * (например, Settings) и возвращает на «Сегодня». resetKey границы
   * меняется вместе с вкладкой/оверлеем, поэтому ошибка не застревает.
   */
  // Счётчик сброса ошибок: «На главную» инкрементирует ключ, и каждая
  // граница ошибки сбрасывается без переключения вкладки.
  const [errorResetKey, setErrorResetKey] = useState(0)

  const goHome = useCallback(() => {
    setOverlay(null)
    goToday()
    setErrorResetKey(k => k + 1)
  }, [goToday])

  const openPractice = useCallback(
    sub => {
      platform.haptic('light')

      syncTabUrl('practices')
      setMentorPersonaOpen(false)

      setPracticesSub(sub || null)

      shouldScrollToTop.current = true
      setOpenedTabs(prev => (prev.has('practices') ? prev : new Set([...prev, 'practices'])))
      setTab('practices')

      setNavCollapsed(false)

      lastScrollY.current = 0
      scrollDirection.current = null
      scrollDistance.current = 0

      scrollAppToTop()

      dispatchTabRefresh('practices')
    },
    [scrollAppToTop]
  )

  const goMentor = useCallback(() => {
    platform.haptic('light')

    syncTabUrl('mentor')
    setMentorPersonaOpen(false)

    shouldScrollToTop.current = true
    setOpenedTabs(prev => (prev.has('mentor') ? prev : new Set([...prev, 'mentor'])))
    setTab('mentor')

    setNavCollapsed(false)

    lastScrollY.current = 0
    scrollDirection.current = null
    scrollDistance.current = 0

    scrollAppToTop()

    dispatchTabRefresh('mentor')
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
  // В demo-рамке с эмуляцией Telegram все экраны получают отступы как в
  // Telegram fullscreen: верх = safe-top (статус-бар iOS) + 56 (пилюли Telegram).
  const shellTopPadding =
    previewDemoMode && !realPhone && deviceFrameMode
      ? 'calc(var(--app-safe-top) + 56px)'
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
        data-demo-mode={deviceFrameMode && previewDemoMode ? 'true' : undefined}
        data-demo-device={deviceFrameMode ? demoDevice : undefined}
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
        {shouldRenderDemoTelegramChrome({
          previewDemoMode,
          platformName,
          realPhone,
          deviceFrameMode,
        }) && <DemoTelegramChrome />}

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

            {/* Settings — отдельная граница ошибки и Suspense */}

            {overlay === 'settings' && (
              <ScreenErrorBoundary resetKey={`settings-${errorResetKey}`} onHome={goHome}>
                <Suspense fallback={<ScreenLoading />}>
                  <Settings
                    user={user}
                    onBack={() => {
                      setOverlay(null)
                      dispatchTabRefresh(tabRef.current)
                    }}
                    onRegisterBack={registerSettingsBack}
                    onScrollTop={scrollAppToTop}
                    accent={accent}
                    onAccentChange={setAccentRaw}
                    theme={theme}
                    onThemeChange={setThemeRaw}
                    onGuestLogin={() => setShowGuestAuth(true)}
                  />
                </Suspense>
              </ScreenErrorBoundary>
            )}

            {/* ======================================================
            MAIN TABS — удержание смонтированными
            Однажды открытые вкладки остаются в DOM (display:none),
            а не удаляются. Данные и позиция скролла сохраняются
            при возврате. Каждая вкладка — своя Suspense + граница
            ошибки, чтобы загрузка/ошибка одной не затрагивала другие.
           ====================================================== */}

            {user && !overlay && (
              <>
                {openedTabs.has('today') && (
                  <div
                    className={
                      tab === 'today'
                        ? 'mx-tab-panel mx-tab-panel--active'
                        : 'mx-tab-panel mx-tab-panel--hidden'
                    }
                    aria-hidden={tab !== 'today'}
                    inert={tab !== 'today' ? '' : undefined}
                  >
                    <ScreenErrorBoundary resetKey={`today-${errorResetKey}`} onHome={goHome}>
                      <Suspense fallback={<ScreenLoading />}>
                        <Today
                          user={user}
                          recoveryAllowed={recoveryAllowedAtLaunch}
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
                      </Suspense>
                    </ScreenErrorBoundary>
                  </div>
                )}

                {openedTabs.has('practices') && (
                  <div
                    className={
                      tab === 'practices'
                        ? 'mx-tab-panel mx-tab-panel--active'
                        : 'mx-tab-panel mx-tab-panel--hidden'
                    }
                    aria-hidden={tab !== 'practices'}
                    inert={tab !== 'practices' ? '' : undefined}
                  >
                    <ScreenErrorBoundary resetKey={`practices-${errorResetKey}`} onHome={goHome}>
                      <Suspense fallback={<ScreenLoading />}>
                        <Practices
                          user={user}
                          initialSub={practicesSub}
                          onGameChange={setPracticeGameOpen}
                          onRegisterBack={registerPracticesBack}
                          onReturnToToday={goToday}
                        />
                      </Suspense>
                    </ScreenErrorBoundary>
                  </div>
                )}

                {openedTabs.has('mentor') && (
                  <div
                    className={
                      tab === 'mentor'
                        ? 'mx-tab-panel mx-tab-panel--active'
                        : 'mx-tab-panel mx-tab-panel--hidden'
                    }
                    aria-hidden={tab !== 'mentor'}
                    inert={tab !== 'mentor' ? '' : undefined}
                  >
                    <ScreenErrorBoundary resetKey={`mentor-${errorResetKey}`} onHome={goHome}>
                      <Suspense fallback={<ScreenLoading />}>
                        <MentalixChat
                          user={user}
                          onPersonaChange={setMentorPersonaOpen}
                          onRegisterBack={registerMentorBack}
                        />
                      </Suspense>
                    </ScreenErrorBoundary>
                  </div>
                )}

                {openedTabs.has('library') && (
                  <div
                    className={
                      tab === 'library'
                        ? 'mx-tab-panel mx-tab-panel--active'
                        : 'mx-tab-panel mx-tab-panel--hidden'
                    }
                    aria-hidden={tab !== 'library'}
                    inert={tab !== 'library' ? '' : undefined}
                  >
                    <ScreenErrorBoundary resetKey={`library-${errorResetKey}`} onHome={goHome}>
                      <Suspense fallback={<ScreenLoading />}>
                        <Library user={user} onInputModeChange={setLibraryInputMode} />
                      </Suspense>
                    </ScreenErrorBoundary>
                  </div>
                )}

                {openedTabs.has('trends') && (
                  <div
                    className={
                      tab === 'trends'
                        ? 'mx-tab-panel mx-tab-panel--active'
                        : 'mx-tab-panel mx-tab-panel--hidden'
                    }
                    aria-hidden={tab !== 'trends'}
                    inert={tab !== 'trends' ? '' : undefined}
                  >
                    <ScreenErrorBoundary resetKey={`trends-${errorResetKey}`} onHome={goHome}>
                      <Suspense fallback={<ScreenLoading />}>
                        <Analytics
                          user={user}
                          historyTrigger={progressHistoryTrigger}
                          navCollapsed={navCollapsed}
                          onOpenHistory={() => {
                            platform.haptic('light')
                            setProgressHistoryTrigger(n => n + 1)
                            scrollAppToTop()
                          }}
                          onGoCheckin={goToday}
                          onStartMood={() => openPractice('mood')}
                          onOpenNotifications={() => {
                            platform.haptic('light')
                            try {
                              sessionStorage.setItem('mx-settings-initial-sub', 'notifications')
                            } catch {
                              /* */
                            }
                            setOverlay('settings')
                          }}
                          onRedo={goToday}
                          onRedoReview={goToday}
                        />
                      </Suspense>
                    </ScreenErrorBoundary>
                  </div>
                )}
              </>
            )}
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
