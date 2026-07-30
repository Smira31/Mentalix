import { useState } from 'react'
import { platform } from '../platform'
import Articles from './Articles'
import Courses from './Courses'

// Вкладка «Библиотека»: статьи (файл src/data/articles.js) и практикумы (бэкенд).
// Заголовок экрана живёт здесь, внутри Courses остаются свои подзаголовки.
//
// Раздел назывался «Курсы». Слово обещает инфопродукт и мешает
// тому, чем раздел является на самом деле: большими структурными
// материалами, которые нужно проходить, а не слушать.
//
// Раздел закрыт до готовности наполнения: вкладка видна, но не
// открывается. Компонент Courses и его данные остаются на месте —
// снять gating можно, убрав soon у вкладки.

const TABS = [
  { key: 'articles', label: 'Статьи' },
  { key: 'courses', label: 'Практикумы', soon: true },
]

export default function Library({ user }) {
  const [tab, setTab] = useState('articles')

  return (
    <div className="w-full max-w-md px-5">
      <h2 className="font-display text-[34px] text-cream lowercase mt-4 mb-5">библиотека.</h2>

      <div className="flex gap-1 p-1 rounded-full bg-emerald/60 mb-5">
        {TABS.map((t) => {
          const active = tab === t.key && !t.soon

          return (
            <button
              key={t.key}
              type="button"
              disabled={t.soon}
              aria-disabled={t.soon}
              onClick={() => {
                if (t.soon) return

                platform.haptic('light')
                setTab(t.key)
              }}
              className={`flex-1 rounded-full py-2.5 text-[13px] font-semibold transition-colors border-0 flex items-center justify-center gap-1.5 ${
                active
                  ? 'bg-gold text-emerald-deep'
                  : t.soon
                    ? 'text-cream/25 cursor-default'
                    : 'text-cream/50'
              }`}
            >
              {t.label}

              {t.soon && (
                <span className="text-[10px] font-bold uppercase tracking-wider text-cream/25">
                  скоро
                </span>
              )}
            </button>
          )
        })}
      </div>

      {tab === 'articles' ? <Articles /> : <Courses user={user} />}
    </div>
  )
}
