import { lazy, Suspense, useCallback, useEffect, useRef, useState } from 'react'

import { Flame, Settings as SettingsIcon } from 'lucide-react'

import { platform, platformName } from './platform'
import { paintChrome, lockVerticalSwipes, useSettingsButton } from './platform/telegram.hooks'

import Today from './screens/Today'
import WebAuthScreen from './screens/WebAuthScreen'
import Onboarding from './screens/Onboarding'
import AppLock from './screens/AppLock'

import MazeLogo from './components/MazeLogo'
import BackButton from './components/BackButton'
import BottomNavigation from './components/BottomNavigation'
import { useSynced } from './lib/store'
import { hasPinRecord, APP_LOCK_ENABLED_KEY } from './lib/appLock'
import { ACCENT_COLOR_KEY, DEFAULT_ACCENT, parseAccent } from './lib/accentColor'
import { api } from './lib/api'
import { currentCheckinStreak } from './lib/series'
import { MOOD_CHECK_ENABLED_KEY, shouldOfferMoodCheck } from './lib/moodCheckDraft'
import { MOOD_CHECK_CHECKIN_ERROR, shouldShowMoodCheckGate } from './lib/moodCheckGate'
import { DEMO_USER, isPreviewDemoMode } from './lib/demoMode'

import { initFullscreen } from './lib/tgFullscreen'
import { useVisualViewportHeight } from './lib/visualViewport'

/* ============================================================
   STORAGE
   ============================================================ */

const ONBOARDED_KEY = 'mx-onboarded-v2'

/* ============================================================
   LAZY SCREENS

   Первый экран, авторизация, онбординг и блокировка остаются в
   стартовом bundle. Остальные вкладки и настройки загружаются
   только при первом переходе к ним.
   ============================================================ */

const Practices = lazy(() => import('./screens/Practices'))
const Analytics = lazy(() => import('./screens/Analytics'))
const MentalixChat = lazy(() => import('./screens/Mentalix'))
const Profile = lazy(() => import('./screens/Profile'))
const Settings = lazy(() => import('./screens/Settings'))
const Library = lazy(() => import('./screens/Library'))

// Opt-in (MOOD_CHECK_ENABLED_KEY по умолчанию '0') — большинство никогда
// его не увидит, поэтому вне стартового bundle, в отличие от AppLock.
const MoodCheckGate = lazy(() => import('./screens/MoodCheckGate'))

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
      <MazeLogo size={132} progress={0.55} className="animate-pulse-once" />

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
  return (
    <div
      role="status"
      aria-live="polite"
      className="w-full max-w-md px-5 pt-8 text-center text-[13px] text-muted"
    >
      Загрузка…
    </div>
  )
}

/* ============================================================
   TODAY TEXT
   ============================================================ */

