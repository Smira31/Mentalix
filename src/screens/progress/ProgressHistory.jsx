import { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { MoreHorizontal, RotateCcw, Search, Sparkles, Trash2 } from 'lucide-react'

/** Иконка фильтра — три горизонтальные линии убывающей длины (как Stoic). */
function FilterIcon({ size = 20, ...rest }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      aria-hidden="true"
      {...rest}
    >
      <line x1="3" y1="6" x2="17" y2="6" />
      <line x1="3" y1="10" x2="13" y2="10" />
      <line x1="3" y1="14" x2="9" y2="14" />
    </svg>
  )
}

import { api } from '../../lib/api'
import { platform, platformName } from '../../platform'
import ScreenBack from '../../components/ScreenBack'
import { useBackButton } from '../../platform/telegram.hooks'
import { readJournalHistory } from '../../lib/journalHistory'
import { moodPracticeDate } from '../../lib/moodPracticeLogic'
import { getDailyThoughtForDate } from '../../data/dailyThoughts'
import { THOUGHT_KIND, loadDailyItems, readCachedDailyItems } from '../../lib/dailyThoughtStorage'
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
import { ProgressGlassMenu, ProgressGlassMenuItem } from '../../components/ProgressGlassMenu'
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
  return s
    ? s
        .split(',')
        .map(part => part.trim())
        .map(part => (part ? part.charAt(0).toUpperCase() + part.slice(1) : part))
        .join(', ')
    : s
}

function moodWord(level) {
  return capitalize(MOOD_WORDS[(level || 3) - 1])
}

