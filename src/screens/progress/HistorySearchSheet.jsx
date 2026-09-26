/**
 * Лист поиска вкладки «История» (§5.5, шаг 3).
 *
 * Вкладка только «Твои записи». Пустое состояние «Что ищешь?» с чипами-
 * подсказками. Поле сверху с очисткой, ✕ закрывает.
 * Поиск по тексту записей на клиенте. Ничего не нашлось — пустое состояние.
 * Нативная «Назад» Telegram закрывает поиск.
 */
import { useMemo, useState } from 'react'
import { Search, X } from 'lucide-react'
import { useBackButton } from '../../platform/telegram.hooks'
import { platform } from '../../platform'
import {
  searchEntries,
  formatDayLabel,
  entryListName,
} from './progressHistoryUtils'
import './ProgressScreen.css'

const HINT_CHIPS = ['настроение', 'утро', 'вечер', 'дневник']

export default function HistorySearchSheet({ days, onClose, onSelectEntry }) {
  const [query, setQuery] = useState('')

  useBackButton(() => {
    platform.haptic('light')
    onClose()
  }, true)

  const results = useMemo(
    () => (query.trim() ? searchEntries(days, query) : []),
    [days, query]
  )

  const hasQuery = query.trim().length > 0
  const hasResults = results.length > 0

  function handleChip(text) {
    platform.haptic('light')
    setQuery(text)
  }

  function handleSelect(entry) {
    platform.haptic('light')
    onSelectEntry(entry)
  }

  return (
    <div
      className="mx-progress-search-sheet animate-fade-in"
      data-testid="history-search-sheet"
      role="dialog"
      aria-modal="true"
      aria-label="Поиск по записям"
    >
      <div className="mx-progress-search-sheet__tabs">
        <span className="mx-progress-search-sheet__tab mx-progress-search-sheet__tab--active">
          Твои записи
        </span>
        <button
          type="button"
          className="mx-progress-search-sheet__close"
          aria-label="Закрыть поиск"
          data-testid="history-search-close"
          onClick={() => {
            platform.haptic('light')
            onClose()
          }}
        >
          <X size={20} aria-hidden="true" />
        </button>
      </div>
      <div className="mx-progress-search-sheet__field-bar">
        <div className="mx-progress-search-sheet__field">
          <Search size={18} className="mx-progress-search-sheet__field-icon" aria-hidden="true" />
          <input
            type="search"
            className="mx-progress-search-sheet__field-input"
            placeholder="Поиск…"
            aria-label="Поиск по записям"
            value={query}
            onChange={e => setQuery(e.target.value)}
            data-testid="history-search-input"
            autoFocus
          />
          {query && (
            <button
              type="button"
              className="mx-progress-search-sheet__clear"
              aria-label="Очистить поиск"
              onClick={() => setQuery('')}
            >
              <X size={18} aria-hidden="true" />
            </button>
          )}
        </div>
      </div>

      <div className="mx-progress-search-sheet__body">
        {!hasQuery && (
          <div className="mx-progress-search-sheet__empty">
            <Search size={20} className="mx-progress-search-sheet__empty-icon" aria-hidden="true" />
            <div className="mx-progress-search-sheet__empty-title">Что ищешь?</div>
            <div className="mx-progress-search-sheet__empty-subtitle">
              Введи слово — найдём по тексту записей
            </div>
            <div className="mx-progress-search-sheet__chips">
              {HINT_CHIPS.map(chip => (
                <button
                  type="button"
                  key={chip}
                  className="mx-progress-search-sheet__chip"
                  data-testid={`history-search-chip-${chip}`}
                  onClick={() => handleChip(chip)}
                >
                  {chip}
                </button>
              ))}
            </div>
          </div>
        )}

        {hasQuery && !hasResults && (
          <div className="mx-progress-search-sheet__empty">
            <Search size={20} className="mx-progress-search-sheet__empty-icon" aria-hidden="true" />
            <div className="mx-progress-search-sheet__empty-title">Ничего не найдено</div>
            <div className="mx-progress-search-sheet__empty-subtitle">
              Попробуй другое слово
            </div>
          </div>
        )}

        {hasResults && (
          <div className="mx-progress-search-sheet__results" data-testid="history-search-results">
            {results.map(day => (
              <div className="mx-progress-history__group" key={day.date}>
                <div className="mx-progress-history__day-label">
                  <span>{formatDayLabel(day.date)}</span>
                </div>
                {day.entries.map((entry, index) => (
                  <button
                    type="button"
                    key={`${entry.type}-${index}`}
                    className="mx-progress-history__row"
                    data-testid="history-search-result-row"
                    onClick={() => handleSelect(entry)}
                  >
                    <span className="mx-progress-history__row-name">
                      {entryListName(entry.type)}
                    </span>
                    {entry.time && (
                      <span className="mx-progress-history__row-time">{entry.time}</span>
                    )}
                  </button>
                ))}
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  )
}
