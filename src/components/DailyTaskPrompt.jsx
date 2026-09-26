import { useEffect, useRef, useState } from 'react'
import { api } from '../lib/api'
import { toLocalCalendarDate } from '../lib/dateTimezonePolicy'
import { visibleDailyTask } from '../lib/dailyTask'
import { logOnce } from '../lib/logOnce'

// Задание необязательное: неподдерживаемый эндпоинт и сбой сети не меняют чек-ин.

export default function DailyTaskPrompt({ user }) {
  const date = toLocalCalendarDate()
  const [response, setResponse] = useState(null)
  const [busy, setBusy] = useState(false)
  const events = useRef(new Set())
  const answered = useRef(false)

  useEffect(() => {
    let active = true
    api.mentalix.dailyTask(date)
      .then(value => { if (active) setResponse(visibleDailyTask(value)) })
      .catch(() => { if (active) setResponse(null) })
    return () => { active = false }
  }, [date])

  const task = response?.task
  useEffect(() => {
    if (!task || response.status !== 'new') return
    logOnce(events, `shown:${date}:${task.id}`, () =>
      api.events.log(user.id, 'daily_task_shown', 'daily_task', task.id).catch(() => {})
    )
  }, [response, task, user.id, date])

  if (!task) return null

  async function answer(status) {
    if (answered.current || busy) return
    answered.current = true
    setBusy(true)
    try {
      await api.mentalix.answerDailyTask(date, task.id, status)
      setResponse(current => ({ ...current, status }))
      logOnce(events, `answer:${date}:${task.id}`, () =>
        api.events.log(user.id, status === 'done' ? 'daily_task_done' : 'daily_task_skipped', 'daily_task', task.id).catch(() => {})
      )
    } catch {
      answered.current = false
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="mt-4 w-full max-w-sm rounded-3xl bg-[rgb(var(--c-card2))] p-4 text-left" data-testid="daily-task">
      {response.status !== 'new' ? (
        <p className="mx-type-body text-muted" data-testid="daily-task-status">
          Задание на сегодня · {response.status === 'done' ? 'Сделано' : 'Отложено'}
        </p>
      ) : (
        <>
          <p className="mx-type-meta text-muted">Задание на сегодня · {task.minutes} мин</p>
          <h3 className="mx-type-card mt-2 text-cream">{task.title}</h3>
          <p className="mx-type-body mt-2 text-muted">{task.body}</p>
          <div className="mt-4 flex gap-2">
            <button type="button" data-testid="daily-task-done" disabled={busy} onClick={() => answer('done')} className="mx-type-control min-h-11 rounded-full bg-[rgb(var(--c-line))] px-5 text-[rgb(var(--c-bg))] disabled:opacity-50">Сделать</button>
            <button type="button" data-testid="daily-task-skip" disabled={busy} onClick={() => answer('skipped')} className="mx-type-control min-h-11 rounded-full border border-[rgb(var(--c-border))] px-5 text-cream disabled:opacity-50">Не сейчас</button>
          </div>
        </>
      )}
    </section>
  )
}
