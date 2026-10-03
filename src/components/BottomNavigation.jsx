import { forwardRef, useEffect, useImperativeHandle, useLayoutEffect, useRef, useState } from 'react'
import { BookOpen, ChartNoAxesColumn, Compass, House, Lightbulb } from 'lucide-react'

import { platform } from '../platform'
import { isPreviewDemoMode } from '../lib/demoMode'
import '../styles/demo-bottom-navigation.css'

// MXL-NAV-IA-001 (#514): целевой нижний tab bar «Сегодня · Шаги · Диалог ·
// Библиотека · Прогресс». Ключи вкладок не меняются — только пользовательские
// названия. Названия персон внутри «Диалога» (Наставник/Спутник/Наблюдатель)
// и заголовки экранов это переименование не трогает.
const TABS = [
  {
    key: 'today',
    label: 'Сегодня',
    icon: House,
  },
  {
    key: 'practices',
    label: 'Шаги',
    icon: Lightbulb,
  },
  {
    key: 'mentor',
    label: 'Диалог',
    icon: Compass,
  },
  {
    key: 'library',
    label: 'Библиотека',
    icon: BookOpen,
  },
  {
    key: 'trends',
    label: 'Прогресс',
    icon: ChartNoAxesColumn,
  },
]

const MOTION = 'cubic-bezier(0.22, 1, 0.36, 1)'

function TabIcon({ item, size = 21 }) {
  const Icon = item.icon

  return <Icon size={size} strokeWidth={1.5} className="mx-bottom-nav__icon" aria-hidden="true" />
}

