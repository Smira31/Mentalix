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

export default function BottomNavigation({ tab, collapsed, onCollapseChange, onTabChange }) {
  const demoMode = isPreviewDemoMode()

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

          backgroundColor: 'var(--mx-glass-bg)',

          borderColor: 'rgba(255, 255, 255, 0.08)',

          backdropFilter: 'blur(20px) saturate(160%)',
          WebkitBackdropFilter: 'blur(20px) saturate(160%)',

          boxShadow: 'var(--shadow-float)',
          transition: `width var(--mx-motion-slow) ${MOTION}, height var(--mx-motion-slow) ${MOTION}, border-radius var(--mx-motion-slow) ${MOTION}`,
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
            onCollapseChange(false)
          }}
          style={{
            opacity: collapsed ? 1 : 0,
            visibility: collapsed ? 'visible' : 'hidden',
            pointerEvents: collapsed ? 'auto' : 'none',
            transition: `opacity 180ms ${MOTION}, visibility 180ms ${MOTION}`,
          }}
        >
          <TabIcon item={TABS.find(item => item.key === tab) || TABS[0]} size={22} />
        </button>
      </div>
    </div>
  )
}
