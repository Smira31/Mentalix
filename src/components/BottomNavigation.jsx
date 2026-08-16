import {
  AlignJustify,
  House,
  Sparkles,
  BookOpen,
} from 'lucide-react'

import MazeLogo from './MazeLogo'
import { platform } from '../platform'


const TABS = [
  {
    key: 'today',
    label: 'Сегодня',
    icon: House,
  },
  {
    key: 'practices',
    label: 'Практики',
    icon: Sparkles,
  },
  {
    key: 'mentor',
    label: 'Наставник',
    icon: 'monogram',
  },
  {
    key: 'library',
    label: 'Библиотека',
    icon: BookOpen,
  },
  {
    key: 'trends',
    label: 'Тренды',
    icon: AlignJustify,
  },
]


const MOTION =
  'cubic-bezier(0.22, 1, 0.36, 1)'


function TabIcon({
  item,
  active,
  size = 21,
}) {
  if (item.icon === 'monogram') {
    return (
      <MazeLogo
        size={size}
        progress={1}
        showDot={false}
        baseClass="text-transparent"
        trailClass={
          active
            ? 'text-gold'
            : 'text-muted'
        }
      />
    )
  }

  const Icon = item.icon

  return (
    <Icon
      size={size}
      strokeWidth={1.9}
      className={
        active
          ? 'text-cream'
          : 'text-muted'
      }
    />
  )
}


export default function BottomNavigation({
  tab,
  collapsed,
  onCollapseChange,
  onTabChange,
}) {
  const activeItem =
    TABS.find((item) => item.key === tab) ||
    TABS[0]


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
      className="
        fixed
        z-50

        max-w-[416px]
        mx-auto

        pointer-events-none
      "
      style={{
        left:
          'max(24px, var(--app-safe-left))',
        right:
          'max(16px, var(--app-safe-right))',
        bottom:
          'calc(var(--app-safe-bottom) + 12px)',
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
            ? '58px'
            : 'calc(100vw - 40px)',

          maxWidth: collapsed
            ? '58px'
            : '400px',

          height: collapsed
            ? '58px'
            : '68px',

          borderRadius: collapsed
            ? '9999px'
            : '34px',

          /* Цвета берутся из системных токенов, а не задаются вручную. */
          backgroundColor: collapsed
            ? 'rgb(var(--c-card2) / 0.90)'
            : 'rgb(var(--c-card2) / 0.92)',

          borderColor: collapsed
            ? 'rgb(var(--c-border) / 0.9)'
            : 'rgb(var(--c-border) / 0.75)',

          boxShadow: collapsed
            ? 'var(--shadow-float-compact)'
            : 'var(--shadow-float)',

          transition: [
            `width 420ms ${MOTION}`,
            `max-width 420ms ${MOTION}`,
            `height 420ms ${MOTION}`,
            `border-radius 420ms ${MOTION}`,
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

            px-[6px]

            origin-left
          "
          style={{
            opacity: collapsed ? 0 : 1,

            transform: collapsed
              ? 'translate3d(-8px, 5px, 0) scale(0.94)'
              : 'translate3d(0, 0, 0) scale(1)',

            pointerEvents: collapsed
              ? 'none'
              : 'auto',

            transition: [
              `opacity 220ms ${MOTION}`,
              `transform 420ms ${MOTION}`,
            ].join(', '),
          }}
        >
          {TABS.map((item) => {
            const active = tab === item.key

            return (
              <button
                key={item.key}
                type="button"
                aria-label={item.label}
                aria-current={
                  active
                    ? 'page'
                    : undefined
                }
                tabIndex={
                  collapsed ? -1 : 0
                }
                onClick={() => {
                  platform.haptic('light')
                  onTabChange(item.key)
                }}
                className={[
                  'h-[56px]',
                  'flex-1',
                  'min-w-0',
                  'rounded-full',
                  'flex',
                  'flex-col',
                  'items-center',
                  'justify-center',
                  'gap-[2px]',
                  'active:scale-95',
                  active
                    ? 'bg-cream/[0.12]'
                    : '',
                ].join(' ')}
                style={{
                  transition: [
                    `background-color 260ms ${MOTION}`,
                    `transform 220ms ${MOTION}`,
                  ].join(', '),
                }}
              >
                <TabIcon
                  item={item}
                  active={active}
                  size={21}
                />

                <span
                  className={[
                    'text-[10px]',
                    'font-semibold',
                    'whitespace-nowrap',
                    active
                      ? 'text-cream'
                      : 'text-muted',
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

            w-[58px]
            h-[58px]

            rounded-full

            flex
            items-center
            justify-center

            origin-center
          "
          style={{
            opacity: collapsed ? 1 : 0,

            transform: collapsed
              ? 'translate3d(0, 0, 0) scale(1)'
              : 'translate3d(-5px, 0, 0) scale(0.72)',

            pointerEvents: collapsed
              ? 'auto'
              : 'none',

            transition: [
              `opacity 280ms ${MOTION} ${
                collapsed ? '100ms' : '0ms'
              }`,
              `transform 420ms ${MOTION}`,
            ].join(', '),
          }}
        >
          <span
            style={{
              transform: collapsed
                ? 'scale(1)'
                : 'scale(0.82)',

              transition:
                `transform 420ms ${MOTION}`,
            }}
          >
            <TabIcon
              item={activeItem}
              active
              size={25}
            />
          </span>
        </button>
      </div>
    </div>
  )
}
