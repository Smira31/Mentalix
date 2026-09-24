import { BookOpen, ChartNoAxesColumn, Compass, House, Lightbulb } from 'lucide-react'

import { platform } from '../platform'
import { isPreviewDemoMode } from '../lib/demoMode'
import '../styles/demo-bottom-navigation.css'

// MXL-NAV-IA-001 (#514): целевой нижний tab bar «Сегодня · Шаги · Диалог ·
// Библиотека · Прогресс». Ключи вкладок не меняются — только пользовательские
// названия. Названия персон внутри «Диалога» (Наставник/Собеседник/Следопыт)
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

export default function BottomNavigation({ tab, collapsed, onCollapseChange, onTabChange }) {
  const activeItem = TABS.find(item => item.key === tab) || TABS[0]
  const demoMode = isPreviewDemoMode()

  return (
    /*
     * mx-auto здесь не украшение, а лечение конкретного бага.
     * У элемента заданы одновременно left, right и max-width —
     * для позиционированного бокса это переопределённая система.
     * CSS в таком случае оставляет left и игнорирует right, и на
     * широком экране (Telegram Desktop) панель прижималась к
     * левому нижнему углу. `margin-inline: auto` разрешает
     * конфликт в пользу центра.
     */
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
        ${demoMode && collapsed ? 'mx-demo-bottom-nav--collapsed' : ''}
      `}
      style={{
        left: 'max(var(--bottom-nav-edge), var(--app-safe-left))',
        right: 'max(var(--bottom-nav-edge), var(--app-safe-right))',
        // The panel itself sits directly above the system safe area. The
        // content reserve remains separate, so other screens keep their
        // existing clearance from the fixed navigation.
        bottom: 'calc(var(--app-safe-bottom) + var(--bottom-nav-offset))',
      }}
    >
      {/* ==========================================================
          ЕДИНЫЙ АНИМИРУЕМЫЙ КОНТЕЙНЕР

          Панель больше не исчезает из DOM.

          Expanded:
          почти вся ширина, 68px.

          Collapsed:
          58 × 58px.

          Благодаря этому браузер плавно
          интерполирует геометрию контейнера.
         ========================================================== */}

      <div
        className="
          relative

          overflow-hidden

          border
          backdrop-blur-xl

          pointer-events-auto

          will-change-[width,height,border-radius,transform]
        "
        style={{
          width: collapsed
            ? 'var(--bottom-nav-collapsed-size)'
            : 'calc(100vw - (2 * var(--bottom-nav-edge)))',

          maxWidth: collapsed ? 'var(--bottom-nav-collapsed-size)' : '400px',

          height: collapsed ? 'var(--bottom-nav-collapsed-size)' : 'var(--bottom-nav-height)',

          borderRadius: collapsed ? 'var(--mx-radius-pill)' : 'var(--mx-radius-pill)',

          /* Цвета берутся из системных токенов, а не задаются вручную. */
          backgroundColor: 'rgb(var(--c-nav))',

          borderColor: 'rgb(var(--c-nav-border))',

          boxShadow: collapsed ? 'var(--shadow-float-compact)' : 'var(--shadow-float)',

          transition: [
            `width var(--mx-motion-slow) ${MOTION}`,
            `max-width var(--mx-motion-slow) ${MOTION}`,
            `height var(--mx-motion-slow) ${MOTION}`,
            `border-radius var(--mx-motion-slow) ${MOTION}`,
            `background-color 420ms ${MOTION}`,
            `border-color 420ms ${MOTION}`,
            `box-shadow 420ms ${MOTION}`,
          ].join(', '),
        }}
      >
        {/* ========================================================
            ПОЛНАЯ НАВИГАЦИЯ

            Она всегда остаётся внутри контейнера.
            При сворачивании:
            - слегка уходит вниз;
            - уменьшается;
            - становится прозрачной;
            - перестаёт принимать нажатия.
           ======================================================== */}

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

            transform: collapsed
              ? 'translate3d(-8px, 5px, 0) scale(0.94)'
              : 'translate3d(0, 0, 0) scale(1)',

            pointerEvents: collapsed ? 'none' : 'auto',

            transition: [`opacity 220ms ${MOTION}`, `transform 420ms ${MOTION}`].join(', '),
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
                tabIndex={collapsed ? -1 : 0}
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

        {/* ========================================================
            COLLAPSED STATE

            Круглая кнопка тоже всегда существует.

            Пока navbar открыт:
            opacity 0 + scale.

            При схлопывании появляется внутри того же
            физического контейнера.
           ======================================================== */}

        <button
          type="button"
          aria-label="Открыть навигацию"
          aria-hidden={!collapsed}
          tabIndex={collapsed ? 0 : -1}
          onClick={() => {
            if (!collapsed) {
              return
            }

            platform.haptic('light')
            onCollapseChange(false)
          }}
          className="
            absolute
            inset-0

            rounded-full

            flex
            items-center
            justify-center

            origin-center
          "
          style={{
            width: 'var(--bottom-nav-collapsed-size)',

            height: 'var(--bottom-nav-collapsed-size)',

            opacity: collapsed ? 1 : 0,

            transform: collapsed
              ? 'translate3d(0, 0, 0) scale(1)'
              : 'translate3d(-5px, 0, 0) scale(0.72)',

            pointerEvents: collapsed ? 'auto' : 'none',

            transition: [
              `opacity 280ms ${MOTION} ${collapsed ? '100ms' : '0ms'}`,
              `transform 420ms ${MOTION}`,
            ].join(', '),
          }}
        >
          <span
            style={{
              transform: collapsed ? 'scale(1)' : 'scale(0.82)',

              transition: `transform 420ms ${MOTION}`,
            }}
          >
            <TabIcon item={activeItem} active size={25} />
          </span>
        </button>
      </div>
    </div>
  )
}
