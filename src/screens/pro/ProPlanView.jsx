import { useEffect, useRef, useState } from 'react'

import { api } from '../../lib/api'
import {
  ProPollCancelledError,
  pollGenerationReady,
} from '../../lib/proGenerationPolling'
import PageTitle from '../../components/ui/PageTitle'
import Card from '../../components/ui/Card'
import PillButton from '../../components/ui/PillButton'
import ProConsentCard from './ProConsentCard'
import { STATUS_LABELS, formatDayLabel, formatWeekRange } from './weekLabel'

/*
 * «План недели» (PRO-002c): одна цель, семь действий, привязка к
 * существующим практикам. Состояния GET /api/pro/plan: report_required →
 * сначала разбор; consent_required → приглашение согласия; not_generated →
 * кнопка «Собрать план» (POST); ready → 7 карточек с отметками выполнения
 * (POST status: planned|done|skipped) и правкой текста действия
 * (PATCH с expected_version; 409 version_conflict → перечитываем план).
 * После POST 409 generation_in_progress — ограниченный опрос GET, без
 * повторной POST-генерации. Пересборка — POST с rebuild=true; конфликт
 * пересборки (rebuild_conflict) показывает сообщение и сохранённый план.
 */

const STATUS_COLORS = {
  done: 'text-cream',
  skipped: 'text-muted',
  planned: 'text-muted',
}

function DayCard({
  day,
  editing,
  editText,
  onEditStart,
  onEditChange,
  onEditSave,
  onEditCancel,
  onStatus,
  savingStatus,
}) {
  return (
    <Card className="p-4" testId="pro-plan-day">
      <div className="flex items-baseline justify-between gap-2">
        <span className="font-label text-[12px] text-muted">
          День {day.day} · {formatDayLabel(day.date)}
        </span>
        <span className={`font-label text-[11px] ${STATUS_COLORS[day.status] || 'text-muted'}`}>
          {STATUS_LABELS[day.status] || day.status}
        </span>
      </div>

      {editing ? (
        <div className="mt-2">
          <textarea
            value={editText}
            onChange={event => onEditChange(event.target.value)}
            rows={2}
            className="w-full rounded-2xl bg-cream/5 p-3 text-[14px] leading-relaxed text-cream outline-none"
            data-testid="pro-plan-edit-input"
          />
          <div className="mt-2 flex gap-2">
            <button
              type="button"
              data-testid="pro-plan-edit-save"
              onClick={onEditSave}
              className="min-h-10 rounded-full bg-cream/5 px-3 text-[12px] font-semibold text-gold"
            >
              Сохранить
            </button>
            <button
              type="button"
              onClick={onEditCancel}
              className="min-h-10 rounded-full px-3 text-[12px] font-semibold text-muted"
            >
              Отмена
            </button>
          </div>
        </div>
      ) : (
        <p className="mt-2 text-[15px] leading-relaxed text-cream">{day.action}</p>
      )}

      {day.done_criteria && (
        <p className="mt-1 text-[12px] leading-relaxed text-muted">{day.done_criteria}</p>
      )}

      {day.practice?.title && (
        <p className="font-label mt-2 inline-block rounded-full bg-cream/5 px-3 py-1 text-[11px] text-muted">
          {day.practice.title}
        </p>
      )}

      {!editing && (
        <div className="mt-3 flex flex-wrap gap-2">
          {day.status !== 'done' && (
            <button
              type="button"
              data-testid={`pro-day-${day.day}-done`}
              disabled={savingStatus}
              onClick={() => onStatus(day, 'done')}
              className="min-h-10 rounded-full bg-cream/5 px-3 text-[12px] font-semibold text-gold disabled:opacity-50"
            >
              Выполнено
            </button>
          )}
          {day.status !== 'skipped' && (
            <button
              type="button"
              data-testid={`pro-day-${day.day}-skipped`}
              disabled={savingStatus}
              onClick={() => onStatus(day, 'skipped')}
              className="min-h-10 rounded-full bg-cream/5 px-3 text-[12px] font-semibold text-muted disabled:opacity-50"
            >
              Пропустить
            </button>
          )}
          {day.status !== 'planned' && (
            <button
              type="button"
              data-testid={`pro-day-${day.day}-reset`}
              disabled={savingStatus}
              onClick={() => onStatus(day, 'planned')}
              className="min-h-10 rounded-full px-2 text-[12px] font-semibold text-muted disabled:opacity-50"
            >
              Сбросить
            </button>
          )}
          <button
            type="button"
            data-testid={`pro-day-${day.day}-edit`}
            onClick={onEditStart}
            className="min-h-10 rounded-full px-2 text-[12px] font-semibold text-muted"
          >
            Изменить
          </button>
        </div>
      )}
    </Card>
  )
}

