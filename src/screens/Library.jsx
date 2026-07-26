import { useState } from 'react'
import { platform } from '../platform'
import Articles from './Articles'
import Courses from './Courses'

// Вкладка «Библиотека»: статьи (файл src/data/articles.js) и курсы (бэкенд).
// Заголовок экрана живёт здесь, внутри Courses остаются свои подзаголовки.

const TABS = [
  { key: 'articles', label: 'Статьи' },
  { key: 'courses', label: 'Курсы' },
]

export default function Library({ user }) {
  const [tab, setTab] = useState('articles')

  return (
    <div className="w-full max-w-md px-5 pb-40">
      <h2 className="font-display text-[34px] text-cream lowercase mt-4 mb-5">библиотека.</h2>

      <div className="flex gap-1 p-1 rounded-full bg-emerald/60 mb-5">
        {TABS.map((t) => {
          const active = tab === t.key
          return (
            <button
              key={t.key}
              onClick={() => { platform.haptic('light'); setTab(t.key) }}
              className={`flex-1 rounded-full py-2.5 text-[13px] font-semibold transition-colors border-0 ${
                active ? 'bg-gold text-emerald-deep' : 'text-cream/50'
              }`}
            >
              {t.label}
            </button>
          )
        })}
      </div>

      {tab === 'articles' ? <Articles /> : <Courses user={user} />}
    </div>
  )
}