function moodColor(level) {
  if (!level) return 'rgb(var(--c-card3, 46 46 46))'
  const palette = ['#6A6A6A', '#8A8A8A', '#B0B0B0', '#D0D0D0', '#E6E6E6']
  return palette[Math.min(Math.max(level, 1), 5) - 1]
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
  const [deleteConfirm, setDeleteConfirm] = useState(false)
  const [aiSheetOpen, setAiSheetOpen] = useState(false)

  useBackButton(() => {
    setAiSheetOpen(false)
  }, aiSheetOpen)

  const isToday = entry.date === todayIso()
  const checkin = entry.checkin
  const canRedoMorning = isToday && onRedo && entry.type === ENTRY_TYPES.MORNING
  const canRedoEvening =
    isToday && onRedoReview && entry.type === ENTRY_TYPES.EVENING && checkin?.review_completed_at
  const canDelete = Boolean(checkin)

  return (
    <div className="mx-progress-entry animate-fade-in" data-testid="progress-entry-screen">
      <div className="mx-progress-entry__top-row">
        <ScreenBack onBack={onBack} className="mx-progress-entry__back" />
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
              <>
                <div
                  className="mx-progress-menu-overlay"
                  onClick={() => setMenuOpen(false)}
                  aria-hidden="true"
                />
                <ProgressGlassMenu
                  role="menu"
                  data-testid="progress-entry-menu"
                  style={{ position: 'absolute', right: 0, top: '100%' }}
                >
                  {checkin && (
                    <ProgressGlassMenuItem
                      icon={Sparkles}
                      label="AI и эта запись"
                      onClick={() => {
                        setMenuOpen(false)
                        setAiSheetOpen(true)
                      }}
                    />
                  )}
                  {canRedoMorning && (
                    <ProgressGlassMenuItem
                      icon={RotateCcw}
                      label="Пройти заново"
                      onClick={() => {
                        setMenuOpen(false)
                        setRedoConfirm('morning')
                      }}
                    />
                  )}
                  {canRedoEvening && (
                    <ProgressGlassMenuItem
                      icon={RotateCcw}
                      label="Пройти заново"
                      onClick={() => {
                        setMenuOpen(false)
                        setRedoConfirm('evening')
                      }}
                    />
                  )}
                  {canDelete && (
                    <ProgressGlassMenuItem
                      icon={Trash2}
                      label="Удалить"
                      danger
                      onClick={() => {
                        setMenuOpen(false)
                        setDeleteConfirm(true)
                      }}
                    />
                  )}
                </ProgressGlassMenu>
              </>
            )}
          </div>
        )}
      </div>

      <div>
        <div className="mx-progress-entry__date" data-testid="progress-entry-date">
          {formatEntryDateCaps(entry.date, entry.time)}
        </div>
        <h2 className="mx-progress-entry__title" data-testid="progress-entry-title">
          {entryScreenTitle(entry.type)}
        </h2>
      </div>

      <div className="mx-progress-entry__body">
        <EntryBody entry={entry} />
      </div>

      {/* AI-лист — открывается из меню «…» */}
      {aiSheetOpen && checkin && (
        <div className="mx-progress-ai-sheet" data-testid="progress-ai-sheet">
          <button
            type="button"
            className="mx-progress-ai-sheet__close"
            aria-label="Закрыть"
            data-testid="progress-ai-sheet-close"
            onClick={() => setAiSheetOpen(false)}
          >
            ✕
          </button>
          <h2 className="mx-progress-ai-sheet__title">AI и эта запись</h2>
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
            <button type="button" onClick={onDiscuss} className="mx-progress-entry__ai-discuss">
              Обсудить с AI
            </button>
          ) : (
            <p className="mx-progress-entry__ai-hint">
              Включи персональный контекст выше, чтобы обсудить эту запись с AI.
            </p>
          )}
        </div>
      )}

      {deleteConfirm && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-confirm-title"
          aria-describedby="delete-confirm-desc"
          className="mx-progress-entry__confirm-overlay"
          onClick={() => !deleting && setDeleteConfirm(false)}
        >
          <div className="mx-progress-entry__confirm-dialog" onClick={e => e.stopPropagation()}>
            <h2 id="delete-confirm-title" className="mx-progress-entry__confirm-title">
              Удалить запись?
            </h2>
            <p id="delete-confirm-desc" className="mx-progress-entry__confirm-desc">
              Это действие необратимо: запись исчезнет навсегда.
            </p>
            <div className="mx-progress-entry__confirm-buttons">
              <button
                type="button"
                autoFocus
                className="mx-progress-entry__confirm-cancel"
                onClick={() => setDeleteConfirm(false)}
                disabled={deleting}
              >
                Отмена
              </button>
              <button
                type="button"
                className="mx-progress-entry__confirm-accept mx-progress-entry__confirm-accept--danger"
                onClick={() => {
                  setDeleteConfirm(false)
                  onDelete()
                }}
                disabled={deleting}
              >
                {deleting ? 'Удаляем…' : 'Удалить'}
              </button>
            </div>
            {deleteError && (
              <p role="alert" className="mx-progress-entry__error">
                {deleteError}
              </p>
            )}
          </div>
        </div>
      )}

      {redoConfirm && (
        <div
          role="dialog"
          aria-modal="true"
          className="mx-progress-entry__confirm-overlay"
          onClick={() => setRedoConfirm(null)}
        >
          <div className="mx-progress-entry__confirm-dialog" onClick={e => e.stopPropagation()}>
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
  if (entry.type === ENTRY_TYPES.THOUGHT) return <ThoughtBody entry={entry} />
  return null
}

/* Своя мысль дня: текст курсивом и цитата дня мелко. */
function ThoughtBody({ entry }) {
  const quote = getDailyThoughtForDate(entry.date)
  if (!entry.thought?.text && !quote?.text) return null
  return (
    <>
      <div className="mx-progress-entry__field">
        <div className="mx-progress-entry__field-label">Моя мысль</div>
        <p className="mx-progress-history__thought-text">{entry.thought?.text}</p>
      </div>
      {quote?.text && (
        <div className="mx-progress-entry__field">
          <div className="mx-progress-entry__field-label">Цитата дня</div>
          <p className="mx-progress-history__thought-quote">{quote.text}</p>
        </div>
      )}
    </>
  )
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
          <MarkdownText content={answer} className="mx-progress-entry__field-value" />
        </div>
      ))}
      {wins.length > 0 && (
        <div className="mx-progress-entry__wins">
          <div className="mx-progress-entry__wins-label">Чем горжусь</div>
          <ul className="mx-progress-entry__wins-list">
            {wins.map((win, index) => (
              <li key={index} className="mx-progress-entry__win">
                <span className="mx-progress-entry__win-num">{index + 1}</span>
                <MarkdownText content={win} className="mx-progress-entry__field-value" />
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
          <MarkdownText content={phase.text} className="mx-progress-entry__field-value" />
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
      {rangeLabel && <span className="mx-progress-history__period-card-range">{rangeLabel}</span>}
      <span className="mx-progress-history__period-card-title">{title}</span>
    </button>
  )
}

function entryMoodDot(entry) {
  if (entry.checkin?.mood != null) return entry.checkin.mood
  if (entry.moodPractice?.mood != null) return entry.moodPractice.mood
  return null
}

function entryPreview(entry) {
  if (entry.type === ENTRY_TYPES.JOURNAL && entry.journal?.phases?.length) {
    const phase = entry.journal.phases[0]
    return (
      <div className="mx-progress-history__row-preview-text">
        <span className="mx-progress-history__row-preview-q">{phase.label}</span>
        <span className="mx-progress-history__row-preview-a">{phase.text}</span>
      </div>
    )
  }
  if (entry.type === ENTRY_TYPES.THOUGHT) {
    const quote = getDailyThoughtForDate(entry.date)
    return (
      <div className="mx-progress-history__row-preview-text">
        <span className="mx-progress-history__thought-text">{entry.thought?.text}</span>
        {quote?.text && <span className="mx-progress-history__thought-quote">{quote.text}</span>}
      </div>
    )
  }
  return null
}

function DayList({ days, onSelectEntry }) {
  return days.map(day => (
    <div className="mx-progress-history__group" key={day.date}>
      <div className="mx-progress-history__day-label">
        <span>{formatDayLabel(day.date)}</span>
        <span className="mx-progress-history__day-chevron" aria-hidden="true">
          ›
        </span>
      </div>
      {day.entries.map((entry, index) => {
        const preview = entryPreview(entry)
        const moodLevel = entryMoodDot(entry)
        return (
          <button
            type="button"
            key={`${entry.type}-${index}`}
            className="mx-progress-history__row"
            data-testid="progress-history-row"
            onClick={() => onSelectEntry(entry)}
          >
            <div className="mx-progress-history__row-top">
              <span className="mx-progress-history__row-name">{entryListName(entry.type)}</span>
              <span className="mx-progress-history__row-right">
                {moodLevel != null && (
                  <span
                    className="mx-progress-history__row-mood-dot"
                    style={{ background: moodColor(moodLevel) }}
                    aria-hidden="true"
                  />
                )}
                {entry.time && <span className="mx-progress-history__row-time">{entry.time}</span>}
              </span>
            </div>
            {preview && <div className="mx-progress-history__row-preview">{preview}</div>}
          </button>
        )
      })}
    </div>
  ))
}

function PeriodDetail({ label, days, onBack, onSelectEntry }) {
  return (
    <div className="mx-progress-history" data-testid="progress-period-detail">
      <div className="mx-progress-entry__top-bar">
        <ScreenBack onBack={onBack} testId="progress-period-back" />
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

export default function ProgressHistory({
  user,
  onGoCheckin,
  onRedo,
  onRedoReview,
  reloadKey = 0,
}) {
  const [days, setDays] = useState(null)
  const [loadError, setLoadError] = useState(false)
  const [retryKey, setRetryKey] = useState(0)
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

  /*
   * Свои мысли дня («Мысль дня» → записи /quotes с tag thought:YYYY-MM-DD).
   * Сначала кэш, следом сервер — как на самом экране «Мысль дня».
   */
  const [thoughtItems, setThoughtItems] = useState(() =>
    userId ? readCachedDailyItems(user.id) : []
  )

  const thoughts = useMemo(
    () => thoughtItems.filter(item => item.kind === THOUGHT_KIND),
    [thoughtItems]
  )

  useEffect(() => {
    if (!userId) return

    let alive = true
    loadDailyItems(user.id)
      .then(next => {
        if (alive) setThoughtItems(next)
      })
      .catch(() => {})

    return () => {
      alive = false
    }
  }, [user, userId])

  // ── Портал кнопок в сегмент-бар ──
  useEffect(() => {
    const el = document.querySelector('.mx-progress-actions-row')
    if (el) setPortalTarget(el)
  }, [])

  // ── Сохранение выбора в localStorage ──
  useEffect(() => {
    try {
      localStorage.setItem(GRANULARITY_KEY, granularity)
    } catch {
      /* приватный режим */
    }
  }, [granularity])

  useEffect(() => {
    try {
      localStorage.setItem(FILTER_KEY, JSON.stringify([...filterTypes]))
    } catch {
      /* приватный режим */
    }
  }, [filterTypes])

  // ── «Назад» для меню группировки ──
  useBackButton(() => {
    platform.haptic('light')
    setGranularityMenuOpen(false)
  }, granularityMenuOpen)

  useEffect(() => {
    if (!user) return
    let alive = true
    setLoadError(false)
    const moodFrom = new Date()
    moodFrom.setDate(moodFrom.getDate() - 30)
    Promise.all([
      api.checkin.history(user.id, 30),
      api.analytics.get(user.id, 30).catch(() => null),
      api.moodPractices.list(user.id, {
        from: moodFrom.toISOString().slice(0, 10),
        to: new Date().toISOString().slice(0, 10),
      }),
    ])
      .then(([checkins, analytics, moodPractices]) => {
        if (!alive) return
        setDays(
          buildEntriesByDay(
            checkins,
            moodPractices,
            journalEntries,
            analytics?.daily_activity || [],
            thoughts
          )
        )
      })
      .catch(() => {
        if (alive) setLoadError(true)
      })
    return () => {
      alive = false
    }
  }, [user, journalEntries, thoughts, reloadKey, retryKey])

  async function deleteSelectedCheckin() {
    const checkin = selectedEntry?.checkin
    if (!checkin || deleting) return

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
  const availableTypes = useMemo(() => (days ? getAvailableFilterTypes(days) : new Set()), [days])
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
    setGranularityMenuOpen(false)
    setSelectedEntry(entry)
  }

  function handleSelectEntry(entry) {
    setGranularityMenuOpen(false)
    setSelectedEntry(entry)
  }

  function openPeriod(card) {
    platform.haptic('light')
    setSelectedPeriod(card)
  }

  // ── Портал кнопок в сегмент-бар ──
  const actionButtons =
    portalTarget &&
    createPortal(
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
            <span className="mx-progress-grouping-pill__chevron" aria-hidden="true">
              ⌄
            </span>
          </button>
          <button
            type="button"
            className={`mx-progress-action-btn${filterTypes.size > 0 ? ' mx-progress-action-btn--active' : ''}`}
            data-testid="history-filter-btn"
            aria-label="Фильтры"
            onClick={() => {
              platform.haptic('light')
              setGranularityMenuOpen(false)
              setFilterOpen(true)
            }}
          >
            <FilterIcon size={20} />
          </button>
          <button
            type="button"
            className="mx-progress-action-btn"
            data-testid="history-search-btn"
            aria-label="Поиск"
            onClick={() => {
              platform.haptic('light')
              setGranularityMenuOpen(false)
              setSearchOpen(true)
            }}
          >
            <Search size={20} aria-hidden="true" />
          </button>
        </div>
        {granularityMenuOpen && (
          <div
            className="mx-progress-menu-overlay"
            onClick={() => setGranularityMenuOpen(false)}
            aria-hidden="true"
          />
        )}
        {granularityMenuOpen && (
          <ProgressGlassMenu
            id="history-grouping-menu"
            role="menu"
            aria-label="Группировка истории"
            data-testid="history-grouping-menu"
            style={{ position: 'absolute', right: 0, top: '100%' }}
          >
            {HISTORY_GRANULARITIES.map(g => (
              <ProgressGlassMenuItem
                key={g.id}
                label={g.label}
                role="menuitemradio"
                selected={granularity === g.id}
                testId={`history-grouping-${g.id}`}
                onClick={() => selectGranularity(g.id)}
              />
            ))}
          </ProgressGlassMenu>
        )}
      </>,
      portalTarget
    )

  /* ── Загрузка ── */
  if (days === null) {
    return (
      <>
        {actionButtons}
        <div className="mx-progress-history" role="status" aria-label="Загружаю записи">
          <h2 className="mx-progress-history__title">история.</h2>
          <div className="mx-progress-history__skeleton" aria-hidden="true">
            {[0, 1, 2].map(index => (
              <div className="mx-progress-history__skeleton-group" key={index}>
                <div className="mx-progress-history__skeleton-label" />
                <div className="mx-progress-history__skeleton-row" />
              </div>
            ))}
          </div>
        </div>
      </>
    )
  }

  /* ── Экран ошибки загрузки ── */
  if (loadError) {
    return (
      <>
        {actionButtons}
        <div className="mx-progress-history" role="alert" data-testid="progress-history-load-error">
          <h2 className="mx-progress-history__title">история.</h2>
          <div className="mx-progress-history__empty">
            <div className="mx-progress-history__empty-title">Не удалось загрузить записи</div>
            <div className="mx-progress-history__empty-subtitle">
              Проверь соединение и попробуй ещё раз.
            </div>
            <button
              type="button"
              className="mx-progress-history__empty-button"
              data-testid="progress-history-load-retry"
              onClick={() => setRetryKey(k => k + 1)}
            >
              Повторить
            </button>
          </div>
        </div>
      </>
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
          onSelectEntry={handleSelectEntry}
        />
      </>
    )
  }

  /* ── Пустое состояние ── */
  if (filteredDays.length === 0) {
    const hasFilter = filterTypes.size > 0
    return (
      <>
        {actionButtons}
        <div className="mx-progress-history">
          <h2 className="mx-progress-history__title">история.</h2>
          <div className="mx-progress-history__empty">
            {days.length === 0 ? (
              <>
                <div className="mx-progress-history__empty-title">Здесь появятся твои записи</div>
                <div className="mx-progress-history__empty-subtitle">
                  Отметь, как ты, или пройди чек-ин — и здесь появится первая запись.
                </div>
                {onGoCheckin && (
                  <button
                    type="button"
                    className="mx-progress-history__empty-button"
                    onClick={onGoCheckin}
                  >
                    Пройти чек-ин
                  </button>
                )}
              </>
            ) : (
              <>
                <div className="mx-progress-history__empty-title">Нет записей по фильтру</div>
                {hasFilter && (
                  <button
                    type="button"
                    className="mx-progress-history__empty-button"
                    data-testid="history-reset-filter"
                    onClick={() => {
                      platform.haptic('light')
                      setFilterTypes(new Set())
                    }}
                  >
                    Сбросить фильтр
                  </button>
                )}
              </>
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

        {granularity === 'day' && <DayList days={filteredDays} onSelectEntry={handleSelectEntry} />}

        {granularity === 'week' &&
          groupDaysByWeek(filteredDays).map(group => (
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

        {granularity === 'month' &&
          groupDaysByMonth(filteredDays).map(group => (
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

        {granularity === 'year' &&
          groupDaysByYear(filteredDays).map(card => (
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
