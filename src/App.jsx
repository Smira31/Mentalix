import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react'

import {
  Settings as SettingsIcon,
} from 'lucide-react'

import { platform, platformName } from './platform'
import {
  paintChrome,
  lockVerticalSwipes,
  useSettingsButton,
} from './platform/telegram.hooks'

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
import BackButton from './components/BackButton'
import BottomNavigation from './components/BottomNavigation'
import { useSynced } from './lib/store'

import { initFullscreen } from './lib/tgFullscreen'


/* ============================================================
   STORAGE
   ============================================================ */

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


function applyDarkTheme() {
  // Снимаем legacy-класс и при HMR, и после старой открытой сессии.
  document.body.classList.remove('light')

  const background =
    getThemeBackground()

  if (background) {
    platform.setThemeColors?.(
      background
    )

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
    applyDarkTheme()
  }, [])


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
          setOnboardedFlag('1')
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

  /*
   * Вложенный экран Today — отдельный сценарий, и
   * приветствие с шестерёнкой там чужие. Today уже
   * сообщает об этом через onFlowChange; раньше флаг
   * гасил только нижнюю навигацию.
   */
  const showTodayHeader =
    !overlay &&
    tab === 'today' &&
    !todayFlowOpen

  const topSafeArea =
    fullscreen
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
   * На AI-персоне нижнего navbar нет,
   * поэтому не оставляем под него
   * искусственные 100px.
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
                text-cream/40
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
              pt-0
              pb-0

              flex
              items-center
              justify-between
            "
          >
            {/* Сохраняет приветствие по центру относительно аватара. */}
            <span className="w-10 h-10 shrink-0" aria-hidden="true" />


            {/* Greeting */}

            <h1
              className="
                font-display
                text-xl
                text-cream
                lowercase
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

                border
                border-cream/10

                flex
                items-center
                justify-center

                active:scale-95
              "
            >
              <SettingsIcon
                size={19}
                strokeWidth={1.7}
                className="text-cream/60"
              />
            </button>
          </div>


          <p
            className="
              text-[11px]
              text-faint
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
              setOverlay(null)
            }}
            onNavigate={(destination) => {
              if (destination === 'profile') {
                setOverlay('profile')
              }
            }}
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
                  text-lg
                  text-cream
                  lowercase
                "
              >
                профиль.
              </span>


              <span aria-hidden="true" />
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
