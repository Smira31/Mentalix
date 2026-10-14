import { useEffect, useRef, useState } from 'react'

import { api } from '../../lib/api'
import {
  ProPollCancelledError,
  pollGenerationReady,
} from '../../lib/proGenerationPolling'
import { useAutoFocusField } from '../../lib/useAutoFocusField'
import PageTitle from '../../components/ui/PageTitle'
import Card from '../../components/ui/Card'
import PillButton from '../../components/ui/PillButton'
import ProConsentCard from './ProConsentCard'
import ProStateCard from './ProStateCard'
import { proBlockedState, proErrorKey, proStatePayload } from './proApiState'
import { STATUS_LABELS, formatDayLabel, formatWeekRange } from './weekLabel'

/*
 * «План недели» (PRO-002c): одна цель, семь действий, привязка к
 * существующим практикам. Состояния GET /api/pro/plan: report_required →
 * сначала разбор; consent_required → приглашение согласия; not_generated →
 * кнопка «Собрать план» (POST); ready|partial → карточки с отметками
 * выполнения (POST status: planned|done|skipped).
 *
 * Полный согласованный редактор: правка общей цели недели (PATCH
 * goal_text + expected_version — общая цель меняет все дни, поэтому после
 * ответа план перечитывается целиком) и правка действия И критерия
 * выполнения каждого дня (PATCH action + done_criteria +
 * expected_version; 409 version_conflict → ввод сохраняется и
 * предлагается осознанное обновление/повтор, не автосохранение).
 *
 * Защита от гонок: один слот сохранения (saving) блокирует повторное
 * сохранение пункта и повторные смены статуса на время запроса;
 * поздние ответы загрузки/сохранения отбрасываются по номеру запроса
 * (loadSeqRef) и размонтированию (aliveRef). Опрос после POST 409
 * generation_in_progress — ограниченный GET, без повторной POST-генерации.
 */

const STATUS_COLORS = {
  done: 'text-cream',
  skipped: 'text-muted',
  planned: 'text-muted',
}

/* Известные статусы GET /api/pro/plan: любое другое значение — не загрузка. */
const KNOWN_STATUSES = new Set([
  'report_required',
  'consent_required',
  'not_generated',
  'ready',
  'partial',
])

