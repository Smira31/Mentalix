import { useEffect, useMemo, useState } from 'react'
import { api } from '../lib/api'
import { MotifArt } from '../components/Motif'
import EmptyState from '../components/EmptyState'
import MarkdownText from '../components/MarkdownText'
import { buildBadges } from '../lib/badges'
import { readJournalHistory } from '../lib/journalHistory'
import JourneySearch from './JourneySearch'
import HistorySkeleton from '../components/HistorySkeleton'
import { platform, platformName } from '../platform'
import { MoreHorizontal } from 'lucide-react'
import BackButton from '../components/BackButton'
import { MENTOR_DRAFT_KEY, MENTOR_PERSONA_KEY, MENTOR_SAFETY_KEY } from './mentalix/personas'
import { moodPracticeDate } from '../lib/moodPracticeLogic'

// ── История: лента дней из чек-инов, активности и local-only journal, как
// history. у stoic. ──
// Утренняя мысль живёт в note, вечерний разбор — в lessons и wins.
// Каждый блок показывается, только если в нём что-то есть.
// Вехи и записи по темам — отдельные недатированные блоки ниже ленты:
// у бейджей и тем нет даты в контракте бэкенда, честного слияния в общую
// хронологию по датам без этого не сделать (MXL-HISTORY-UNIFIED-FEED-001).
// Journal — другой случай: у него есть дата (ключ local store), просто
// источник local-only, не backend — это не мешает слить его в общую
// датированную ленту наравне с checkin/activity (расширение
// MXL-HISTORY-UNIFIED-FEED-001, см. TASKS.md).

const MOOD_WORDS = ['тяжко', 'так себе', 'нормально', 'хорошо', 'отлично']
const MONTHS = ['янв', 'фев', 'мар', 'апр', 'мая', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек']
const LESSON_LABELS = ['Что получилось?', 'Что было трудно?', 'Какой вывод забираешь?']

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
    } else if (current) {
      current.answer += '\n' + line
    }
  }
  if (current) result.push(current)
  return result
}

function dayTitle(iso) {
  const d = new Date(iso + 'T00:00:00')
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const diff = Math.round((today - d) / 86400000)
  if (diff === 0) return 'Сегодня'
  if (diff === 1) return 'Вчера'
  return `${d.getDate()} ${MONTHS[d.getMonth()]}`
}

