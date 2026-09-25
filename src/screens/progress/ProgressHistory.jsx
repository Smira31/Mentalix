import { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { Filter, MoreHorizontal, Search } from 'lucide-react'

import { api } from '../../lib/api'
import { platform, platformName } from '../../platform'
import { useBackButton } from '../../platform/telegram.hooks'
import { readJournalHistory } from '../../lib/journalHistory'
import { moodPracticeDate } from '../../lib/moodPracticeLogic'
import { MENTOR_DRAFT_KEY, MENTOR_PERSONA_KEY, MENTOR_SAFETY_KEY } from '../mentalix/personas'
import MarkdownText from '../../components/MarkdownText'
import {
  buildEntriesByDay,
  entryListName,
  entryScreenTitle,
  formatDayLabel,
  formatEntryDateCaps,
  ENTRY_TYPES,
  HISTORY_GRANULARITIES,
  groupDaysByWeek,
  groupDaysByMonth,
  groupDaysByYear,
  getAvailableFilterTypes,
  filterDaysByTypes,
} from './progressHistoryUtils'
import HistoryFilterSheet from './HistoryFilterSheet'
import HistorySearchSheet from './HistorySearchSheet'
import './ProgressScreen.css'

const MOOD_WORDS = ['тяжко', 'так себе', 'нормально', 'хорошо', 'отлично']
const LESSON_LABELS = ['Что получилось?', 'Что было трудно?', 'Какой вывод забираешь?']
const ALTER_EGO_PREFIX = 'Был ли ты сегодня '
const CONTEXT_LABELS = {
  work: 'работа',
  home: 'дом',
  relationships: 'отношения',
  health: 'здоровье',
  study: 'учёба',
  other: 'другое',
}

function capitalize(s) {
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : s
}

function moodWord(level) {
  return capitalize(MOOD_WORDS[(level || 3) - 1])
}

function parseLessons(lessons) {
  if (!lessons) return []
  const lines = lessons.split('\n')
  const result = []
  let current = null
  for (const line of lines) {
    const label = LESSON_LABELS.find(l => line.startsWith(l + ' '))
    if (label) {
      if (current) result.push(current)
      current = { question: label, answer: line.slice(label.length + 1) }
    } else if (line.startsWith(ALTER_EGO_PREFIX)) {
      const qEnd = line.indexOf('? ')
      if (qEnd !== -1) {
        if (current) result.push(current)
        current = { question: line.slice(0, qEnd + 1), answer: line.slice(qEnd + 2) }
      } else if (current) {
        current.answer += '\n' + line
      }
    } else if (current) {
      current.answer += '\n' + line
    }
  }
  if (current) result.push(current)
  return result
}

function todayIso() {
  return new Date().toISOString().slice(0, 10)
}

/* ── Экран записи ── */

function EntryScreen({
  entry,
  onBack,
  onDelete,
  deleting,
  deleteError,
  canManageAiContext,
  onContextChange,
  savingContext,
  contextError,
  onDiscuss,
  onRedo,
  onRedoReview,
}) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [redoConfirm, setRedoConfirm] = useState(null)

  const isToday = entry.date === todayIso()
  const checkin = entry.checkin
  const canRedoMorning = isToday && onRedo && entry.type === ENTRY_TYPES.MORNING
  const canRedoEvening =
    isToday && onRedoReview && entry.type === ENTRY_TYPES.EVENING && checkin?.review_completed_at
  const canDelete = Boolean(checkin)

  useBackButton(() => {
    platform.haptic('light')
    onBack()
  })

  return (
    <div className="mx-progress-entry animate-fade-in" data-testid="progress-entry-screen">
      <div className="mx-progress-entry__top-bar">
        {platformName !== 'telegram' ? (
          <button
            type="button"
            className="mx-progress-entry__back"
            aria-label="Назад"
            onClick={onBack}
          >
            ‹
          </button>
        ) : (
          <span aria-hidden="true" />
        )}
        {(canRedoMorning || canRedoEvening || canDelete) && (
          <div style={{ position: 'relative' }}>
            <button
              type="button"
              className="mx-progress-entry__menu-button"
              aria-label="Действия с записью"
              data-testid="progress-entry-menu-button"
              onClick={() => setMenuOpen(open => !open)}
            >
              <MoreHorizontal size={20} aria-hidden="true" />
            </button>
            {menuOpen && (
              <div
                role="menu"
                className="mx-progress-entry__menu"
                data-testid="progress-entry-menu"
              >
                {canRedoMorning && (
                  <button
                    type="button"
                    role="menuitem"
                    className="mx-progress-entry__menu-item"
                    onClick={() => {
                      setMenuOpen(false)
                      setRedoConfirm('morning')
                    }}
                  >
                    Пройти утро заново
                  </button>
                )}
                {canRedoEvening && (
                  <button
                    type="button"
                    role="menuitem"
                    className="mx-progress-entry__menu-item"
                    onClick={() => {
                      setMenuOpen(false)
                      setRedoConfirm('evening')
                    }}
                  >
                    Пройти разбор заново
                  </button>
                )}
                {canDelete && (
                  <button
                    type="button"
                    role="menuitem"
                    className="mx-progress-entry__menu-item mx-progress-entry__menu-item--danger"
                    onClick={() => {
                      setMenuOpen(false)
                      onDelete()
                    }}
                  >
                    Удалить
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="mx-progress-entry__date" data-testid="progress-entry-date">
        {formatEntryDateCaps(entry.date, entry.time)}
      </div>
      <h2 className="mx-progress-entry__title" data-testid="progress-entry-title">
        {entryScreenTitle(entry.type)}
      </h2>

      <div className="mx-progress-entry__body">
        <EntryBody entry={entry} />
      </div>

      {/* AI-контекст — только для чек-инов */}
      {checkin && (
        <div className="mx-progress-entry__ai-section">
          <h3 className="mx-progress-entry__ai-title">Эта запись и AI</h3>
          <p className="mx-progress-entry__ai-desc">
            AI получает запись только после этого выбора и только при включённом персональном
            контексте в «Наставнике». Неотмеченные записи ему не передаются.
          </p>
          {canManageAiContext ? (
            <button
              type="button"
              role="switch"
              aria-checked={Boolean(checkin.ai_context_enabled)}
              aria-label="Разрешение AI использовать эту запись"
              onClick={() => onContextChange(!checkin.ai_context_enabled)}
              disabled={savingContext}
              className="mx-progress-entry__ai-toggle"
            >
              {savingContext
                ? 'Сохраняем…'
                : checkin.ai_context_enabled
                  ? 'AI может использовать запись — отключить'
                  : 'Разрешить AI использовать эту запись'}
            </button>
          ) : (
            <p className="mx-progress-entry__ai-hint">
              Выбор контекста доступен в Telegram Mini App с проверенной подписью.
            </p>
          )}
          {contextError && (
            <p role="alert" className="mx-progress-entry__error">
              {contextError}
            </p>
          )}
          {checkin.ai_context_enabled ? (
            <button
              type="button"
              onClick={onDiscuss}
              className="mx-progress-entry__ai-discuss"
            >
              Обсудить с AI
            </button>
          ) : (
            <p className="mx-progress-entry__ai-hint">
              Включи персональный контекст выше, чтобы обсудить эту запись с AI.
            </p>
          )}
          <p className="mx-progress-entry__delete-hint">
            Удаление необратимо: исчезнет только этот чек-ин и его личные теги. Активность
            ритуалов за день сохранится.
          </p>
          <button
            type="button"
            onClick={onDelete}
            disabled={deleting}
            className="mx-progress-entry__delete-button"
          >
            {deleting ? 'Удаляем…' : 'Удалить эту запись'}
          </button>
          {deleteError && (
            <p role="alert" className="mx-progress-entry__error">
              {deleteError}
            </p>
          )}
        </div>
      )}

      {redoConfirm && (
        <div
          role="dialog"
          aria-modal="true"
          className="mx-progress-entry__confirm-overlay"
          onClick={() => setRedoConfirm(null)}
        >
          <div
            className="mx-progress-entry__confirm-dialog"
            onClick={e => e.stopPropagation()}
          >
            <h2 className="mx-progress-entry__confirm-title">Пройти заново?</h2>
            <p className="mx-progress-entry__confirm-desc">Текущие ответы заменятся.</p>
            <div className="mx-progress-entry__confirm-buttons">
              <button
                type="button"
                autoFocus
                className="mx-progress-entry__confirm-cancel"
                onClick={() => setRedoConfirm(null)}
              >
                Отмена
              </button>
              <button
                type="button"
                className="mx-progress-entry__confirm-accept"
                onClick={() => {
                  const fn = redoConfirm === 'evening' ? onRedoReview : onRedo
                  setRedoConfirm(null)
                  fn?.()
                }}
              >
                Пройти заново
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

/* ── Тело записи — по типу ── */

function EntryBody({ entry }) {
  if (entry.type === ENTRY_TYPES.MORNING) return <MorningBody checkin={entry.checkin} />
  if (entry.type === ENTRY_TYPES.EVENING) return <EveningBody checkin={entry.checkin} />
  if (entry.type === ENTRY_TYPES.MOOD) return <MoodBody mp={entry.moodPractice} />
  if (entry.type === ENTRY_TYPES.JOURNAL) return <JournalBody entry={entry.journal} />
  return null
}

function MorningBody({ checkin }) {
  if (!checkin) return null
  const fields = [
    ['Как ты сейчас?', moodWord(checkin.mood)],
    checkin.energy != null ? ['Сколько в тебе энергии?', `${checkin.energy}/5`] : null,
    checkin.anxiety != null ? ['Сколько шума в голове?', `${checkin.anxiety}/5`] : null,
    checkin.focus != null ? ['Насколько ты собран?', `${checkin.focus}/5`] : null,
    checkin.emotion ? ['Что ты чувствуешь?', capitalize(checkin.emotion)] : null,
    checkin.note ? ['Что на уме?', checkin.note] : null,
  ].filter(Boolean)

  return (
    <>
      {fields.map(([question, answer]) => (
        <div className="mx-progress-entry__field" key={question}>
          <div className="mx-progress-entry__field-label">{question}</div>
          <div className="mx-progress-entry__field-value">{answer}</div>
        </div>
      ))}
    </>
  )
}

function EveningBody({ checkin }) {
  if (!checkin) return null
  const lessons = parseLessons(checkin.lessons)
  const wins = checkin.wins || []

  return (
    <>
      {lessons.map(({ question, answer }) => (
        <div className="mx-progress-entry__field" key={question}>
          <div className="mx-progress-entry__field-label">{question}</div>
          <MarkdownText
            content={answer}
            className="mx-progress-entry__field-value"
          />
        </div>
      ))}
      {wins.length > 0 && (
        <div className="mx-progress-entry__wins">
          <div className="mx-progress-entry__wins-label">Чем горжусь</div>
          <ul className="mx-progress-entry__wins-list">
            {wins.map((win, index) => (
              <li key={index} className="mx-progress-entry__win">
                <span className="mx-progress-entry__win-num">{index + 1}</span>
                <MarkdownText
                  content={win}
                  className="mx-progress-entry__field-value"
                />
              </li>
            ))}
          </ul>
        </div>
      )}
      {!lessons.length && wins.length === 0 && (
        <p className="mx-progress-entry__field-value">
          В этот день сохранено состояние и активность, но текстовой записи нет.
        </p>
      )}
    </>
  )
}

function MoodBody({ mp }) {
  if (!mp) return null
  const fields = [
    ['Настроение', moodWord(mp.mood)],
    mp.emotion ? ['Эмоция', capitalize(mp.emotion)] : null,
    mp.context ? ['Контекст', CONTEXT_LABELS[mp.context] || mp.context] : null,
    mp.note ? ['Заметка', mp.note] : null,
    mp.breathing_completed != null
      ? ['Дыхание', mp.breathing_completed ? 'завершено' : 'не выполнено']
      : null,
  ].filter(Boolean)

  return (
    <>
      {fields.map(([question, answer]) => (
        <div className="mx-progress-entry__field" key={question}>
          <div className="mx-progress-entry__field-label">{question}</div>
          <div className="mx-progress-entry__field-value">{answer}</div>
        </div>
      ))}
    </>
  )
}

function JournalBody({ entry }) {
  if (!entry?.phases?.length) return null
  return (
    <>
      {entry.phases.map(phase => (
        <div className="mx-progress-entry__field" key={phase.key}>
          <div className="mx-progress-entry__field-label">{phase.label}</div>
          <MarkdownText
            content={phase.text}
            className="mx-progress-entry__field-value"
          />
        </div>
      ))}
    </>
  )
}

/* ── Подкомпоненты группировки (§5.5, шаг 3) ── */

function PeriodCard({ rangeLabel, title, onClick, testId }) {
  return (
    <button
      type="button"
      className="mx-progress-history__period-card"
      data-testid={testId}
      onClick={onClick}
    >
      {rangeLabel && (
        <span className="mx-progress-history__period-card-range">{rangeLabel}</span>
      )}
      <span className="mx-progress-history__period-card-title">{title}</span>
    </button>
  )
}

function DayList({ days, onSelectEntry }) {
  return days.map(day => (
    <div className="mx-progress-history__group" key={day.date}>
      <div className="mx-progress-history__day-label">
        <span>{formatDayLabel(day.date)}</span>
        <span className="mx-progress-history__day-chevron" aria-hidden="true">›</span>
      </div>
      {day.entries.map((entry, index) => (
        <button
          type="button"
          key={`${entry.type}-${index}`}
          className="mx-progress-history__row"
          data-testid="progress-history-row"
          onClick={() => onSelectEntry(entry)}
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
  ))
}

function PeriodDetail({ label, days, onBack, onSelectEntry }) {
  useBackButton(() => {
    platform.haptic('light')
    onBack()
  }, true)

  return (
    <div className="mx-progress-history" data-testid="progress-period-detail">
      <div className="mx-progress-entry__top-bar">
        {platformName !== 'telegram' ? (
          <button
            type="button"
            className="mx-progress-entry__back"
            aria-label="Назад"
            data-testid="progress-period-back"
            onClick={onBack}
          >
            ‹
          </button>
        ) : (
          <span aria-hidden="true" />
        )}
        <span aria-hidden="true" />
      </div>
      <h2 className="mx-progress-history__title">{label.toLowerCase()}</h2>
      <DayList days={days} onSelectEntry={onSelectEntry} />
    </div>
  )
}

/* ── Главная компонента ── */

const GRANULARITY_KEY = 'mx-history-granularity'
const FILTER_KEY = 'mx-history-filter'

export default function ProgressHistory({ user, onGoCheckin, onRedo, onRedoReview }) {
  const [days, setDays] = useState(null)
  const [selectedEntry, setSelectedEntry] = useState(null)
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState('')
  const [savingContext, setSavingContext] = useState(false)
  const [contextError, setContextError] = useState('')

  // ── Шаг 3: группировка, фильтр, поиск ──
  const [granularity, setGranularity] = useState(() => {
    try {
      const saved = localStorage.getItem(GRANULARITY_KEY)
      return HISTORY_GRANULARITIES.some(g => g.id === saved) ? saved : 'day'
    } catch {
      return 'day'
    }
  })
  const [granularityMenuOpen, setGranularityMenuOpen] = useState(false)
  const [filterOpen, setFilterOpen] = useState(false)
  const [filterTypes, setFilterTypes] = useState(() => {
    try {
      const saved = localStorage.getItem(FILTER_KEY)
      return saved ? new Set(JSON.parse(saved)) : new Set()
    } catch {
      return new Set()
    }
  })
  const [searchOpen, setSearchOpen] = useState(false)
  const [selectedPeriod, setSelectedPeriod] = useState(null)
  const [portalTarget, setPortalTarget] = useState(null)

  const userId = user?.id
  const canManageAiContext = platformName === 'telegram' && Number(user?.id) > 0

  const journalEntries = useMemo(() => {
    if (!userId) return []
    try {
      return readJournalHistory(user.id)
    } catch {
      return []
    }
  }, [user, userId])

  // ── Портал кнопок в сегмент-бар ──
  useEffect(() => {
    const el = document.querySelector('.mx-progress-segment-bar')
    if (el) setPortalTarget(el)
  }, [])

  // ── Сохранение выбора в localStorage ──
  useEffect(() => {
    try { localStorage.setItem(GRANULARITY_KEY, granularity) } catch { /* приватный режим */ }
  }, [granularity])

  useEffect(() => {
    try { localStorage.setItem(FILTER_KEY, JSON.stringify([...filterTypes])) } catch { /* приватный режим */ }
  }, [filterTypes])

  // ── «Назад» для меню группировки ──
  useBackButton(() => {
    platform.haptic('light')
    setGranularityMenuOpen(false)
  }, granularityMenuOpen)

  useEffect(() => {
    if (!user) return
    const moodFrom = new Date()
    moodFrom.setDate(moodFrom.getDate() - 30)
    Promise.all([
      api.checkin.history(user.id, 30).catch(() => []),
      api.analytics.get(user.id, 30).catch(() => null),
      api.moodPractices
        .list(user.id, {
          from: moodFrom.toISOString().slice(0, 10),
          to: new Date().toISOString().slice(0, 10),
        })
        .catch(() => []),
    ]).then(([checkins, analytics, moodPractices]) => {
      setDays(
        buildEntriesByDay(checkins, moodPractices, journalEntries, analytics?.daily_activity || [])
      )
    })
  }, [user, journalEntries])

  async function deleteSelectedCheckin() {
    const checkin = selectedEntry?.checkin
    if (!checkin || deleting) return
    if (!window.confirm('Удалить эту сохранённую запись? Это действие нельзя отменить.')) return

    setDeleting(true)
    setDeleteError('')
    try {
      await api.privacy.deleteCheckin(user.id, checkin.id)
      setDays(current =>
        current
          .map(day =>
            day.date === selectedEntry.date
              ? { ...day, entries: day.entries.filter(e => e !== selectedEntry) }
              : day
          )
          .filter(day => day.entries.length > 0)
      )
      setSelectedEntry(null)
    } catch {
      setDeleteError('Не удалось удалить запись. Проверь соединение и попробуй ещё раз.')
    } finally {
      setDeleting(false)
    }
  }

  async function updateSelectedCheckinContext(nextEnabled) {
    const checkin = selectedEntry?.checkin
    if (!checkin || savingContext || !canManageAiContext) return
    if (
      nextEnabled &&
      !window.confirm(
        'Разрешить AI использовать текст и метрики этой записи в пределах персонального контекста? Неотмеченные записи передаваться не будут.'
      )
    )
      return

    setSavingContext(true)
    setContextError('')
    try {
      const result = await api.mentalix.setCheckinContext(user.id, checkin.id, nextEnabled)
      const enabled = Boolean(result?.enabled)
      // Обновляем запись в days и в selectedEntry
      setDays(current =>
        current.map(day => ({
          ...day,
          entries: day.entries.map(e =>
            e.checkin?.id === checkin.id
              ? { ...e, checkin: { ...e.checkin, ai_context_enabled: enabled } }
              : e
          ),
        }))
      )
      setSelectedEntry(current =>
        current?.checkin?.id === checkin.id
          ? { ...current, checkin: { ...current.checkin, ai_context_enabled: enabled } }
          : current
      )
    } catch {
      setContextError('Не удалось сохранить выбор. Запись не была подтверждена для AI.')
    } finally {
      setSavingContext(false)
    }
  }

  function discussSelectedCheckinWithAI() {
    const checkin = selectedEntry?.checkin
    if (!checkin?.ai_context_enabled) return

    const parts = []
    if (checkin.note) parts.push(checkin.note.trim())
    if (checkin.lessons) parts.push(checkin.lessons.trim())
    const text = parts.join('\n\n')
    if (!text) return

    platform.haptic('medium')

    try {
      sessionStorage.setItem(MENTOR_PERSONA_KEY, 'mayak')
      sessionStorage.setItem(
        MENTOR_DRAFT_KEY,
        ['Хочу обсудить одну свою запись.', text].join('\n\n')
      )
      sessionStorage.setItem(MENTOR_SAFETY_KEY, '1')
    } catch (error) {
      console.error(error)
    }

    const url = new URL(window.location.href)
    url.searchParams.set('tab', 'mentor')
    window.location.href = url.toString()
  }

  // ── Вычисляемые значения ──
  const availableTypes = useMemo(
    () => (days ? getAvailableFilterTypes(days) : new Set()),
    [days]
  )
  const filteredDays = useMemo(
    () => (days ? filterDaysByTypes(days, filterTypes) : days),
    [days, filterTypes]
  )
  const granLabel = HISTORY_GRANULARITIES.find(g => g.id === granularity)?.label || 'Дни'

  function selectGranularity(id) {
    platform.haptic('light')
    setGranularity(id)
    setGranularityMenuOpen(false)
    setSelectedPeriod(null)
  }

  function handleFilterClose(selectedTypes) {
    setFilterTypes(selectedTypes)
    setFilterOpen(false)
  }

  function handleSearchSelect(entry) {
    setSearchOpen(false)
    setSelectedEntry(entry)
  }

  function openPeriod(card) {
    platform.haptic('light')
    setSelectedPeriod(card)
  }

  // ── Портал кнопок в сегмент-бар ──
  const actionButtons = portalTarget && createPortal(
    <>
      <div className="mx-progress-history-actions" data-testid="history-action-buttons">
        <button
          type="button"
          className="mx-progress-grouping-pill"
          data-testid="history-grouping-pill"
          aria-expanded={granularityMenuOpen}
          aria-controls="history-grouping-menu"
          onClick={() => setGranularityMenuOpen(v => !v)}
        >
          <span>{granLabel}</span>
          <span className="mx-progress-grouping-pill__chevron" aria-hidden="true">⌄</span>
        </button>
        <button
          type="button"
          className="mx-progress-action-btn"
          data-testid="history-filter-btn"
          aria-label="Фильтры"
          onClick={() => { platform.haptic('light'); setFilterOpen(true) }}
        >
          <Filter size={20} aria-hidden="true" />
        </button>
        <button
          type="button"
          className="mx-progress-action-btn"
          data-testid="history-search-btn"
          aria-label="Поиск"
          onClick={() => { platform.haptic('light'); setSearchOpen(true) }}
        >
          <Search size={20} aria-hidden="true" />
        </button>
      </div>
      {granularityMenuOpen && (
        <div
          id="history-grouping-menu"
          className="mx-progress-grouping-menu"
          role="menu"
          aria-label="Группировка истории"
          data-testid="history-grouping-menu"
        >
          {HISTORY_GRANULARITIES.map(g => (
            <button
              key={g.id}
              type="button"
              className="mx-progress-grouping-menu__item"
              role="menuitemradio"
              aria-checked={granularity === g.id}
              data-testid={`history-grouping-${g.id}`}
              onClick={() => selectGranularity(g.id)}
            >
              {granularity === g.id && <span className="mx-progress-grouping-menu__check" aria-hidden="true">✓</span>}
              <span>{g.label}</span>
            </button>
          ))}
        </div>
      )}
    </>,
    portalTarget
  )

  /* ── Загрузка ── */
  if (days === null) {
    return (
      <div className="mx-progress-history">
        <h2 className="mx-progress-history__title">история.</h2>
        <p className="mx-progress-history__empty-subtitle">Загружаю записи…</p>
      </div>
    )
  }

  /* ── Лист фильтров ── */
  if (filterOpen) {
    return (
      <>
        {actionButtons}
        <HistoryFilterSheet
          availableTypes={availableTypes}
          initialSelected={filterTypes}
          onClose={handleFilterClose}
        />
      </>
    )
  }

  /* ── Лист поиска ── */
  if (searchOpen) {
    return (
      <>
        {actionButtons}
        <HistorySearchSheet
          days={days}
          onClose={() => setSearchOpen(false)}
          onSelectEntry={handleSearchSelect}
        />
      </>
    )
  }

  /* ── Экран записи ── */
  if (selectedEntry) {
    return (
      <>
        {actionButtons}
        <EntryScreen
          entry={selectedEntry}
          onBack={() => setSelectedEntry(null)}
          onDelete={deleteSelectedCheckin}
          deleting={deleting}
          deleteError={deleteError}
          canManageAiContext={canManageAiContext}
          onContextChange={updateSelectedCheckinContext}
          savingContext={savingContext}
          contextError={contextError}
          onDiscuss={discussSelectedCheckinWithAI}
          onRedo={onRedo}
          onRedoReview={onRedoReview}
        />
      </>
    )
  }

  /* ── Период (неделя/месяц/год) — записи периода ── */
  if (selectedPeriod) {
    return (
      <>
        {actionButtons}
        <PeriodDetail
          label={selectedPeriod.label || selectedPeriod.title || ''}
          days={selectedPeriod.days}
          onBack={() => setSelectedPeriod(null)}
          onSelectEntry={setSelectedEntry}
        />
      </>
    )
  }

  /* ── Пустое состояние ── */
  if (filteredDays.length === 0) {
    return (
      <>
        {actionButtons}
        <div className="mx-progress-history">
          <h2 className="mx-progress-history__title">история.</h2>
          <div className="mx-progress-history__empty">
            <div className="mx-progress-history__empty-title">
              {days.length === 0 ? 'Здесь появятся твои записи' : 'Ничего не найдено'}
            </div>
            <div className="mx-progress-history__empty-subtitle">
              {days.length === 0
                ? 'Пройди чек-ин или отметь настроение — и здесь появится первая запись.'
                : 'Измени фильтр, чтобы увидеть записи.'}
            </div>
            {days.length === 0 && onGoCheckin && (
              <button
                type="button"
                className="mx-progress-history__empty-button"
                onClick={onGoCheckin}
              >
                Пройти чек-ин
              </button>
            )}
          </div>
        </div>
      </>
    )
  }

  /* ── Список по группировке ── */
  return (
    <>
      {actionButtons}
      <div className="mx-progress-history" data-testid="progress-history-list">
        <h2 className="mx-progress-history__title">история.</h2>

        {granularity === 'day' && (
          <DayList days={filteredDays} onSelectEntry={setSelectedEntry} />
        )}

        {granularity === 'week' && groupDaysByWeek(filteredDays).map(group => (
          <div className="mx-progress-history__period-section" key={group.monthLabel}>
            <h3 className="mx-progress-history__period-header">{group.monthLabel}</h3>
            {group.cards.map(card => (
              <PeriodCard
                key={card.startDate}
                rangeLabel={card.rangeLabel}
                title={`Неделя ${card.weekNumber}`}
                testId="history-week-card"
                onClick={() => openPeriod(card)}
              />
            ))}
          </div>
        ))}

        {granularity === 'month' && groupDaysByMonth(filteredDays).map(group => (
          <div className="mx-progress-history__period-section" key={group.yearLabel}>
            <h3 className="mx-progress-history__period-header">{group.yearLabel}</h3>
            {group.cards.map(card => (
              <PeriodCard
                key={card.startDate}
                title={card.label}
                testId="history-month-card"
                onClick={() => openPeriod(card)}
              />
            ))}
          </div>
        ))}

        {granularity === 'year' && groupDaysByYear(filteredDays).map(card => (
          <PeriodCard
            key={card.startDate}
            title={card.label}
            testId="history-year-card"
            onClick={() => openPeriod(card)}
          />
        ))}
      </div>
    </>
  )
}