function DayCard({
  day,
  editing,
  editText,
  editCriteria,
  busy,
  savingThis,
  onEditStart,
  onEditChange,
  onCriteriaChange,
  onEditSave,
  onEditCancel,
  onStatus,
}) {
  /*
   * MXL-KEYBOARD-001: «Изменить» — явный вход в шаг записи, поэтому основное
   * поле правки получает фокус само, без второго нажатия по полю. Ключ
   * активации — день: выход из правки снимает попытку, повторный вход в тот
   * же день даёт новую. Второе поле шага (критерий) фокус не забирает.
   */
  const actionRef = useRef(null)

  useAutoFocusField(actionRef, editing ? day.id : null)

  return (
    <Card className="p-4" testId="pro-plan-day">
      <div className="flex items-baseline justify-between gap-2">
        <span className="font-label text-[12px] text-muted">
          {[`День ${day.day}`, formatDayLabel(day.date)].filter(Boolean).join(' · ')}
        </span>
        <span className={`font-label text-[11px] ${STATUS_COLORS[day.status] || 'text-muted'}`}>
          {STATUS_LABELS[day.status] || day.status}
        </span>
      </div>

      {editing ? (
        <div className="mt-2">
          <textarea
            ref={actionRef}
            value={editText}
            onChange={event => onEditChange(event.target.value)}
            rows={2}
            className="w-full rounded-2xl bg-cream/5 p-3 text-[16px] leading-relaxed text-cream outline-none"
            data-testid="pro-plan-edit-input"
          />
          <p className="font-label mt-2 text-[11px] uppercase tracking-wider text-muted">
            Критерий выполнения
          </p>
          <textarea
            value={editCriteria}
            onChange={event => onCriteriaChange(event.target.value)}
            rows={2}
            className="mt-1 w-full rounded-2xl bg-cream/5 p-3 text-[16px] leading-relaxed text-muted outline-none"
            data-testid="pro-plan-edit-criteria"
          />
          <div className="mt-2 flex gap-2">
            <button
              type="button"
              data-testid="pro-plan-edit-save"
              disabled={busy}
              onClick={onEditSave}
              className="min-h-10 rounded-full bg-cream/5 px-3 text-[12px] font-semibold text-gold disabled:opacity-50"
            >
              {savingThis ? 'Сохраняем…' : 'Сохранить'}
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={onEditCancel}
              className="min-h-10 rounded-full px-3 text-[12px] font-semibold text-muted disabled:opacity-50"
            >
              Отмена
            </button>
          </div>
        </div>
      ) : (
        <>
          <p className="mt-2 text-[15px] leading-relaxed text-cream">{day.action}</p>
          {day.done_criteria && (
            <p className="mt-1 text-[12px] leading-relaxed text-muted">{day.done_criteria}</p>
          )}
        </>
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
              disabled={busy}
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
              disabled={busy}
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
              disabled={busy}
              onClick={() => onStatus(day, 'planned')}
              className="min-h-10 rounded-full px-2 text-[12px] font-semibold text-muted disabled:opacity-50"
            >
              Сбросить
            </button>
          )}
          <button
            type="button"
            data-testid={`pro-day-${day.day}-edit`}
            disabled={busy}
            onClick={onEditStart}
            className="min-h-10 rounded-full px-2 text-[12px] font-semibold text-muted disabled:opacity-50"
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
  // Терминальные состояния доступа: 402 pro_required и 404 pro_*_disabled.
  const [blocked, setBlocked] = useState(null)
  const [insufficient, setInsufficient] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [consentSaving, setConsentSaving] = useState(false)
  // Один слот сохранения: {kind: 'edit'|'goal'|'status', id} или null.
  const [saving, setSaving] = useState(null)
  const [editingId, setEditingId] = useState(null)
  const [editText, setEditText] = useState('')
  const [editCriteria, setEditCriteria] = useState('')
  const [editingGoal, setEditingGoal] = useState(false)
  const [goalText, setGoalText] = useState('')
  // 409 version_conflict: правка ждёт осознанного решения пользователя.
  const [conflict, setConflict] = useState(null) // {goal?, id?, text, criteria?}
  const [message, setMessage] = useState('')
  const [crisisReply, setCrisisReply] = useState(null)
  const aliveRef = useRef(true)
  // Номер актуального запроса состояния: поздний ответ (уход с экрана,
  // смена экрана, повторная загрузка, завершение опроса) не затирает новое
  // состояние и введённый текст.
  const loadSeqRef = useRef(0)
  // Правка, не сохранённая из-за 409 version_conflict: после осознанного
  // обновления плана поле правки возвращается с тем же текстом — ввод не
  // теряется. retry — «повторить сохранение» поверх актуальной версии.
  const pendingEditRef = useRef(null)
  // MXL-KEYBOARD-001: вход в правку общей цели — шаг записи, поле получает
  // фокус само. Ключ активации — сама правка цели.
  const goalRef = useRef(null)

  useAutoFocusField(goalRef, editingGoal ? 'pro-goal-edit' : null)

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
    setInsufficient(false)
    api.pro
      .getPlan()
      .then(data => {
        // Поздний ответ: экран уже перезагружен или сменился — не применяем.
        if (!aliveRef.current || seq !== loadSeqRef.current) return
        const payload = proStatePayload(data)
        if (!payload) {
          // Ответ без состояния Pro (пусто, массив, чужой формат): данные не
          // доставлены. Показываем состояние ошибки с повтором; уже загруженный
          // план и введённый текст правки не стираются, сборка не запускается.
          setLoadFailed(true)
          return
        }
        setStatus(payload.status)
        setPlan(payload.plan || null)
        setBlocked(null)
        const pending = pendingEditRef.current
        if (pending) {
          pendingEditRef.current = null
          if (pending.goal) {
            setConflict(null)
            setEditingGoal(true)
            setGoalText(pending.text)
            if (pending.retry) saveGoal(pending.text)
            return
          }
          const day = (data.plan?.days || []).find(item => item.id === pending.id)
          if (day) {
            setConflict(null)
            setEditingId(day.id)
            setEditText(pending.text)
            setEditCriteria(pending.criteria ?? day.done_criteria ?? '')
            if (pending.retry) saveEdit(day, pending.text, pending.criteria)
          }
        }
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

  function applyPlan(data, seq, fallbackMessage) {
    if (!aliveRef.current || seq !== loadSeqRef.current) return
    const payload = proStatePayload(data)
    if (!payload) {
      // Ответ на сборку без состояния Pro: состояние перечитывается GET-ом
      // (та же ручка, что и при «сервер обновился»); повторная POST-генерация
      // не отправляется.
      load()
      return
    }
    if (payload.status === 'crisis') {
      setCrisisReply(payload.reply || null)
      return
    }
    setStatus(payload.status)
    setPlan(payload.plan || null)
    if (fallbackMessage) setMessage(fallbackMessage)
  }

  async function handleGenerate(rebuild = false) {
    if (generating || saving) return
    if (rebuild && !window.confirm('Пересобрать план? Текущие отметки и правки будут заменены.')) {
      return
    }
    const seq = ++loadSeqRef.current
    setGenerating(true)
    setMessage('')
    setInsufficient(false)
    try {
      const res = await api.pro.createPlan(null, rebuild)
      applyPlan(res, seq)
    } catch (error) {
      const key = proErrorKey(error)
      const block = proBlockedState(key)
      if (!aliveRef.current || seq !== loadSeqRef.current) return
      if (block) {
        setBlocked(block)
      } else if (key === 'generation_in_progress') {
        try {
          const final = await pollGenerationReady(() => api.pro.getPlan(), {
            isCancelled: () => !aliveRef.current,
          })
          applyPlan(final, seq)
        } catch (pollError) {
          if (pollError instanceof ProPollCancelledError) return
          if (!aliveRef.current) return
          setMessage('План ещё собирается — это занимает до минуты. Открой экран чуть позже.')
        }
      } else if (key === 'report_required') {
        setStatus('report_required')
      } else if (key === 'consent_required') {
        setStatus('consent_required')
      } else if (key === 'insufficient_data') {
        setInsufficient(true)
      } else if (key === 'rebuild_conflict') {
        applyPlan(
          { status: 'ready', plan: error?.body?.plan },
          seq,
          error?.body?.message || 'План уже собран и изменён. Пересборка не выполнена.'
        )
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
    if (saving) return
    setSaving({ kind: 'status', id: item.id })
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
      if (!aliveRef.current) return
      const key = proErrorKey(error)
      if (key === 'not_found') {
        setMessage('План обновился на сервере. Загружаем заново…')
        load()
      } else {
        console.error(error)
        setMessage('Не удалось сохранить отметку. Попробуй ещё раз.')
      }
    } finally {
      if (aliveRef.current) setSaving(null)
    }
  }

  function startEdit(item) {
    pendingEditRef.current = null
    setConflict(null)
    setEditingId(item.id)
    setEditText(item.action)
    setEditCriteria(item.done_criteria || '')
  }

  function cancelEdit(item) {
    pendingEditRef.current = null
    setEditingId(null)
    if (conflict && !conflict.goal && conflict.id === item.id) setConflict(null)
  }

  async function saveEdit(item, text = editText, criteria = editCriteria) {
    if (saving) return
    setSaving({ kind: 'edit', id: item.id })
    setMessage('')
    try {
      const res = await api.pro.patchPlanItem(item.id, {
        action: text,
        done_criteria: criteria,
        expected_version: item.version,
      })
      if (!aliveRef.current) return
      setPlan(current =>
        current
          ? {
              ...current,
              days: current.days.map(day =>
                day.id === res.id
                  ? {
                      ...day,
                      action: res.action,
                      done_criteria: res.done_criteria,
                      version: res.version,
                    }
                  : day
              ),
            }
          : current
      )
      setEditingId(null)
      setConflict(null)
    } catch (error) {
      if (!aliveRef.current) return
      const key = proErrorKey(error)
      if (key === 'version_conflict') {
        // Ввод сохраняется в поле и в pendingEditRef: пользователь осознанно
        // выбирает «Обновить план» или «Повторить сохранение».
        setConflict({ id: item.id, text, criteria })
      } else if (key === 'not_found') {
        setMessage('План обновился на сервере. Загружаем заново…')
        pendingEditRef.current = { id: item.id, text, criteria }
        load()
      } else {
        console.error(error)
        setMessage('Не удалось сохранить правку. Попробуй ещё раз.')
      }
    } finally {
      if (aliveRef.current) setSaving(null)
    }
  }

  function startGoalEdit() {
    pendingEditRef.current = null
    setConflict(null)
    setEditingGoal(true)
    setGoalText(plan?.goal?.text || '')
  }

  function cancelGoalEdit() {
    pendingEditRef.current = null
    setEditingGoal(false)
    if (conflict?.goal) setConflict(null)
  }

  async function saveGoal(text = goalText) {
    const first = plan?.days?.[0]
    if (saving || !first) return
    setSaving({ kind: 'goal', id: first.id })
    setMessage('')
    try {
      await api.pro.patchPlanItem(first.id, {
        goal_text: text,
        expected_version: first.version,
      })
      if (!aliveRef.current) return
      setEditingGoal(false)
      setConflict(null)
      // Общая цель хранится в каждом дне: сервер повышает версии всех дней —
      // перечитываем согласованное состояние целиком.
      load()
    } catch (error) {
      if (!aliveRef.current) return
      const key = proErrorKey(error)
      if (key === 'version_conflict') {
        setConflict({ goal: true, text })
      } else if (key === 'not_found') {
        setMessage('План обновился на сервере. Загружаем заново…')
        pendingEditRef.current = { goal: true, text }
        load()
      } else {
        console.error(error)
        setMessage('Не удалось сохранить цель. Попробуй ещё раз.')
      }
    } finally {
      if (aliveRef.current) setSaving(null)
    }
  }

  function resolveConflict(retry) {
    if (!conflict) return
    pendingEditRef.current = conflict.goal
      ? { goal: true, text: conflict.text }
      : { id: conflict.id, text: conflict.text, criteria: conflict.criteria, retry }
    setConflict(null)
    load()
  }

  // Недоставленное состояние или отказ доступа — не «загрузка»: экран уже
  // показывает карточку состояния с действием.
  const loading = status === null && !loadFailed && !blocked
  const busy = saving !== null
  const days = plan?.days || []
  const doneCount = days.filter(day => day.status === 'done').length
  // Метка недели строится только из распознанных дат: без plan_week_start
  // (или с нераспознанной) заголовка нет вовсе.
  const weekTitle = formatWeekRange(plan?.plan_week_start, days[days.length - 1]?.date)
  const showPlan = (status === 'ready' || status === 'partial') && plan

  return (
    <div>
      <PageTitle>план недели.</PageTitle>
      {plan && weekTitle && (
        <p className="font-label mt-2 text-[12px] text-muted" data-testid="pro-plan-week">
          Неделя действий: {weekTitle}
        </p>
      )}

      {loading && <p className="mt-6 text-[13px] text-muted">Загружаем…</p>}

      {blocked && <ProStateCard title={blocked.title} text={blocked.text} testId="pro-blocked-state" />}

      {loadFailed && (
        <Card className="mt-4 p-4">
          <p className="text-[13px] text-muted">Не удалось загрузить план.</p>
          <PillButton variant="dark" onClick={load} className="mt-3 w-full">
            Повторить
          </PillButton>
        </Card>
      )}

      {insufficient && (
        <ProStateCard
          title="Недостаточно данных"
          text="За эту неделю слишком мало записей. План следующей недели соберётся из новых записей."
          actionLabel="Понятно"
          onAction={() => setInsufficient(false)}
          testId="pro-insufficient-state"
        />
      )}

      {!loading && !loadFailed && !blocked && status === 'report_required' && (
        <ProStateCard
          text="План строится на разборе недели — сначала собери его."
          actionLabel="К разбору"
          onAction={onOpenReport}
          testId="pro-plan-report-required"
        />
      )}

      {!loading && !loadFailed && !blocked && status === 'consent_required' && (
        <ProConsentCard onEnable={handleEnableConsent} saving={consentSaving} note={message} />
      )}

      {!loading && !loadFailed && !blocked && status === 'not_generated' && (
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

      {!loading && !loadFailed && !blocked && status !== null && !KNOWN_STATUSES.has(status) && (
        <ProStateCard
          title="Неожиданное состояние"
          text="Сервер вернул незнакомый статус плана. Попробуй обновить экран."
          actionLabel="Повторить"
          onAction={load}
          testId="pro-unknown-state"
        />
      )}

      {showPlan && (
        <div>
          {status === 'partial' && (
            <p className="mt-2 text-[12px] leading-relaxed text-muted">
              План собран не полностью — часть дней ещё появится.
            </p>
          )}

          {editingGoal ? (
            <Card className="mt-4 p-4">
              <p className="font-label text-[11px] uppercase tracking-wider text-muted">
                Цель недели
              </p>
              <textarea
                ref={goalRef}
                value={goalText}
                onChange={event => setGoalText(event.target.value)}
                rows={2}
                className="mt-2 w-full rounded-2xl bg-cream/5 p-3 text-[16px] leading-relaxed text-cream outline-none"
                data-testid="pro-goal-edit-input"
              />
              <div className="mt-2 flex gap-2">
                <button
                  type="button"
                  data-testid="pro-goal-edit-save"
                  disabled={busy}
                  onClick={() => saveGoal()}
                  className="min-h-10 rounded-full bg-cream/5 px-3 text-[12px] font-semibold text-gold disabled:opacity-50"
                >
                  {saving?.kind === 'goal' ? 'Сохраняем…' : 'Сохранить'}
                </button>
                <button
                  type="button"
                  disabled={busy}
                  onClick={cancelGoalEdit}
                  className="min-h-10 rounded-full px-3 text-[12px] font-semibold text-muted disabled:opacity-50"
                >
                  Отмена
                </button>
              </div>
            </Card>
          ) : (
            <Card className="mt-4 p-4">
              <div className="flex items-baseline justify-between gap-2">
                <p className="font-label text-[11px] uppercase tracking-wider text-muted">
                  Цель недели
                </p>
                <button
                  type="button"
                  data-testid="pro-goal-edit"
                  disabled={busy}
                  onClick={startGoalEdit}
                  className="min-h-10 text-[12px] font-semibold text-muted disabled:opacity-50"
                >
                  Изменить
                </button>
              </div>
              <p className="mt-2 text-[15px] font-semibold leading-relaxed text-cream">
                {plan.goal?.text}
              </p>
              {plan.goal?.source_reflection && (
                <p className="mt-1 text-[12px] leading-relaxed text-muted">
                  {plan.goal.source_reflection}
                </p>
              )}
            </Card>
          )}

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
                editCriteria={editCriteria}
                busy={busy}
                savingThis={saving?.kind === 'edit' && saving.id === day.id}
                onEditStart={() => startEdit(day)}
                onEditChange={setEditText}
                onCriteriaChange={setEditCriteria}
                onEditSave={() => saveEdit(day)}
                onEditCancel={() => cancelEdit(day)}
                onStatus={handleStatus}
              />
            ))}
          </div>

          {conflict && (
            <Card className="mt-4 p-4" testId="pro-conflict-card">
              <p className="text-[14px] font-semibold text-cream">План изменился на сервере</p>
              <p className="mt-1 text-[12px] leading-relaxed text-muted">
                Твой вариант сохранён в поле правки. Обнови план до последней версии или повтори
                сохранение поверх актуальной.
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  data-testid="pro-conflict-refresh"
                  disabled={busy}
                  onClick={() => resolveConflict(false)}
                  className="min-h-10 rounded-full bg-cream/5 px-3 text-[12px] font-semibold text-gold disabled:opacity-50"
                >
                  Обновить план
                </button>
                <button
                  type="button"
                  data-testid="pro-conflict-retry"
                  disabled={busy}
                  onClick={() => resolveConflict(true)}
                  className="min-h-10 rounded-full bg-cream/5 px-3 text-[12px] font-semibold text-gold disabled:opacity-50"
                >
                  Повторить сохранение
                </button>
                <button
                  type="button"
                  onClick={() => {
                    pendingEditRef.current = null
                    setConflict(null)
                    setEditingId(null)
                    setEditingGoal(false)
                  }}
                  className="min-h-10 rounded-full px-3 text-[12px] font-semibold text-muted"
                >
                  Отменить правку
                </button>
              </div>
            </Card>
          )}

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