function moodPracticeTime(mp) {
  const raw = mp.recorded_at
  if (!raw) return ''
  const d = new Date(raw)
  if (Number.isNaN(d.getTime())) return ''
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

/*
 * Запись практики «Настроение» в ленте истории — монохромная строка
 * в стиле существующих строк (активность, журнал). Без новых цветов
 * и эмодзи. data-testid — history-mood-entry.
 */
function MoodPracticeEntry({ entry }) {
  const time = moodPracticeTime(entry)
  const emotion = entry.emotion || moodWord(entry.mood)
  return (
    <div
      data-testid="history-mood-entry"
      className="flex items-center gap-2 text-[13px] text-muted"
    >
      <span className="font-semibold">Настроение</span>
      {time && <span>{time}</span>}
      <span className="text-cream">{emotion}</span>
      {entry.breathing_completed && <span>· дыхание</span>}
    </div>
  )
}

/*
 * Локальный journal-фрагмент дня — переиспользуется и в карточке ленты, и
 * в HistoryDetail. data-testid/тексты ниже намеренно совпадают с тем, что
 * уже проверяет tests/unit/maintenance-contracts.test.mjs
 * (MXL-JOURNAL-HISTORY-001) — тот тест ищет их по всему файлу, не по
 * конкретному месту в разметке.
 */
function JournalDayCard({ entry }) {
  return (
    <div data-testid="local-journal-history" className="mt-3 border-t border-cream/10 pt-3">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-[12px] font-semibold text-muted">Локальный журнал</span>
        <span className="rounded-full bg-gold/10 px-2.5 py-1 text-[11px] font-bold text-gold">
          {entry.completedCount}/{entry.totalPhases} шага
        </span>
        <span className="text-[11px] text-muted">
          {entry.status === 'final' ? 'завершено' : 'черновик'}
        </span>
      </div>
      <p className="mt-1 text-[12px] leading-snug text-muted">
        Записи сохранены на этом устройстве и доступны только в этом профиле.
      </p>
      <div className="mt-3 space-y-4">
        {entry.phases.map(phase => (
          <div key={phase.key}>
            <div className="mb-1 flex items-center gap-2">
              <span className="text-[12px] font-bold text-gold">{phase.label}</span>
              <span className="text-[11px] text-muted">
                {phase.status === 'final' ? 'завершено' : 'черновик'}
              </span>
            </div>
            <MarkdownText
              content={phase.text}
              className="space-y-2 text-[14px] leading-snug text-muted"
            />
          </div>
        ))}
      </div>
    </div>
  )
}

export function HistoryDetail({
  day,
  onBack,
  onDelete,
  deleting,
  deleteError,
  canManageAiContext,
  onContextChange,
  savingContext,
  contextError,
  onDiscuss,
  recapOnly = false,
  onRedo = null,
  onRedoReview = null,
}) {
  const checkin = day.checkin
  const wins = checkin?.wins || []
  const [redoMenuOpen, setRedoMenuOpen] = useState(false)
  const [redoConfirm, setRedoConfirm] = useState(null)

  const isToday = day.date === new Date().toISOString().slice(0, 10)
  const canRedo = isToday && (onRedo || onRedoReview)

  return (
    <section aria-label={`Запись за ${dayTitle(day.date)}`} className="mt-1 animate-fade-in">
      <div className="grid min-h-[42px] grid-cols-[1fr_auto_1fr] items-center">
        <BackButton onClick={onBack} />
        {/* Явные колонки: в Telegram BackButton не рендерится, и без них
            заголовок и «…» съезжают на колонку левее. */}
        <h2 className="col-start-2 font-display mx-type-section text-cream">
          {dayTitle(day.date)}
        </h2>
        {canRedo ? (
          <div className="relative col-start-3 flex justify-end" data-testid="history-redo-slot">
            <button
              type="button"
              aria-label="Действия с чек-ин"
              data-testid="history-redo-button"
              className="mx-icon-button"
              onClick={() => setRedoMenuOpen(open => !open)}
            >
              <MoreHorizontal size={20} aria-hidden="true" />
            </button>
            {redoMenuOpen && (
              <div
                role="menu"
                data-testid="history-redo-menu"
                className="absolute right-0 top-full z-50 mt-1 min-w-[200px] whitespace-nowrap rounded-2xl border border-cream/10 bg-emerald p-1 shadow-xl"
              >
                {onRedo && (
                  <button
                    type="button"
                    role="menuitem"
                    className="w-full rounded-xl px-4 py-3 text-left text-[14px] font-medium text-cream hover:bg-cream/5"
                    onClick={() => {
                      setRedoMenuOpen(false)
                      setRedoConfirm('morning')
                    }}
                  >
                    Пройти утро заново
                  </button>
                )}
                {onRedoReview && checkin?.review_completed_at && (
                  <button
                    type="button"
                    role="menuitem"
                    className="w-full rounded-xl px-4 py-3 text-left text-[14px] font-medium text-cream hover:bg-cream/5"
                    onClick={() => {
                      setRedoMenuOpen(false)
                      setRedoConfirm('evening')
                    }}
                  >
                    Пройти разбор заново
                  </button>
                )}
              </div>
            )}
          </div>
        ) : (
          <span aria-hidden="true" />
        )}
      </div>

      {recapOnly ? (
        <div className="mt-5 rounded-3xl bg-emerald p-5" data-testid="history-today-card">
          <div className="mb-5 flex items-center">
            <span className="text-[12px] font-bold uppercase tracking-wide text-muted">
              Сегодняшний чек-ин
            </span>
          </div>
          {[
            ['Как ты сейчас?', moodWord(checkin?.mood)],
            checkin?.energy != null ? ['Сколько в тебе энергии?', `${checkin.energy}/5`] : null,
            checkin?.anxiety != null ? ['Сколько шума в голове?', `${checkin.anxiety}/5`] : null,
            checkin?.focus != null ? ['Насколько ты собран?', `${checkin.focus}/5`] : null,
            checkin?.emotion ? ['Что ты чувствуешь?', capitalize(checkin.emotion)] : null,
            checkin?.note ? ['Что на уме?', checkin.note] : null,
            ...parseLessons(checkin?.lessons).map(({ question, answer }) => [question, answer]),
            ...(checkin?.wins || []).map((win, index) => [`Чем ты гордишься? ${index + 1}`, win]),
          ]
            .filter(Boolean)
            .map(([question, answer]) => (
              <div
                key={question}
                className="border-t border-cream/10 py-4 first:border-t-0 first:pt-0 last:pb-0"
              >
                <h3 className="text-[14px] font-bold text-cream">{question}</h3>
                <p className="mt-1 whitespace-pre-wrap text-[14px] leading-relaxed text-muted">
                  {answer}
                </p>
              </div>
            ))}
        </div>
      ) : (
        <div className="mt-5 space-y-4 rounded-3xl bg-emerald p-5" data-testid="history-today-card">
          {checkin ? (
            <>
              <div className="flex flex-wrap gap-2">
                <span className="rounded-full bg-gold/10 px-3 py-1 text-[12px] font-bold text-gold">
                  {moodWord(checkin.mood)}
                </span>
                {checkin.energy && (
                  <span className="rounded-full bg-cream/5 px-3 py-1 text-[12px] font-semibold text-muted">
                    энергия {checkin.energy}/5
                  </span>
                )}
                {checkin.focus && (
                  <span className="rounded-full bg-cream/5 px-3 py-1 text-[12px] font-semibold text-muted">
                    фокус {checkin.focus}/5
                  </span>
                )}
                {checkin.emotion && (
                  <span className="rounded-full bg-cream/5 px-3 py-1 text-[12px] font-semibold text-muted">
                    {capitalize(checkin.emotion)}
                  </span>
                )}
              </div>

              {checkin.note && (
                <div>
                  <div className="mb-2 text-[12px] font-bold uppercase tracking-wide text-muted">
                    Утренняя запись
                  </div>
                  <MarkdownText
                    content={checkin.note}
                    className="space-y-2 text-[15px] leading-relaxed text-cream"
                  />
                </div>
              )}

              {parseLessons(checkin.lessons).length > 0 && (
                <div className="space-y-4">
                  {parseLessons(checkin.lessons).map(({ question, answer }) => (
                    <div key={question}>
                      <h3 className="mb-1 text-[14px] font-bold text-cream">{question}</h3>
                      <MarkdownText
                        content={answer}
                        className="space-y-2 text-[14px] leading-relaxed text-muted"
                      />
                    </div>
                  ))}
                </div>
              )}

              {wins.length > 0 && (
                <div className="rounded-2xl bg-emerald-light p-4">
                  <div className="mb-2.5 font-label text-[12px] font-bold uppercase tracking-wide text-muted">
                    Чем горжусь
                  </div>
                  <ul className="space-y-2">
                    {wins.map((win, index) => (
                      <li key={`${day.date}-${index}`} className="flex items-start gap-2.5">
                        <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-gold/15 text-[11px] font-bold text-gold">
                          {index + 1}
                        </span>
                        <MarkdownText
                          content={win}
                          className="min-w-0 space-y-1 text-[14px] leading-snug text-cream"
                        />
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {!checkin.note && !checkin.lessons && wins.length === 0 && (
                <p className="text-[14px] leading-relaxed text-muted">
                  В этот день сохранено состояние и активность, но текстовой записи нет.
                </p>
              )}
            </>
          ) : (
            <p className="text-[14px] leading-relaxed text-muted">
              В этот день сохранена активность или практика, но чек-ин не сохранён.
            </p>
          )}

          {day.activity?.count > 0 && (
            <p className="text-[13px] font-semibold text-muted">
              Ритуалов закрыто: {day.activity.count}
              {day.activity.breaks > 0 && (
                <span className="text-muted"> · срывов аскез: {day.activity.breaks}</span>
              )}
            </p>
          )}

          {day.moodPractices?.length > 0 && (
            <div className="space-y-1.5 border-t border-cream/10 pt-3">
              {day.moodPractices.map(mp => (
                <MoodPracticeEntry key={mp.id} entry={mp} />
              ))}
            </div>
          )}

          {day.journal && <JournalDayCard entry={day.journal} />}
          {day.oneOffPractices && <OneOffPracticeDayCard entries={day.oneOffPractices} />}

          {checkin && (
            <div className="border-t border-cream/10 pt-4">
              <h3 className="text-[14px] font-semibold text-cream">Эта запись и AI</h3>
              <p className="mt-1 text-[12px] leading-relaxed text-muted">
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
                  className="mt-3 min-h-11 rounded-full bg-cream/5 px-3 text-left text-[12px] font-semibold text-gold disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {savingContext
                    ? 'Сохраняем…'
                    : checkin.ai_context_enabled
                      ? 'AI может использовать запись — отключить'
                      : 'Разрешить AI использовать эту запись'}
                </button>
              ) : (
                <p className="mt-2 text-[12px] leading-relaxed text-muted">
                  Выбор контекста доступен в Telegram Mini App с проверенной подписью.
                </p>
              )}
              {contextError && (
                <p role="alert" className="mt-2 text-[12px] text-red-300">
                  {contextError}
                </p>
              )}
              {checkin.ai_context_enabled ? (
                <button
                  type="button"
                  onClick={onDiscuss}
                  className="mt-3 min-h-11 rounded-full bg-gold/10 px-3 text-left text-[12px] font-semibold text-gold"
                >
                  Обсудить с AI
                </button>
              ) : (
                <p className="mt-3 text-[12px] leading-relaxed text-muted">
                  Включи персональный контекст выше, чтобы обсудить эту запись с AI.
                </p>
              )}
              <p className="mb-3 mt-5 text-[12px] leading-relaxed text-muted">
                Удаление необратимо: исчезнет только этот чек-ин и его личные теги. Активность
                ритуалов за день сохранится.
              </p>
              <button
                type="button"
                onClick={onDelete}
                disabled={deleting}
                className="min-h-11 rounded-full px-4 text-[13px] font-semibold text-red-300 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {deleting ? 'Удаляем…' : 'Удалить эту запись'}
              </button>
              {deleteError && (
                <p role="alert" className="mt-2 text-[12px] text-red-300">
                  {deleteError}
                </p>
              )}
            </div>
          )}
        </div>
      )}

      {redoConfirm && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="redo-confirm-title"
          aria-describedby="redo-confirm-desc"
          className="fixed inset-0 z-[90] flex items-end bg-black/70 p-5 sm:items-center"
          onClick={() => setRedoConfirm(null)}
        >
          <div
            className="w-full max-w-md mx-auto rounded-[28px] bg-emerald p-6 shadow-xl animate-fade-in"
            onClick={e => e.stopPropagation()}
          >
            <h2 id="redo-confirm-title" className="font-display text-[22px] text-cream">
              Пройти заново?
            </h2>
            <p id="redo-confirm-desc" className="mt-3 text-[14px] leading-relaxed text-muted">
              Текущие ответы заменятся.
            </p>
            <div className="mt-6 grid grid-cols-2 gap-3">
              <button
                type="button"
                autoFocus
                onClick={() => setRedoConfirm(null)}
                className="min-h-12 rounded-full border border-cream/15 px-4 text-[14px] font-semibold text-cream"
              >
                Отмена
              </button>
              <button
                type="button"
                onClick={() => {
                  const fn = redoConfirm === 'evening' ? onRedoReview : onRedo
                  setRedoConfirm(null)
                  fn?.()
                }}
                className="min-h-12 rounded-full bg-cream px-4 text-[14px] font-bold text-emerald-deep"
              >
                Пройти заново
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}

export default function History({
  user,
  initialSelectedDay = null,
  onInitialBack = null,
  recapOnly = false,
  onRedo = null,
  onRedoReview = null,
}) {
  const [days, setDays] = useState(null)
  const [badges, setBadges] = useState(null)
  const [themeEntries, setThemeEntries] = useState(null)
  const [selectedDay, setSelectedDay] = useState(initialSelectedDay)
  const [journeySearchOpen, setJourneySearchOpen] = useState(false)
  const [deletingCheckin, setDeletingCheckin] = useState(false)
  const [deleteError, setDeleteError] = useState('')
  const [historyStatus, setHistoryStatus] = useState('')
  const [savingContext, setSavingContext] = useState(false)
  const [contextError, setContextError] = useState('')
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
   * Единая датированная лента: days (checkin+activity, backend) слит с
   * journalEntries (local-only) по дате. Оба источника уже независимо
   * загружены/вычислены выше — здесь только компоновка, ни один из них не
   * меняется. day.journal остаётся undefined для дней без local-записи —
   * рендер решает, показывать ли JournalDayCard, по наличию поля.
   */
  const datedItems = useMemo(() => {
    if (days === null) return null

    const byDate = {}
    for (const d of days) byDate[d.date] = { ...d }
    for (const entry of journalEntries) {
      byDate[entry.date] = { ...(byDate[entry.date] || { date: entry.date }), journal: entry }
    }
    return Object.values(byDate).sort((a, b) => (a.date < b.date ? 1 : -1))
  }, [days, journalEntries])

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
      const byDate = {}
      for (const c of checkins || []) {
        byDate[c.date] = { ...(byDate[c.date] || {}), checkin: c }
      }
      for (const d of analytics?.daily_activity || []) {
        if (d.count > 0 || byDate[d.date]) {
          byDate[d.date] = { ...(byDate[d.date] || {}), activity: d }
        }
      }
      for (const mp of moodPractices || []) {
        const date = moodPracticeDate(mp)
        if (!date) continue
        if (!byDate[date]) byDate[date] = { date }
        byDate[date].moodPractices = [...(byDate[date].moodPractices || []), mp]
      }
      const list = Object.entries(byDate)
        .map(([date, v]) => ({ date, ...v }))
        .sort((a, b) => (a.date < b.date ? 1 : -1))
      setDays(list)
    })
  }, [user])

  useEffect(() => {
    if (!user) return
    Promise.all([
      api.profile.get(user.id).catch(() => null),
      api.rituals.list(user.id).catch(() => []),
      api.ascezas.list(user.id).catch(() => []),
    ]).then(([stats, rituals, ascezas]) => {
      setBadges(buildBadges({ stats, rituals, ascezas }).filter(b => b.done))
    })
  }, [user])

  useEffect(() => {
    if (!user) return
    api.themes
      .list(user.id)
      .catch(() => [])
      .then(list => {
        const reflected = (list || []).filter(t => t.reflected_days > 0)
        if (reflected.length === 0) {
          setThemeEntries([])
          return
        }
        Promise.all(reflected.map(t => api.themes.get(t.id, user.id).catch(() => null))).then(
          themes => {
            const entries = []
            for (const theme of themes) {
              if (!theme) continue
              for (const d of theme.days || []) {
                if (d.reflection) {
                  entries.push({
                    themeId: theme.id,
                    themeTitle: theme.title,
                    day: d.day,
                    text: d.reflection,
                  })
                }
              }
            }
            setThemeEntries(entries)
          }
        )
      })
  }, [user])

  async function deleteSelectedCheckin() {
    const checkin = selectedDay?.checkin
    if (!checkin || deletingCheckin) return
    if (!window.confirm('Удалить эту сохранённую запись? Это действие нельзя отменить.')) return

    setDeletingCheckin(true)
    setDeleteError('')
    try {
      await api.privacy.deleteCheckin(user.id, checkin.id)
      setDays(current =>
        current
          .map(day => (day.date === selectedDay.date ? { ...day, checkin: null } : day))
          .filter(day => day.checkin || day.activity?.count > 0 || day.moodPractices?.length > 0)
      )
      setSelectedDay(null)
      setHistoryStatus('Запись удалена. Активность ритуалов за этот день сохранена.')
    } catch {
      setDeleteError('Не удалось удалить запись. Проверь соединение и попробуй ещё раз.')
    } finally {
      setDeletingCheckin(false)
    }
  }

  async function updateSelectedCheckinContext(nextEnabled) {
    const checkin = selectedDay?.checkin
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
      setDays(current =>
        current.map(day =>
          day.date === selectedDay.date && day.checkin?.id === checkin.id
            ? { ...day, checkin: { ...day.checkin, ai_context_enabled: enabled } }
            : day
        )
      )
      setSelectedDay(current =>
        current && current.date === selectedDay.date
          ? { ...current, checkin: { ...current.checkin, ai_context_enabled: enabled } }
          : current
      )
      setHistoryStatus(
        enabled ? 'Эта запись разрешена для AI-контекста.' : 'Эта запись больше не передаётся AI.'
      )
    } catch {
      setContextError('Не удалось сохранить выбор. Запись не была подтверждена для AI.')
    } finally {
      setSavingContext(false)
    }
  }

  /*
   * MXL-AI-REFRAME-001: «Обсудить с AI» на уже сохранённой записи —
   * реактивный переход, не проактивная подсказка. Переиспользует тот же
   * sessionStorage-хендофф, что openScout()/openListener()/
   * deepenMorningNote() в CheckIn.jsx (MENTOR_PERSONA_KEY/MENTOR_DRAFT_KEY),
   * плюс отдельный MENTOR_SAFETY_KEY — включает лид-дисклеймер и
   * safety-проверку ответов в Mentalix.jsx только для этого хендоффа, не
   * трогая остальные. Уважает contextConsent/setCheckinContext: кнопка
   * доступна только если checkin.ai_context_enabled уже включён владельцем
   * записи. Никакого нового backend-запроса и никакой записи обратно в
   * checkin — итог живёт только в чате (mentalix.send).
   */
  function discussSelectedCheckinWithAI() {
    const checkin = selectedDay?.checkin
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

  if (days === null) return <HistorySkeleton />

  if (selectedDay) {
    return (
      <HistoryDetail
        day={selectedDay}
        onBack={() => (onInitialBack ? onInitialBack() : setSelectedDay(null))}
        onDelete={deleteSelectedCheckin}
        deleting={deletingCheckin}
        deleteError={deleteError}
        canManageAiContext={canManageAiContext}
        onContextChange={updateSelectedCheckinContext}
        savingContext={savingContext}
        contextError={contextError}
        onDiscuss={discussSelectedCheckinWithAI}
        recapOnly={recapOnly}
        onRedo={onRedo}
        onRedoReview={onRedoReview}
      />
    )
  }

  if (journeySearchOpen) {
    return (
      <>
        <button
          type="button"
          onClick={() => setJourneySearchOpen(false)}
          className="mb-3 min-h-11 rounded-full bg-emerald px-4 text-[13px] font-semibold text-muted"
        >
          К обычной истории
        </button>
        <JourneySearch user={user} />
      </>
    )
  }

  const milestonesBlock = badges && badges.length > 0 && (
    <div className="mt-8">
      <div className="text-[13px] text-muted font-semibold mb-2 px-1">Вехи пути</div>
      <div className="rounded-3xl bg-emerald p-5 grid grid-cols-3 gap-2">
        {badges.map(b => (
          <div
            key={b.id}
            className="rounded-2xl p-3 flex flex-col items-center text-center bg-gold/10 border border-gold/25"
          >
            <MotifArt name={b.motif} size={56} className="mb-2" />
            <span className="text-[11px] font-bold leading-tight text-cream">{b.title}</span>
          </div>
        ))}
      </div>
    </div>
  )

  const themeEntriesBlock = themeEntries && themeEntries.length > 0 && (
    <div className="mt-8">
      <div className="text-[13px] text-muted font-semibold mb-2 px-1">Записи по темам</div>
      <div className="space-y-3">
        {themeEntries.map(e => (
          <div key={`${e.themeId}-${e.day}`} className="rounded-3xl bg-emerald p-5">
            <div className="text-[12px] font-bold text-gold mb-1">
              {e.themeTitle} · день {e.day}
            </div>
            <MarkdownText
              content={e.text}
              className="space-y-2 text-[14px] text-muted leading-snug"
            />
          </div>
        ))}
      </div>
    </div>
  )

  if (datedItems.length === 0) {
    return (
      <>
        <h1 className="font-display mx-type-page text-cream lowercase">история.</h1>
        <EmptyState
          glyph={<MotifArt name="sledopyt" size={110} className="mx-auto mb-4" />}
          className="px-6 py-10 mt-2"
        >
          <h3 className="font-display text-[18px] text-cream mb-2">Пока пусто</h3>
          <p className="text-[14px] text-muted leading-snug">
            Пройди чек-ин или закрой ритуал —
            <br />и здесь появится первая запись пути.
          </p>
        </EmptyState>
        {milestonesBlock}
        {themeEntriesBlock}
      </>
    )
  }

  return (
    <div className="space-y-5 mt-1">
      <h1 className="font-display mx-type-page text-cream lowercase">история.</h1>
      {historyStatus && (
        <p role="status" className="rounded-2xl bg-gold/10 px-4 py-3 text-[13px] text-gold">
          {historyStatus}
        </p>
      )}
      <button
        type="button"
        onClick={() => setJourneySearchOpen(true)}
        className="min-h-11 rounded-full bg-emerald px-4 text-[13px] font-semibold text-muted"
      >
        Искать и фильтровать записи
      </button>
      {datedItems.map(d => {
        const wins = d.checkin?.wins || []
        return (
          <div key={d.date}>
            {/* «…» у правого края — намёк, что за строкой дня лежит
                раскрываемая запись (открытие по тапу в карточку ниже). */}
            <div
              data-testid="history-day-header"
              className="mb-2 flex items-center justify-between px-1"
            >
              <span className="text-[13px] font-semibold text-muted">{dayTitle(d.date)}</span>
              <span className="text-[13px] font-semibold text-muted" aria-hidden="true">
                …
              </span>
            </div>
            <button
              type="button"
              onClick={() => setSelectedDay(d)}
              aria-label={`Открыть запись за ${dayTitle(d.date)}`}
              className="w-full rounded-3xl bg-emerald p-5 space-y-3 text-left active:scale-[0.99] transition-transform"
            >
              {d.checkin && (
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[12px] font-bold text-gold bg-gold/10 rounded-full px-3 py-1">
                      {moodWord(d.checkin.mood)}
                    </span>
                    {d.checkin.energy != null && (
                      <span className="text-[12px] font-semibold text-muted bg-cream/5 rounded-full px-3 py-1">
                        энергия {d.checkin.energy}/5
                      </span>
                    )}
                    {d.checkin.focus != null && (
                      <span className="text-[12px] font-semibold text-muted bg-cream/5 rounded-full px-3 py-1">
                        фокус {d.checkin.focus}/5
                      </span>
                    )}
                  </div>

                  {d.checkin.note && (
                    <MarkdownText
                      className="space-y-2 text-[14px] text-muted leading-snug mt-3"
                      content={
                        d.checkin.note.length > 220
                          ? d.checkin.note.slice(0, 220) + '…'
                          : d.checkin.note
                      }
                    />
                  )}

                  {parseLessons(d.checkin.lessons).length > 0 && (
                    <div className="space-y-3 mt-3">
                      {parseLessons(d.checkin.lessons).map(({ question, answer }) => (
                        <div key={question}>
                          <div className="text-[12px] font-bold text-muted mb-1">{question}</div>
                          <MarkdownText
                            content={answer}
                            className="space-y-1 text-[14px] text-cream leading-snug"
                          />
                        </div>
                      ))}
                    </div>
                  )}

                  {wins.length > 0 && (
                    <div className="rounded-2xl bg-emerald-light p-4 mt-2.5">
                      <div className="font-label text-[12px] font-bold text-muted uppercase tracking-wide mb-2.5">
                        Чем горжусь
                      </div>
                      <ul className="space-y-2">
                        {wins.map((w, i) => (
                          <li key={i} className="flex items-start gap-2.5">
                            <span className="w-5 h-5 rounded-full bg-gold/15 text-gold text-[11px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                              {i + 1}
                            </span>
                            <MarkdownText
                              content={w}
                              className="min-w-0 space-y-1 text-[14px] text-cream leading-snug"
                            />
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {d.activity && d.activity.count > 0 && (
                <div className="text-[13px] font-semibold text-muted">
                  ✦ ритуалов закрыто: {d.activity.count}
                  {d.activity.breaks > 0 && (
                    <span className="text-muted"> · срывов аскез: {d.activity.breaks}</span>
                  )}
                </div>
              )}

              {d.moodPractices?.length > 0 && (
                <div className="space-y-1.5">
                  {d.moodPractices.map(mp => (
                    <MoodPracticeEntry key={mp.id} entry={mp} />
                  ))}
                </div>
              )}

              {d.journal && <JournalDayCard entry={d.journal} />}
            </button>
          </div>
        )
      })}

      {milestonesBlock}
      {themeEntriesBlock}
    </div>
  )
}
