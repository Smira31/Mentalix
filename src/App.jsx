import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react'

import {
  ChevronLeft,
  Settings as SettingsIcon,
} from 'lucide-react'

import { platform, platformName } from './platform'

import Today from './screens/Today'
import Practices from './screens/Practices'
import Analytics from './screens/Analytics'
import MentalixChat from './screens/Mentalix'
import Profile from './screens/Profile'
import Settings from './screens/Settings'
import WebAuthScreen from './screens/WebAuthScreen'
import Library from './screens/Library'
import Onboarding from './screens/Onboarding'

import MazeLogo from './components/MazeLogo'
import BottomNavigation from './components/BottomNavigation'

import { initFullscreen } from './lib/tgFullscreen'


/* ============================================================
   STORAGE
   ============================================================ */

const THEME_KEY = 'mx-theme'
const ONBOARDED_KEY = 'mx-onboarded-v2'


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
      <MazeLogo
        size={132}
        progress={0.55}
        className="animate-pulse-once"
      />

      <div
        className="
          font-display
          text-[15px]
          tracking-[0.4em]
          text-cream/50
          mt-7
        "
      >
        MENTALIX
      </div>

      <div
        className="
          text-[12px]
          text-cream/30
          font-semibold
          mt-2
        "
      >
        выход находится шагами
      </div>
    </div>
  )
}


/* ============================================================
   TODAY TEXT
   ============================================================ */

function tagline() {
  const h = new Date().getHours()

  if (h >= 5 && h <= 11) {
    return 'день начинается с одного шага'
  }

  if (h >= 12 && h <= 17) {
    return 'шаг за шагом — выход находится'
  }

  if (h >= 18 && h <= 22) {
    return 'день закрывают, а не бросают'
  }

  return 'тишина — тоже часть пути'
}


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

function isDayNow() {
  const h = new Date().getHours()

  return h >= 6 && h < 18
}


function resolveLight(mode) {
  if (mode === 'light') {
    return true
  }

  if (mode === 'dark') {
    return false
  }

  return isDayNow()
}


function getThemeBackground() {
  const channels = getComputedStyle(
    document.documentElement
  )
    .getPropertyValue('--c-bg')
    .trim()
    .split(/\s+/)
    .map(Number)

  if (
    channels.length !== 3 ||
    channels.some(
      (channel) =>
        !Number.isFinite(channel) ||
        channel < 0 ||
        channel > 255
    )
  ) {
    return null
  }

  return `#${channels
    .map((channel) =>
      channel
        .toString(16)
        .padStart(2, '0')
    )
    .join('')}`
}


function applyTheme(light) {
  document.body.classList.toggle(
    'light',
    light
  )

  const background =
    getThemeBackground()

  if (background) {
    platform.setThemeColors?.(
      background
    )
  }
}


/* ============================================================
   USER NAME
   ============================================================ */

function displayName(user) {
  const raw = (user?.first_name || '')
    .trim()
    .split(/\s+/)[0]

  if (!raw) {
    return null
  }

  if (/[0-9_]/.test(raw)) {
    return null
  }

  if (raw.length > 14) {
    return null
  }

  return raw
}


/* ============================================================
   APP
   ============================================================ */