export default function ProPlanView({ user, onOpenReport, onOpenProgress }) {
  const [status, setStatus] = useState(null) // null — загрузка
  const [plan, setPlan] = useState(null)
  const [loadFailed, setLoadFailed] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [consentSaving, setConsentSaving] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [editText, setEditText] = useState('')
  const [message, setMessage] = useState('')
  const [crisisReply, setCrisisReply] = useState(null)
  const aliveRef = useRef(true)
  // Правка, не сохранённая из-за 409 version_conflict: после перечитывания
  // плана поле правки возвращается с тем же текстом — ввод не теряется.
  const pendingEditRef = useRef(null)

  useEffect(() => {
    aliveRef.current = true
    load()
    return () => {
      aliveRef.current = false
    }
  }, [])

  function load() {
    setLoadFailed(false)
    api.pro
      .getPlan()
      .then(data => {
        if (!aliveRef.current) return
        setStatus(data.status)
        setPlan(data.plan || null)
        const pending = pendingEditRef.current
        if (pending) {
          pendingEditRef.current = null
          const stillThere = (data.plan?.days || []).find(day => day.id === pending.id)
          if (stillThere) {
            setEditingId(pending.id)
            setEditText(pending.text)
          }
        }
      })
      .catch(error => {
        console.error(error)
        if (!aliveRef.current) return
        setLoadFailed(true)
      })
  }

  function applyPlan(data, fallbackMessage) {
    if (!aliveRef.current) return
    if (data.status === 'crisis') {
      setCrisisReply(data.reply || null)
      return
    }
    setStatus(data.status === 'ready' ? 'ready' : null)
    setPlan(data.plan || null)
    if (fallbackMessage) setMessage(fallbackMessage)
  }

  async function handleGenerate(rebuild = false) {
    if (generating) return
    if (rebuild && !window.confirm('Пересобрать план? Текущие отметки и правки будут заменены.')) {
      return
    }
    setGenerating(true)
    setMessage('')
    try {
      const res = await api.pro.createPlan(null, rebuild)
      applyPlan(res)
    } catch (error) {
      const key = error?.body?.code || error?.body?.detail
      if (key === 'generation_in_progress') {
        try {
          const final = await pollGenerationReady(() => api.pro.getPlan(), {
            isCancelled: () => !aliveRef.current,
          })
          applyPlan(final)
        } catch (pollError) {
          if (pollError instanceof ProPollCancelledError) return
          setMessage('План ещё собирается. Открой экран чуть позже.')
        }
      } else if (key === 'report_required') {
        setStatus('report_required')
      } else if (key === 'consent_required') {
        setStatus('consent_required')
      } else if (key === 'rebuild_conflict') {
        applyPlan({ status: 'ready', plan: error?.body?.plan }, error?.body?.message)
      } else {
        console.error(error)
        setMessage('Не удалось собрать план. Попробуй ещё раз.')
      }
    } finally {
      if (aliveRef.current) setGenerating(false)
    }
  }

  async function handleEnableConsent() {
    if (consentSaving || !user?.id) return
    setConsentSaving(true)
    setMessage('')
    try {
      await api.mentalix.setContextConsent(user.id, true)
      if (!aliveRef.current) return
      setStatus('not_generated')
    } catch {
      if (aliveRef.current) setMessage('Не удалось включить согласие. Попробуй ещё раз.')
    } finally {
      if (aliveRef.current) setConsentSaving(false)
    }
  }

  async function handleStatus(item, next) {
    setMessage('')
    try {
      const res = await api.pro.setPlanItemStatus(item.id, next)
      if (!aliveRef.current) return
      setPlan(current =>
        current
          ? {
              ...current,
              days: current.days.map(day =>
                day.id === res.id ? { ...day, status: res.status, version: res.version } : day
              ),
            }
          : current
      )
    } catch (error) {
      const key = error?.body?.detail || error?.body?.code
      if (key === 'not_found') {
        setMessage('План обновился на сервере. Загружаем заново…')
        setEditingId(null)
        load()
      } else {
        console.error(error)
        setMessage('Не удалось сохранить отметку. Попробуй ещё раз.')
      }
    }
  }

  function startEdit(item) {
    pendingEditRef.current = null
    setEditingId(item.id)
    setEditText(item.action)
  }

  async function saveEdit(item) {
    setMessage('')
    try {
      const res = await api.pro.patchPlanItem(item.id, {
        action: editText,
        expected_version: item.version,
      })
      if (!aliveRef.current) return
      setPlan(current =>
        current
          ? {
              ...current,
              days: current.days.map(day =>
                day.id === res.id ? { ...day, action: res.action, version: res.version } : day
              ),
            }
          : current
      )
      setEditingId(null)
    } catch (error) {
      const key = error?.body?.detail
      if (key === 'version_conflict') {
        // Ввод сохраняется: текст правки вернётся в поле после перечитывания.
        pendingEditRef.current = { id: item.id, text: editText }
        setMessage('План изменился на сервере. Загружаем актуальную версию…')
        load()
      } else {
        console.error(error)
        setMessage('Не удалось сохранить правку. Попробуй ещё раз.')
      }
    }
  }

  const loading = status === null
  const days = plan?.days || []
  const doneCount = days.filter(day => day.status === 'done').length

  return (
    <div>
      <PageTitle>план недели.</PageTitle>
      {plan && (
        <p className="font-label mt-2 text-[12px] text-muted">
          Неделя действий: {formatWeekRange(plan.plan_week_start, days[days.length - 1]?.date)}
        </p>
      )}

      {loading && <p className="mt-6 text-[13px] text-muted">Загружаем…</p>}

      {loadFailed && (
        <Card className="mt-4 p-4">
          <p className="text-[13px] text-muted">Не удалось загрузить план.</p>
          <PillButton variant="dark" onClick={load} className="mt-3 w-full">
            Повторить
          </PillButton>
        </Card>
      )}

      {!loading && !loadFailed && status === 'report_required' && (
        <Card className="mt-4 p-4">
          <p className="text-[14px] leading-relaxed text-cream">
            План строится на разборе недели — сначала собери его.
          </p>
          <PillButton variant="light" onClick={onOpenReport} className="mt-3 w-full">
            К разбору
          </PillButton>
        </Card>
      )}

      {!loading && !loadFailed && status === 'consent_required' && (
        <ProConsentCard onEnable={handleEnableConsent} saving={consentSaving} note={message} />
      )}

      {!loading && !loadFailed && status === 'not_generated' && (
        <Card className="mt-4 p-4">
          <p className="text-[14px] leading-relaxed text-cream">
            Одна цель и семь небольших действий на следующую неделю — по разбору и твоим
            существующим практикам.
          </p>
          <PillButton
            variant="light"
            testId="pro-generate-plan"
            onClick={() => handleGenerate(false)}
            disabled={generating}
            className="mt-3 w-full"
          >
            {generating ? 'Собираем план…' : 'Собрать план'}
          </PillButton>
        </Card>
      )}

      {status === 'ready' && plan && (
        <div>
          <Card className="mt-4 p-4">
            <p className="font-label text-[11px] uppercase tracking-wider text-muted">Цель недели</p>
            <p className="mt-2 text-[15px] font-semibold leading-relaxed text-cream">
              {plan.goal?.text}
            </p>
            {plan.goal?.source_reflection && (
              <p className="mt-1 text-[12px] leading-relaxed text-muted">
                {plan.goal.source_reflection}
              </p>
            )}
          </Card>

          <p className="font-label mt-4 text-[12px] text-cream" data-testid="pro-plan-progress">
            Выполнено {doneCount} из {days.length}
          </p>

          <div className="mt-2">
            {days.map(day => (
              <DayCard
                key={day.id}
                day={day}
                editing={editingId === day.id}
                editText={editText}
                onEditStart={() => startEdit(day)}
                onEditChange={setEditText}
                onEditSave={() => saveEdit(day)}
                onEditCancel={() => {
              pendingEditRef.current = null
              setEditingId(null)
            }}
                onStatus={handleStatus}
                savingStatus={false}
              />
            ))}
          </div>

          <div className="mt-6 flex flex-col gap-2">
            <PillButton variant="light" testId="pro-open-progress" onClick={onOpenProgress} className="w-full">
              Прогресс
            </PillButton>
            <PillButton
              variant="dark"
              testId="pro-rebuild-plan"
              onClick={() => handleGenerate(true)}
              disabled={generating}
              className="w-full"
            >
              {generating ? 'Собираем план…' : 'Пересобрать план'}
            </PillButton>
          </div>
        </div>
      )}

      {crisisReply && (
        <Card className="mt-4 p-4">
          <p className="text-[14px] leading-relaxed text-cream">{crisisReply}</p>
        </Card>
      )}

      {message && !crisisReply && (
        <p role="status" className="mt-3 text-[12px] leading-relaxed text-muted">
          {message}
        </p>
      )}
    </div>
  )
}