const BottomNavigation = forwardRef(function BottomNavigation(
  { tab, onTabChange, scrollRootRef },
  ref
) {
  const demoMode = isPreviewDemoMode()

  /*
   * Сворачивание панели — только transform/opacity (width/height/border-radius
   * на iOS дают layout-thrash и джанк скролла). Пилюля всегда остаётся в
   * полном размере, а визуально сжимается scale() к круглой кнопке слева;
   * иконка восстановления компенсирует масштаб обратным scale().
   */
  const pillRef = useRef(null)
  const [collapseScale, setCollapseScale] = useState(null)

  /*
   * Состояние сворачивания живёт здесь, а не в App: скролл управляет панелью
   * напрямую, App и вкладки при жесте не ре-рендерятся. Потребители вне
   * панели (спейсер и пилюля «Прогресса») читают состояние через класс
   * mx-nav-collapsed на html — без единого setState в App.
   */
  const [collapsed, setCollapsed] = useState(false)
  const collapsedRef = useRef(false)
  const tabRef = useRef(tab)
  const scrollFrame = useRef(null)
  const lastScrollY = useRef(0)
  const scrollDirection = useRef(null)
  const scrollDistance = useRef(0)

  const applyCollapsed = (next) => {
    if (collapsedRef.current === next) return
    collapsedRef.current = next
    document.documentElement.classList.toggle('mx-nav-collapsed', next)
    setCollapsed(next)
  }

  useEffect(() => {
    tabRef.current = tab

    /* Смена вкладки — панель всегда раскрывается, жест начинается заново. */
    applyCollapsed(false)

    const root = scrollRootRef?.current
    lastScrollY.current = Math.max(root?.scrollTop || 0, window.scrollY || 0)
    scrollDirection.current = null
    scrollDistance.current = 0
  }, [tab, scrollRootRef])

  /*
   * App вызывает reset() после программного восстановления позиции скролла
   * (переключение вкладок): событие scroll придёт уже с новой позицией,
   * и ложное сворачивание исключено.
   */
  useImperativeHandle(ref, () => ({
    reset: () => {
      applyCollapsed(false)

      const root = scrollRootRef?.current
      lastScrollY.current = Math.max(root?.scrollTop || 0, window.scrollY || 0)
      scrollDirection.current = null
      scrollDistance.current = 0
    },
  }))

  /*
   * Скролл-логика сворачивания — та же, что раньше жила в App, но теперь она
   * меняет только состояние самой панели. Слушатели passive, обработчик
   * выровнен по requestAnimationFrame.
   */
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
       * «Шаги» — нижняя навигация не сворачивается: у Stoic
       * нет плавающей лампочки, и свёрнутая кнопка с иконкой
       * Lightbulb здесь лишняя. На остальных вкладках — как было.
       */
      if (tabRef.current === 'practices') {
        applyCollapsed(false)
        resetGesture()
        return
      }

      const currentY = Math.max(scrollRootRef?.current?.scrollTop || 0, window.scrollY || 0)

      const previousY = lastScrollY.current

      const difference = currentY - previousY

      lastScrollY.current = currentY

      /*
       * Наверху страницы navbar
       * всегда раскрыт.
       */
      if (currentY <= TOP_ZONE) {
        resetGesture()

        applyCollapsed(false)

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
        applyCollapsed(true)

        scrollDistance.current = 0

        return
      }

      /*
       * Раскрытие.
       */
      if (direction === 'up' && scrollDistance.current >= EXPAND_DISTANCE) {
        applyCollapsed(false)

        scrollDistance.current = 0
      }
    }

    const handleScroll = () => {
      if (scrollFrame.current !== null) {
        return
      }

      scrollFrame.current = window.requestAnimationFrame(processScroll)
    }

    lastScrollY.current = Math.max(scrollRootRef?.current?.scrollTop || 0, window.scrollY || 0)

    resetGesture()

    const scrollRoot = scrollRootRef?.current

    if (!scrollRoot) return undefined

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

      /* Панель уходит (оверлей) — класс состояния сбрасываем. */
      document.documentElement.classList.remove('mx-nav-collapsed')
    }
  }, [scrollRootRef])

  useLayoutEffect(() => {
    const el = pillRef.current
    if (!el) return undefined

    const update = () => {
      const width = el.offsetWidth
      const height = el.offsetHeight
      if (!width || !height) return
      const collapsedSize =
        parseFloat(getComputedStyle(el).getPropertyValue('--bottom-nav-collapsed-size')) || 50
      setCollapseScale({ x: collapsedSize / width, y: collapsedSize / height })
    }

    update()
    const observer = new ResizeObserver(update)
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return (
    /* При скролле панель остаётся доступной как кнопка текущей вкладки. */
    <div
      className={`
        fixed
        z-50

          w-full
          max-w-[440px]
          mx-auto

        pointer-events-none
        mx-bottom-nav
        ${demoMode ? 'mx-demo-bottom-nav' : ''}
        ${collapsed ? 'mx-demo-bottom-nav--collapsed' : ''}
      `}
      style={{
        left: 'max(var(--bottom-nav-edge), var(--app-safe-left))',
        right: 'max(var(--bottom-nav-edge), var(--app-safe-right))',
        bottom: 'calc(var(--app-safe-bottom) + var(--bottom-nav-offset))',
      }}
    >
      <div
        ref={pillRef}
        className="
          relative

          overflow-hidden

          border
          backdrop-blur-xl

          pointer-events-auto

          will-change-[transform]
        "
        style={{
          width: 'calc(100vw - (2 * var(--bottom-nav-edge)))',

          maxWidth: '400px',

          height: 'var(--bottom-nav-height)',

          borderRadius: 'var(--mx-radius-pill)',

          backgroundColor: 'var(--mx-nav-glass-bg, var(--mx-glass-bg))',

          borderColor: 'rgba(255, 255, 255, 0.08)',

          backdropFilter: 'blur(20px) saturate(160%)',
          WebkitBackdropFilter: 'blur(20px) saturate(160%)',

          boxShadow: 'var(--shadow-float)',
          transform:
            collapsed && collapseScale
              ? `scale(${collapseScale.x}, ${collapseScale.y})`
              : 'scale(1, 1)',
          transformOrigin: 'left center',
          pointerEvents: collapsed ? 'none' : 'auto',
          transition: `transform var(--mx-motion-slow) ${MOTION}`,
        }}
      >
        <nav
          aria-hidden={collapsed}
          className="
            absolute
            inset-0

            flex
            items-center
            justify-center

            px-0

            origin-left
          "
          style={{
            opacity: collapsed ? 0 : 1,
            visibility: collapsed ? 'hidden' : 'visible',
            pointerEvents: collapsed ? 'none' : 'auto',
            transition: `opacity 180ms ${MOTION}, visibility 180ms ${MOTION}`,
          }}
        >
          {TABS.map(item => {
            const active = tab === item.key

            return (
              <button
                key={item.key}
                type="button"
                aria-label={item.label}
                aria-current={active ? 'page' : undefined}
                tabIndex={0}
                onClick={() => {
                  platform.haptic('light')
                  onTabChange(item.key)
                }}
                className={[
                  'h-[47px]',
                  'flex-1',
                  'basis-0',
                  'min-w-0',
                  'rounded-[var(--mx-radius-pill)]',
                  'flex',
                  'flex-col',
                  'items-center',
                  'justify-center',
                  'gap-[2px]',
                  'active:scale-95',
                  item.key === 'library' ? 'mx-bottom-nav-library' : '',
                  active ? 'is-active' : '',
                ].join(' ')}
                style={{
                  transition: [
                    `background-color 260ms ${MOTION}`,
                    `transform 220ms ${MOTION}`,
                  ].join(', '),
                }}
              >
                <TabIcon item={item} size={22} />

                <span
                  className={[
                    'mx-type-tab',
                    'mt-[1px]',
                    'whitespace-nowrap',
                    'mx-bottom-nav__label',
                  ].join(' ')}
                >
                  {item.label}
                </span>
              </button>
            )
          })}
        </nav>
        <button
          type="button"
          className="mx-bottom-nav__restore"
          aria-label={`Открыть навигацию: ${TABS.find(item => item.key === tab)?.label || 'Сегодня'}`}
          tabIndex={collapsed ? 0 : -1}
          aria-hidden={!collapsed}
          onClick={() => {
            platform.haptic('light')
            applyCollapsed(false)
          }}
          style={{
            opacity: collapsed ? 1 : 0,
            visibility: collapsed ? 'visible' : 'hidden',
            pointerEvents: collapsed ? 'auto' : 'none',
            transform:
              collapsed && collapseScale
                ? `scale(${1 / collapseScale.x}, ${1 / collapseScale.y})`
                : 'scale(1, 1)',
            transition: `opacity 180ms ${MOTION}, visibility 180ms ${MOTION}, transform var(--mx-motion-slow) ${MOTION}`,
          }}
        >
          <TabIcon item={TABS.find(item => item.key === tab) || TABS[0]} size={22} />
        </button>
      </div>
    </div>
  )
})

export default BottomNavigation
