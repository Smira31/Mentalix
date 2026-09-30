import { useState } from 'react'
import { ChevronRight, Shuffle } from 'lucide-react'

import './ThemeDirectory.css'

const FILTERS = ['Все', 'Пройдены', 'В процессе', 'Не начаты']

function status(theme) {
  const done = theme.reflected_days || 0
  const total = theme.total_days || 0
  if (total > 0 && done >= total) return 'Пройдены'
  return done > 0 ? 'В процессе' : 'Не начаты'
}

function ThemeRows({ themes, onOpen }) {
  return (
    <div className="mx-theme-directory__rows">
      {themes.map(theme => {
        const total = theme.total_days || 0
        const progress = total ? Math.round(((theme.reflected_days || 0) / total) * 100) : 0
        return (
          <button
            type="button"
            className="mx-theme-directory__row"
            key={theme.id}
            onClick={() => onOpen(theme.id)}
          >
            <span className="mx-theme-directory__info">
              <strong>{theme.title}.</strong>
              {theme.subtitle && <small>{theme.subtitle}</small>}
            </span>
            <span className="mx-theme-directory__bottom">
              <span className="mx-theme-directory__progress" aria-label={`Пройдено ${progress}%`}>
                <span style={{ width: `${progress}%` }} />
              </span>
              <ChevronRight size={18} aria-hidden="true" />
            </span>
          </button>
        )
      })}
    </div>
  )
}

export default function ThemeDirectory({ themes, currentId, onOpen }) {
  const [filter, setFilter] = useState('Все')
  const others = themes.filter(theme => theme.id !== currentId)
  const unfinished = others.filter(theme => status(theme) !== 'Пройдены')
  const filtered = filter === 'Все' ? themes : themes.filter(theme => status(theme) === filter)

  if (themes.length <= 1) return null

  return (
    <div className="mx-theme-directory">
      {others.length > 0 && (
        <section aria-labelledby="carousel-other-themes">
          <h3 id="carousel-other-themes">Другие темы</h3>
          <ThemeRows themes={others} onOpen={onOpen} />
        </section>
      )}
      <div className="mx-theme-directory__sticky-bar">
        {unfinished.length > 0 && (
          <button
            type="button"
            className="mx-theme-directory__surprise"
            onClick={() => onOpen(unfinished[Math.floor(Math.random() * unfinished.length)].id)}
          >
            <Shuffle size={15} aria-hidden="true" /> Удиви меня
          </button>
        )}
        <section aria-labelledby="carousel-all-themes">
          <h3 id="carousel-all-themes">Все темы</h3>
          <div className="mx-theme-directory__filters" role="tablist" aria-label="Фильтр тем">
            {FILTERS.map(item => (
              <button
                type="button"
                role="tab"
                aria-selected={filter === item}
                key={item}
                onClick={() => setFilter(item)}
              >
                {item}
              </button>
            ))}
          </div>
        </section>
      </div>
      {filtered.length ? (
        <ThemeRows themes={filtered} onOpen={onOpen} />
      ) : (
        <p className="text-muted text-[13px]">Здесь пока пусто</p>
      )}
    </div>
  )
}