export default function App() {
  const [user, setUser] =
    useState(null)

  const [authChecked, setAuthChecked] =
    useState(false)

  const [overlay, setOverlay] =
    useState(null)

  const [fullscreen, setFullscreen] =
    useState(false)

  const [navCollapsed, setNavCollapsed] =
    useState(false)

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
  const [
    mentorPersonaOpen,
    setMentorPersonaOpen,
  ] = useState(false)

  const [
    todayFlowOpen,
    setTodayFlowOpen,
  ] = useState(false)

  const [
    practiceGameOpen,
    setPracticeGameOpen,
  ] = useState(false)

  const bottomNavigationHidden =
    mentorPersonaOpen
    || todayFlowOpen
    || practiceGameOpen


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


  const [onboarded, setOnboarded] =
    useState(() => {
      try {
        return (
          localStorage.getItem(
            ONBOARDED_KEY
          ) === '1'
        )
      } catch {
        return true
      }
    })


  const [themeMode, setThemeMode] =
    useState(() => {
      try {
        return (
          localStorage.getItem(
            THEME_KEY
          ) || 'auto'
        )
      } catch {
        return 'auto'
      }
    })


  const initialTab =
    new URLSearchParams(
      window.location.search
    ).get('tab')


  const validTabs = [
    'today',
    'practices',
    'mentor',
    'library',
    'trends',
  ]


  const [tab, setTab] =
    useState(
      validTabs.includes(initialTab)
        ? initialTab
        : 'today'
    )


  const [
    practicesSub,
    setPracticesSub,
  ] = useState(null)


  /* ============================================================
     THEME
     ============================================================ */

  useEffect(() => {
    applyTheme(
      resolveLight(themeMode)
    )

    try {
      localStorage.setItem(
        THEME_KEY,
        themeMode
      )
    } catch {}

    if (themeMode !== 'auto') {
      return
    }

    const id = setInterval(() => {
      applyTheme(
        resolveLight('auto')
      )
    }, 60_000)

    return () => {
      clearInterval(id)
    }
  }, [themeMode])


  function cycleTheme() {
    platform.haptic('light')

    setThemeMode((mode) => {
      if (mode === 'auto') {
        return isDayNow()
          ? 'dark'
          : 'light'
      }

      if (mode === 'dark') {
        return 'light'
      }

      return 'dark'
    })
  }


  /* ============================================================
     TELEGRAM FULLSCREEN
     ============================================================ */

  useEffect(() => {
    initFullscreen(
      ({ fullscreen: fs }) => {
        setFullscreen(fs)
      }
    )
  }, [])


  /* ============================================================
     AUTH
     ============================================================ */

  useEffect(() => {
    platform.init()

    ;(async () => {
      const existing =
        await platform.requestAuth()

      if (existing) {
        setUser(existing)
      }

      setAuthChecked(true)
    })()
  }, [])


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

      const currentY =
        Math.max(
          window.scrollY || 0,
          0
        )

      const previousY =
        lastScrollY.current

      const difference =
        currentY - previousY

      lastScrollY.current =
        currentY


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


      const direction =
        difference > 0
          ? 'down'
          : 'up'


      /*
       * При смене направления
       * начинаем считать дистанцию заново.
       */
      if (
        scrollDirection.current !==
        direction
      ) {
        scrollDirection.current =
          direction

        scrollDistance.current = 0
      }


      scrollDistance.current +=
        Math.abs(difference)


      /*
       * Сворачивание.
       */
      if (
        direction === 'down' &&
        currentY > COLLAPSE_AFTER_Y &&
        scrollDistance.current >=
          COLLAPSE_DISTANCE
      ) {
        setNavCollapsed(true)

        scrollDistance.current = 0

        return
      }


      /*
       * Раскрытие.
       */
      if (
        direction === 'up' &&
        scrollDistance.current >=
          EXPAND_DISTANCE
      ) {
        setNavCollapsed(false)

        scrollDistance.current = 0
      }
    }


    const handleScroll = () => {
      if (
        scrollFrame.current !== null
      ) {
        return
      }

      scrollFrame.current =
        window.requestAnimationFrame(
          processScroll
        )
    }


    lastScrollY.current =
      Math.max(
        window.scrollY || 0,
        0
      )

    resetGesture()


    window.addEventListener(
      'scroll',
      handleScroll,
      { passive: true }
    )


    return () => {
      window.removeEventListener(
        'scroll',
        handleScroll
      )

      if (
        scrollFrame.current !== null
      ) {
        window.cancelAnimationFrame(
          scrollFrame.current
        )

        scrollFrame.current = null
      }
    }
  }, [bottomNavigationHidden])


  /* ============================================================
     NAVIGATION
     ============================================================ */

  function resetNavigationGesture() {
    lastScrollY.current =
      Math.max(
        window.scrollY || 0,
        0
      )

    scrollDirection.current = null
    scrollDistance.current = 0
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
      window.scrollTo({
        top: 0,
        left: 0,
        behavior: 'smooth',
      })

      setNavCollapsed(false)

      scrollDirection.current = null
      scrollDistance.current = 0

      return
    }


    platform.haptic('light')

    setPracticesSub(null)

    setTab(key)

    setNavCollapsed(false)

    lastScrollY.current = 0
    scrollDirection.current = null
    scrollDistance.current = 0


    window.scrollTo({
      top: 0,
      left: 0,
      behavior: 'instant',
    })
  }


  const openPractice =
    useCallback((sub) => {
      platform.haptic('light')

      setMentorPersonaOpen(false)

      setPracticesSub(
        sub || null
      )

      setTab('practices')

      setNavCollapsed(false)

      lastScrollY.current = 0
      scrollDirection.current = null
      scrollDistance.current = 0

      window.scrollTo({
        top: 0,
        left: 0,
      })
    }, [])


  const goMentor =
    useCallback(() => {
      platform.haptic('light')

      setMentorPersonaOpen(false)

      setTab('mentor')

      setNavCollapsed(false)

      lastScrollY.current = 0
      scrollDirection.current = null
      scrollDistance.current = 0

      window.scrollTo({
        top: 0,
        left: 0,
      })
    }, [])


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
          try {
            localStorage.setItem(
              ONBOARDED_KEY,
              '1'
            )
          } catch {}

          setOnboarded(true)
        }}
      />
    )
  }


  /* ============================================================
     WEB AUTH
     ============================================================ */

  if (
    !user &&
    platformName === 'web'
  ) {
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
        <WebAuthScreen
          onAuthed={setUser}
        />
      </div>
    )
  }


  /* ============================================================
     HEADER VISIBILITY
     ============================================================ */

  const showTodayHeader =
    !overlay &&
    tab === 'today'

  const topSafeArea =
    fullscreen
      ? 'calc(var(--app-safe-top) + 56px)'
      : 'var(--app-safe-top)'

  /*
   * На AI-персоне больше нет
   * нижнего navbar, поэтому не оставляем
   * под него искусственные 100px.
   */
  const contentBottomPadding =
    tab === 'mentor' &&
    mentorPersonaOpen
      ? 'var(--app-safe-bottom)'
      : 'calc(100px + var(--app-safe-bottom))'


  /* ============================================================
     UI
     ============================================================ */

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
      style={{
        paddingTop:
          topSafeArea,
        paddingRight:
          'var(--app-safe-right)',
        paddingLeft:
          'var(--app-safe-left)',
      }}
    >

      {/* ========================================================
          MENTALIX WORDMARK
          Только Сегодня.
         ======================================================== */}

      {fullscreen &&
        showTodayHeader && (
          <div
            className="
              fixed
              top-0
              left-0
              right-0
              z-40

              flex
              items-end
              justify-center

              pointer-events-none

              pb-2
            "
            style={{
              height:
                topSafeArea,
            }}
          >
            <span
              className="
                font-display
                text-[13px]
                tracking-[0.4em]
                text-cream/35
              "
            >
              MENTALIX
            </span>
          </div>
        )}


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
              pt-4
              pb-0

              flex
              items-center
              justify-between
            "
          >
            {/* Theme */}

            <button
              type="button"
              onClick={cycleTheme}
              aria-label="Переключить тему"
              className="
                w-10
                h-10

                rounded-full

                bg-emerald

                flex
                items-center
                justify-center

                text-cream/50
                text-base

                active:scale-95
              "
            >
              ◐
            </button>


            {/* Greeting */}

            <h1
              className="
                font-display
                text-xl
                text-cream
                lowercase
              "
            >
              {displayName(user)
                ? `${greeting().slice(
                    0,
                    -1
                  )}, ${displayName(
                    user
                  )}.`
                : greeting()}
            </h1>


            {/* Profile */}

            <button
              type="button"
              onClick={() => {
                platform.haptic(
                  'light'
                )

                setOverlay(
                  'profile'
                )
              }}
              aria-label="Профиль"
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
              "
            >
              <span
                className="
                  font-display
                  text-sm
                  text-cream/60
                "
              >
                {user?.first_name
                  ? user.first_name[0].toUpperCase()
                  : 'M'}
              </span>
            </button>
          </div>


          <p
            className="
              text-[11px]
              text-cream/30
              font-medium
              mb-1
            "
          >
            {tagline()}
          </p>
        </>
      )}


      {/* ========================================================
          CONTENT
         ======================================================== */}

      <div
  key={overlay || tab}
  className={[
    'flex-1 w-full flex flex-col items-center',
    mentorPersonaOpen
      ? ''
      : 'animate-fade-in',
  ].join(' ')}
        style={{
          paddingBottom:
            contentBottomPadding,
        }}
      >
        {!user && (
          <p
            className="
              text-cream/40
              text-sm
              px-6
              text-center
              pt-8
            "
          >
            Открой приложение через
            кнопку в боте, чтобы
            Менталикс увидел тебя
          </p>
        )}


        {/* Settings */}

        {overlay ===
          'settings' && (
          <Settings
            user={user}
            onBack={() => {
              setOverlay(
                'profile'
              )
            }}
            onNavigate={() => {}}
          />
        )}


        {/* Profile */}

        {overlay ===
          'profile' && (
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

                flex
                items-center
                justify-between
              "
            >
              <button
                type="button"
                onClick={() => {
                  platform.haptic(
                    'light'
                  )

                  setOverlay(null)
                }}
                aria-label="Назад"
                className="
                  w-10
                  h-10

                  rounded-full

                  bg-emerald

                  flex
                  items-center
                  justify-center

                  active:scale-95
                "
              >
                <ChevronLeft
                  size={20}
                  className="text-cream/60"
                />
              </button>


              <span
                className="
                  font-display
                  text-lg
                  text-cream
                  lowercase
                "
              >
                профиль.
              </span>


              <button
                type="button"
                onClick={() => {
                  platform.haptic(
                    'light'
                  )

                  setOverlay(
                    'settings'
                  )
                }}
                aria-label="Настройки"
                className="
                  w-10
                  h-10

                  rounded-full

                  bg-emerald

                  flex
                  items-center
                  justify-center

                  active:scale-95
                "
              >
                <SettingsIcon
                  size={18}
                  className="text-cream/60"
                />
              </button>
            </div>


            <Profile
              user={user}
            />
          </div>
        )}


        {/* ======================================================
            MAIN TABS
           ====================================================== */}

        {!overlay && (
          <>
            {user &&
              tab === 'today' && (
                <Today
                  user={user}
                  onOpenPractice={
                    openPractice
                  }
                  onGoMentor={
                    goMentor
                  }
                  onFlowChange={
                    setTodayFlowOpen
                  }
                />
              )}


            {user &&
              tab ===
                'practices' && (
                <Practices
                  user={user}
                  initialSub={
                    practicesSub
                  }
                  onGameChange={
                    setPracticeGameOpen
                  }
                />
              )}


            {user &&
              tab === 'mentor' && (
                <MentalixChat
                  user={user}
                  onPersonaChange={
                    setMentorPersonaOpen
                  }
                />
              )}


            {user &&
              tab === 'library' && (
                <Library
                  user={user}
                />
              )}


            {user &&
              tab === 'trends' && (
                <Analytics
                  user={user}
                  onGoCheckin={() => {
                    platform.haptic(
                      'light'
                    )

                    setMentorPersonaOpen(
                      false
                    )

                    setTab('today')

                    setPracticesSub(
                      null
                    )

                    setNavCollapsed(
                      false
                    )

                    resetNavigationGesture()

                    window.scrollTo({
                      top: 0,
                      left: 0,
                    })
                  }}
                />
              )}
          </>
        )}
      </div>


      {/* ========================================================
          COLLAPSIBLE NAVIGATION
         ======================================================== */}

      {user &&
        !overlay &&
        !bottomNavigationHidden && (
          <BottomNavigation
            tab={tab}
            collapsed={
              navCollapsed
            }
            onCollapseChange={
              setNavCollapsed
            }
            onTabChange={
              switchTab
            }
          />
        )}
    </div>
  )
}
