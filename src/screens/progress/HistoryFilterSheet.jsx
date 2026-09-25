/**
 * Лист фильтров вкладки «История» (§5.5, шаг 3).
 *
 * Полноэкранный лист поверх экрана, нижняя навигация скрыта.
 * Группы «Чек-ины» и «Практики» — только существующие типы записей.
 * Мультивыбор, закрытие ✕ применяет фильтр.
 * Нативная «Назад» Telegram закрывает лист (с применением).
 */
import { useState } from 'react'
import { useBackButton } from '../../platform/telegram.hooks'
import { platform } from '../../platform'
import { FILTER_GROUPS } from './progressHistoryUtils'
import './ProgressScreen.css'

export default function HistoryFilterSheet({ availableTypes, initialSelected, onClose }) {
  const [selected, setSelected] = useState(() => new Set(initialSelected || []))

  useBackButton(() => {
    platform.haptic('light')
    onClose(selected)
  }, true)

  function toggle(typeId) {
    platform.haptic('light')
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(typeId)) next.delete(typeId)
      else next.add(typeId)
      return next
    })
  }

  function handleClose() {
    platform.haptic('light')
    onClose(selected)
  }

  return (
    <div
      className="mx-progress-filter-sheet animate-fade-in"
      data-testid="history-filter-sheet"
      role="dialog"
      aria-modal="true"
      aria-label="Фильтры истории"
    >
      <button
        type="button"
        className="mx-progress-filter-sheet__close"
        aria-label="Применить и закрыть фильтры"
        data-testid="history-filter-close"
        onClick={handleClose}
      >
        ✕
      </button>
      <h2 className="mx-progress-filter-sheet__title">фильтры.</h2>
      <div className="mx-progress-filter-sheet__content">
        {FILTER_GROUPS.map(group => {
          const visibleTypes = group.types.filter(t => availableTypes.has(t.id))
          if (visibleTypes.length === 0) return null
          return (
            <div className="mx-progress-filter-sheet__group" key={group.label}>
              <div className="mx-progress-filter-sheet__group-label">{group.label}</div>
              {visibleTypes.map(t => {
                const isOn = selected.has(t.id)
                return (
                  <button
                    type="button"
                    key={t.id}
                    className="mx-progress-filter-sheet__row"
                    data-testid={`history-filter-row-${t.id}`}
                    aria-pressed={isOn}
                    onClick={() => toggle(t.id)}
                  >
                    <span className="mx-progress-filter-sheet__row-text">{t.label}</span>
                    <span
                      className={`mx-progress-filter-sheet__check${isOn ? ' mx-progress-filter-sheet__check--on' : ''}`}
                      aria-hidden="true"
                    >
                      {isOn && '✓'}
                    </span>
                  </button>
                )
              })}
            </div>
          )
        })}
      </div>
    </div>
  )
}