function greeting() {
  const h = new Date().getHours()

  if (h >= 5 && h <= 11) {
    return 'доброе утро.'
  }

  if (h >= 12 && h <= 17) {
    return 'добрый день.'
  }

  if (h >= 18 && h <= 22) {
    return 'добрый вечер.'
  }

  return 'тихой ночи.'
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

export default function App() {
  const [user, setUser] = useState(() => (isPreviewDemoMode() ? DEMO_USER : null))

  const [authChecked, setAuthChecked] = useState(() => isPreviewDemoMode())

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

  const [todayStreak, setTodayStreak] = useState(0)

  const [practiceGameOpen, setPracticeGameOpen] = useState(false)

  useEffect(() => {
    if (!user) return

    let active = true

    api.checkin
      .history(user.id, 90)
      .then(checkins => {
        if (active) setTodayStreak(currentCheckinStreak(checkins))
      })
      .catch(() => {
        if (active) setTodayStreak(0)
      })

    return () => {
      active = false
    }
  }, [user])

  const bottomNavigationHidden =
    mentorPersonaOpen || todayFlowOpen || todaySeriesOpen || practiceGameOpen

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

  const onboarded = onboardedFlag === '1'

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

  const accent = parseAccent(accentRaw)

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
  const initialTab = searchParams.get('tab')
  const initialAction = searchParams.get('action')
  const validTabs = ['today', 'practices', 'mentor', 'library', 'trends']
  const actionTab = initialAction === 'breathing' ? 'practices' : 'today'
  const initialTodaySub =
    initialAction === 'checkin' || initialAction === 'evening' ? initialAction : null

  const [tab, setTab] = useState(validTabs.includes(initialTab) ? initialTab : actionTab)

  // Разрешены только известные contextual deep-links. Остальные query-параметры не
  // меняют состояние приложения и не могут открыть произвольный экран.
  const [practicesSub, setPracticesSub] = useState(
    initialAction === 'breathing' ? 'breathing' : null
  )

  /* ============================================================
     THEME
     ============================================================ */

  useEffect(() => {
    // Hidden developer gate: ?light-preview=1 works only in local dev or
    // Vercel Preview builds. Production defaults to the existing dark theme.
    const root = document.documentElement
    if (isLightThemePreviewEnabled()) {
      root.setAttribute('data-theme', 'light-preview')
    } else {
      root.removeAttribute('data-theme')
    }

    applyDarkTheme()
  }, [])

  useEffect(() => {
    if (accent === DEFAULT_ACCENT) {
      document.documentElement.removeAttribute('data-accent')
    } else {
      document.documentElement.setAttribute('data-accent', accent)
    }
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

  useEffect(() => {
    platform.init()

    if (previewDemoMode) return

    ;(async () => {
      const existing = await platform.requestAuth()

      if (existing) {
        setUser(existing)
      }

      setAuthChecked(true)
    })()
  }, [previewDemoMode])

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

  /*
   * Настройки уезжают в системное меню «⋯»: они нужны редко,
   * а место на экране занимали каждый день.
   */
  useSettingsButton(() => {
    setOverlay('settings')
  })

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

      const currentY = Math.max(scrollRootRef.current?.scrollTop || 0, 0)

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

    lastScrollY.current = Math.max(scrollRootRef.current?.scrollTop || 0, 0)

    resetGesture()

    const scrollRoot = scrollRootRef.current

    if (!scrollRoot) return

    scrollRoot.addEventListener('scroll', handleScroll, { passive: true })

    return () => {
      scrollRoot.removeEventListener('scroll', handleScroll)

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

  /* ============================================================
     LOADING
     ============================================================ */

  if (!authChecked) {
    return <Splash />
  }

  /* ============================================================
     ONBOARDING
     ============================================================ */

  if (user && !onboarded) {
    return (
      <Onboarding
        user={user}
        onFinish={() => {
          setOnboardedFlag('1')
        }}
      />
    )
  }

  /* ============================================================
     WEB AUTH
     ============================================================ */

  if (!user && platformName === 'web') {
    return (
      <div
        className="
          min-h-screen
          bg-emerald-deep
          text-cream
          flex
          flex-col
          items-center
          font-body
        "
      >
        <WebAuthScreen onAuthed={setUser} />
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
    return <AppLock mode="unlock" onUnlock={() => setLocked(false)} />
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
  const showTodayHeader = !overlay && tab === 'today' && !todayFlowOpen && !todaySeriesOpen

  const topSafeArea = fullscreen ? 'calc(var(--app-safe-top) + 56px)' : 'var(--app-safe-top)'

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

  /* ============================================================
     UI
     ============================================================ */

  return (
    <div
      className="
        h-screen
        overflow-hidden
        bg-emerald-deep
        text-cream
        flex
        flex-col
        items-center
        font-body
      "
      style={{
        height: viewportHeight ? `${viewportHeight}px` : '100dvh',
        paddingTop: topSafeArea,
        paddingRight: 'var(--app-safe-right)',
        paddingLeft: 'var(--app-safe-left)',
      }}
    >
      {previewDemoMode && (
        <div
          role="status"
          className="fixed top-2 left-1/2 z-[100] -translate-x-1/2 rounded-full border border-gold/40 bg-emerald px-3 py-1 text-[10px] font-semibold tracking-wide text-gold shadow-lg"
        >
          Preview Demo Mode · данные только в этом браузере
        </div>
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
        className="w-full flex-1 min-h-0 overflow-y-auto overscroll-contain flex flex-col items-center"
        style={{
          paddingBottom: contentBottomPadding,
          scrollPaddingBottom: contentBottomPadding,
        }}
      >
        {/* ========================================================
          TODAY HEADER
         ======================================================== */}

        {showTodayHeader && (
          <>
            <div
              className="
              w-full
              max-w-md

              px-5
              pt-0
              pb-0

              flex
              items-center
              justify-between
              gap-2
            "
            >
              {/* Огонёк открывает общий экран серий и вех. */}
              <button
                type="button"
                onClick={() => {
                  platform.haptic('light')
                  setTodaySeriesOpen(true)
                }}
                aria-label={`Серии и вехи. Текущая серия: ${todayStreak} дней`}
                className="relative flex w-10 max-[359px]:w-6 h-10 shrink-0 items-center justify-center rounded-full bg-emerald border border-cream/10 text-gold active:scale-95"
              >
                <Flame size={18} strokeWidth={1.75} aria-hidden="true" />
                {todayStreak > 0 && (
                  <span className="absolute -right-0.5 -top-0.5 min-w-[15px] rounded-full bg-gold px-1 text-center text-[9px] font-bold leading-[15px] text-emerald-deep">
                    {todayStreak}
                  </span>
                )}
              </button>

              {/* Greeting */}

              <h1
                className="
                font-display
                mx-type-greeting
                text-cream
                lowercase
                min-w-0
                flex-1
                text-center
                truncate
              "
              >
                {/*
                Простое приветствие по
                времени суток, без имени.
                Обращение по имени каждый
                день звучит как рассылка,
                а не как разговор с собой.
              */}
                {greeting()}
              </h1>

              {/* Settings */}

              <button
                type="button"
                onClick={() => {
                  platform.haptic('light')

                  setOverlay('settings')
                }}
                aria-label="Настройки"
                className="
                w-10
                h-10

                rounded-full

                bg-emerald

                border
                border-cream/10

                flex
                items-center
                justify-center

                active:scale-95
                shrink-0
              "
              >
                <SettingsIcon size={19} strokeWidth={1.7} className="text-muted" />
              </button>
            </div>
          </>
        )}

        {/* ========================================================
          CONTENT
         ======================================================== */}

        <div
          key={overlay || 'main'}
          className={[
            'flex-1 w-full flex flex-col items-center',
            mentorPersonaOpen ? '' : 'animate-fade-in',
          ].join(' ')}
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
                onNavigate={destination => {
                  if (destination === 'profile') {
                    setOverlay('profile')
                  }
                }}
                accent={accent}
                onAccentChange={setAccentRaw}
              />
            )}

            {/* Profile */}

            {overlay === 'profile' && (
              <div
                className="
              w-full
              flex
              flex-col
              items-center
            "
              >
                <div
                  className="
                w-full
                max-w-md

                px-5
                pb-2

                relative
                grid
                grid-cols-[1fr_auto_1fr]
                items-center
              "
                >
                  <div className="justify-self-start">
                    <BackButton
                      onClick={() => {
                        setOverlay('settings')
                      }}
                    />
                  </div>

                  <span
                    className="
                  font-display
                  mx-type-card
                  text-cream
                  lowercase
                "
                  >
                    профиль.
                  </span>

                  <span aria-hidden="true" />
                </div>

                <Profile user={user} />
              </div>
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
                    onGoMentor={goMentor}
                    onFlowChange={setTodayFlowOpen}
                    onOpenSettings={() => setOverlay('settings')}
                    seriesOpen={todaySeriesOpen}
                    onCloseSeries={() => setTodaySeriesOpen(false)}
                  />
                )}

                {user && tab === 'practices' && (
                  <Practices
                    user={user}
                    initialSub={practicesSub}
                    onGameChange={setPracticeGameOpen}
                    onReturnToToday={goToday}
                  />
                )}

                {user && tab === 'mentor' && (
                  <MentalixChat user={user} onPersonaChange={setMentorPersonaOpen} />
                )}

                {user && tab === 'library' && <Library user={user} />}

                {user && tab === 'trends' && (
                  <Analytics
                    user={user}
                    onGoCheckin={() => {
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
    </div>
  )
}
