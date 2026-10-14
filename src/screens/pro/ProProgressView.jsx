import { useEffect, useRef, useState } from 'react'

import { api } from '../../lib/api'
import PageTitle from '../../components/ui/PageTitle'
import Card from '../../components/ui/Card'
import PillButton from '../../components/ui/PillButton'
import ProStateCard from './ProStateCard'
import { proBlockedState, proErrorKey, proStatePayload } from './proApiState'
import { STATUS_LABELS, formatDayLabel, formatWeekRange } from './weekLabel'

/*
 * «Прогресс» (PRO-002c-progress): детерминированная сводка выполнения плана —
 * GET /api/pro/progress без AI-вызова. Количество выполненных/пропущенных/
 * неотмеченных действий, доля, состояния дней. Просрочки нет: будущий день
 * (is_future) — нормальное состояние, не провал. plan_required → «К плану»;
 * 402 pro_required и 404 pro_progress_disabled → отдельная карточка, не
 * бесконечная загрузка; ошибки двух форматов — body.detail и body.code;
 * поздний ответ загрузки отбрасывается по номеру запроса.
 */

const STATUS_COLORS = {
  done: 'text-cream',
  skipped: 'text-muted',
  planned: 'text-muted',
}

export default function ProProgressView({ onOpenPlan }) {
  const [state, setState] = useState(null) // null — загрузка
  const [loadFailed, setLoadFailed] = useState(false)
  const [blocked, setBlocked] = useState(null)
  const aliveRef = useRef(true)
  // Поздний ответ загрузки не затирает новое состояние экрана.
  const loadSeqRef = useRef(0)

  useEffect(() => {
    aliveRef.current = true
    load()
    return () => {
      aliveRef.current = false
    }
  }, [])

  function load() {
    const seq = ++loadSeqRef.current
    setLoadFailed(false)
    api.pro
      .getProgress()
      .then(data => {
        if (!aliveRef.current || seq !== loadSeqRef.current) return
        const payload = proStatePayload(data)
        if (!payload) {
          // Ответ без состояния Pro (пусто, массив, чужой формат): данные не
          // доставлены — состояние ошибки с повтором, ничего не форматируем.
          setLoadFailed(true)
          return
        }
        setState(payload)
        setBlocked(null)
      })
      .catch(error => {
        if (!aliveRef.current || seq !== loadSeqRef.current) return
        const block = proBlockedState(proErrorKey(error))
        if (block) {
          setBlocked(block)
          return
        }
        console.error(error)
        setLoadFailed(true)
      })
  }

  const completion = state?.completion
  const rate =
    typeof state?.completion_rate === 'number'
      ? `${Math.round(state.completion_rate * 100)}%`
      : null
  /*
   * Диапазон недели — только из распознанных дат: если сервер не прислал
   * plan_week_start (или она не распознана), в карточке остаётся одна
   * подпись «Неделя действий» без выдуманных чисел.
   */
  const weekTitle = formatWeekRange(
    state?.plan_week_start,
    state?.days?.[state.days.length - 1]?.date
  )

  return (
    <div>
      <PageTitle>прогресс.</PageTitle>

      {state === null && !loadFailed && !blocked && (
        <p className="mt-6 text-[13px] text-muted">Загружаем…</p>
      )}

      {blocked && (
        <ProStateCard title={blocked.title} text={blocked.text} testId="pro-blocked-state" />
      )}

      {loadFailed && (
        <Card className="mt-4 p-4">
          <p className="text-[13px] text-muted">Не удалось загрузить прогресс.</p>
          <PillButton variant="dark" onClick={load} className="mt-3 w-full">
            Повторить
          </PillButton>
        </Card>
      )}

      {state && state.status === 'plan_required' && (
        <Card className="mt-4 p-4">
          <p className="text-[14px] leading-relaxed text-cream">
            Прогресс считается по плану недели — сначала собери его.
          </p>
          <PillButton variant="light" onClick={onOpenPlan} className="mt-3 w-full">
            К плану
          </PillButton>
        </Card>
      )}

      {state && !['plan_required', 'ready', 'partial'].includes(state.status) && (
        <ProStateCard
          title="Неожиданное состояние"
          text="Сервер вернул незнакомый статус прогресса. Попробуй обновить экран."
          actionLabel="Повторить"
          onAction={load}
          testId="pro-unknown-state"
        />
      )}

      {state && ['ready', 'partial'].includes(state.status) && (
        <div>
          {state.status === 'partial' && (
            <p className="mt-2 text-[12px] leading-relaxed text-muted">
              План недели собран не полностью — часть действий ещё не появилась.
            </p>
          )}

          {state.goal?.text && (
            <Card className="mt-4 p-4">
              <p className="font-label text-[11px] uppercase tracking-wider text-muted">
                Цель недели
              </p>
              <p className="mt-2 text-[15px] font-semibold leading-relaxed text-cream">
                {state.goal.text}
              </p>
            </Card>
          )}

          {completion && (
            <Card className="mt-4 p-4" testId="pro-progress-completion">
              <p className="font-label text-[11px] uppercase tracking-wider text-muted">
                Неделя действий{weekTitle ? ` · ${weekTitle}` : ''}
              </p>
              <p className="mt-2 text-[26px] font-bold text-cream">
                {completion.done} из {completion.planned}
                {rate && <span className="ml-2 text-[16px] font-semibold text-muted">{rate}</span>}
              </p>
              <p className="mt-1 text-[12px] text-muted">
                выполнено {completion.done} · пропущено {completion.skipped} · не отмечено{' '}
                {completion.unmarked}
              </p>
            </Card>
          )}

          {state.done_actions?.length > 0 && (
            <div className="mt-5">
              <p className="font-label text-[11px] uppercase tracking-wider text-muted">
                Выполнено
              </p>
              <Card className="mt-2 p-4">
                <ul className="space-y-2">
                  {state.done_actions.map(action => (
                    <li key={action} className="text-[14px] leading-relaxed text-cream">
                      {action}
                    </li>
                  ))}
                </ul>
              </Card>
            </div>
          )}

          {state.days?.length > 0 && (
            <div className="mt-5">
              <p className="font-label text-[11px] uppercase tracking-wider text-muted">
                Дни недели действий
              </p>
              <Card className="mt-2 p-4">
                <ul className="space-y-2">
                  {state.days.map(day => (
                    <li key={day.id || day.day} className="flex items-baseline justify-between gap-2">
                      <span className="text-[13px] text-cream">
                        {[formatDayLabel(day.date), day.action].filter(Boolean).join(' · ')}
                      </span>
                      <span
                        className={`font-label shrink-0 text-[11px] ${STATUS_COLORS[day.status] || 'text-muted'}`}
                      >
                        {STATUS_LABELS[day.status] || day.status}
                      </span>
                    </li>
                  ))}
                </ul>
              </Card>
            </div>
          )}

          <p className="mt-4 text-[11px] leading-relaxed text-muted">
            Сводка построена по отметкам плана: без оценок личности и выводов о тебе.
          </p>
        </div>
      )}
    </div>
  )
}
