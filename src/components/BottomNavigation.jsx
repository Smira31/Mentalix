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
            : 'text-cream/55'
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
          : 'text-cream/55'
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


  /* ============================================================
     COLLAPSED

     Один кружок слева снизу,
     как в референсе.
     ============================================================ */

  if (collapsed) {
    return (
      <button
        type="button"
        aria-label="Открыть навигацию"
        onClick={() => {
          platform.haptic('light')
          onCollapseChange(false)
        }}
        className="
          fixed
          left-[24px]
          bottom-[calc(env(safe-area-inset-bottom)+18px)]
          z-50

          w-[58px]
          h-[58px]

          rounded-full

          flex
          items-center
          justify-center

          bg-[#3A3A3A]/90
          backdrop-blur-xl

          border
          border-white/[0.20]

          shadow-[0_6px_26px_rgba(0,0,0,0.45)]

          active:scale-95
          transition-all
          duration-300
        "
      >
        <TabIcon
          item={activeItem}
          active
          size={25}
        />
      </button>
    )
  }


  /* ============================================================
     EXPANDED
     ============================================================ */

  return (
    <nav
      className="
        fixed
        bottom-0
        left-0
        right-0
        z-50

        px-[16px]
        pb-[calc(env(safe-area-inset-bottom)+12px)]

        max-w-md
        mx-auto
        w-full

        transition-all
        duration-300
      "
    >
      <div
        className="
          h-[68px]

          flex
          items-center
          justify-around

          px-[6px]

          rounded-full

          border
          border-white/[0.16]

          bg-[#242424]/92
          backdrop-blur-xl

          shadow-[0_8px_32px_rgba(0,0,0,0.35)]
        "
      >
        {TABS.map((item) => {
          const active = tab === item.key

          return (
            <button
              key={item.key}
              type="button"
              aria-label={item.label}
              aria-current={
                active ? 'page' : undefined
              }
              onClick={() => {
                platform.haptic('light')
                onTabChange(item.key)
              }}
              className={[
                'h-[56px]',
                'flex-1',
                'rounded-full',
                'flex',
                'flex-col',
                'items-center',
                'justify-center',
                'gap-[2px]',
                'transition-all',
                'duration-300',
                'active:scale-95',
                active ? 'bg-white/[0.12]' : '',
              ].join(' ')}
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
                  active
                    ? 'text-cream'
                    : 'text-cream/50',
                ].join(' ')}
              >
                {item.label}
              </span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}