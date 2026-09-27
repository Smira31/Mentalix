import { getFullscreenPortalTarget } from '../lib/fullscreenSurface'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { Check, Plus, Search, Trash2 } from 'lucide-react'
import BackButton from '../components/BackButton'
import NestedScreenHeader, { RoundBackButton } from '../components/NestedScreenHeader'
import JournalTextarea from '../components/JournalTextarea'
import PracticeWritingCanvas from '../components/PracticeWritingCanvas'
import {
  FULLSCREEN_HEADER_SLOT_CLASS,
  FULLSCREEN_SCROLL_CLASS,
  FULLSCREEN_SHELL_CLASS,
  useFullscreenSurface,
} from '../lib/fullscreenSurface'
import { api } from '../lib/api'
import { platform, platformName } from '../platform'
import {
  readJournalDraft,
  saveJournalDraft,
  clearJournalDraft,
  listJournalDrafts,
  generateIdempotencyKey,
  isKeyValid,
} from '../lib/journalDraftV3'
import MoodPractice from './MoodPractice'

const STEP_TYPES = [
  ['prompt', 'Вопрос'],
  ['free_text', 'Свободный текст'],
  ['scale', 'Шкала'],
  ['emotion', 'Эмоция'],
  ['checklist', 'Список'],
]

function emptyBuilder() {
  return {
    title: '',
    description: '',
    category: 'личное',
    steps: [
      {
        id: 'step-1',
        type: 'free_text',
        title: 'Что хочешь заметить?',
        required: false,
      },
    ],
  }
}

function stepAnswerIsPresent(answer) {
  return Array.isArray(answer) ? answer.length > 0 : Boolean(String(answer || '').trim())
}

function StepInput({ step, value, onChange }) {
  if (step.type === 'scale') {
    const min = step.validation?.min || 1
    const max = step.validation?.max || 5
    return (
      <div className="mt-6 grid grid-cols-5 gap-2" role="radiogroup" aria-label={step.title}>
        {Array.from({ length: max - min + 1 }, (_, index) => min + index).map(level => (
          <button
            key={level}
            type="button"
            role="radio"
            aria-checked={value === level}
            onClick={() => onChange(level)}
            className={[
              'min-h-12 rounded-2xl text-[15px] font-bold',
              value === level ? 'bg-gold text-emerald-deep' : 'bg-emerald text-muted',
            ].join(' ')}
          >
            {level}
          </button>
        ))}
      </div>
    )
  }

  if (step.type === 'checklist') {
    const selected = Array.isArray(value) ? value : []
    return (
      <div className="mt-6 space-y-2" aria-label={step.title}>
        {(step.options || []).map(option => {
          const checked = selected.includes(option)
          return (
            <label
              key={option}
              className="flex min-h-12 items-center gap-3 rounded-2xl bg-emerald px-4 text-[14px] text-cream"
            >
              <input
                type="checkbox"
                checked={checked}
                onChange={() =>
                  onChange(
                    checked ? selected.filter(item => item !== option) : [...selected, option]
                  )
                }
                className="h-5 w-5 accent-gold"
              />
              {option}
            </label>
          )
        })}
      </div>
    )
  }

  return (
    <JournalTextarea
      writingCanvas
      autoFocus
      value={typeof value === 'string' ? value : ''}
      onChange={onChange}
      placeholder={step.helper || 'Напиши столько, сколько сейчас нужно.'}
      ariaLabel={step.title}
      className="mt-6 min-h-[16rem]"
      editorClassName="min-h-[16rem]"
      formatting={step.type !== 'emotion'}
    />
  )
}

function formatArchiveDate(value) {
  if (!value) return 'Дата не указана'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Дата не указана'
  return new Intl.DateTimeFormat('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

function ReadOnlyAnswer({ step, value }) {
  const hasAnswer = stepAnswerIsPresent(value) || typeof value === 'number'
  if (!hasAnswer) {
    return <p className="mt-3 text-[13px] text-faint">Без ответа</p>
  }

  if (Array.isArray(value)) {
    return (
      <ul className="mt-3 space-y-2" aria-label={`Сохранённый ответ: ${step.title}`}>
        {value.map(item => (
          <li key={item} className="rounded-xl bg-emerald-light px-3 py-2 text-[14px] text-cream">
            {String(item)}
          </li>
        ))}
      </ul>
    )
  }

  if (step.type === 'scale') {
    return <p className="mt-3 text-[15px] font-semibold text-gold">Значение: {String(value)}</p>
  }

  return (
    <p className="mt-3 whitespace-pre-wrap break-words text-[14px] leading-relaxed text-cream">
      {String(value)}
    </p>
  )
}

function CompletedSessionViewer({ completedSession, onClose }) {
  const { style: surfaceStyle } = useFullscreenSurface()
  const template = completedSession.template || {}
  const steps = Array.isArray(template.steps) ? template.steps : []

  useEffect(() => {
    const onKeyDown = event => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [onClose])

  return createPortal(
    <section
      role="dialog"
      aria-modal="true"
      aria-label="Архив завершённой направленной записи"
      className={FULLSCREEN_SHELL_CLASS}
      style={surfaceStyle}
    >
      <header
        className={`${FULLSCREEN_HEADER_SLOT_CLASS} flex items-center px-[var(--mx-screen-x)]`}
      >
        <div className="w-full max-w-md mx-auto">
          <RoundBackButton onClick={onClose} label="К архиву" />
        </div>
      </header>
      <div className={FULLSCREEN_SCROLL_CLASS}>
        <div className="w-full max-w-md mx-auto px-[var(--mx-screen-x)] pb-8">
          <p className="text-[12px] font-bold uppercase tracking-wide text-gold">Архив записи</p>
          <h3 className="mt-3 font-display text-[28px] leading-tight text-cream">
            {template.title || 'Направленная запись'}
          </h3>
          <p className="mt-3 text-[13px] leading-relaxed text-muted">
            Завершено:{' '}
            {formatArchiveDate(completedSession.completedAt || completedSession.updatedAt)}
            {' · '}версия {completedSession.templateVersion || template.version || '—'}
          </p>
          {template.description && (
            <p className="mt-3 text-[14px] leading-relaxed text-muted">{template.description}</p>
          )}
          <div className="mt-6 space-y-3">
            {steps.map((step, index) => (
              <article key={step.id || index} className="rounded-3xl bg-emerald p-4">
                <p className="text-[11px] font-bold uppercase tracking-wide text-gold">
                  Шаг {index + 1} ·{' '}
                  {STEP_TYPES.find(([type]) => type === step.type)?.[1] || 'Ответ'}
                </p>
                <h4 className="mt-2 text-[15px] font-semibold leading-snug text-cream">
                  {step.title}
                </h4>
                <ReadOnlyAnswer step={step} value={completedSession.answers?.[step.id]} />
              </article>
            ))}
          </div>
          {steps.length === 0 && (
            <p className="mt-6 rounded-2xl bg-emerald p-4 text-[14px] text-muted">
              В сохранённом снимке не осталось вопросов для отображения.
            </p>
          )}
          <p className="mt-7 rounded-2xl border border-cream/10 p-4 text-[12px] leading-relaxed text-faint">
            Это архив направленной записи. Он не создаёт отдельную запись в Journey и пока не
            интегрирован с History.
          </p>
        </div>
      </div>
    </section>,
    getFullscreenPortalTarget()
  )
}

function TemplateBuilder({ user, onBack, onSaved, initialTemplate = null }) {
  const isEditing = Boolean(initialTemplate)
  const [draft, setDraft] = useState(() =>
    initialTemplate
      ? {
          title: initialTemplate.title || '',
          description: initialTemplate.description || '',
          category: initialTemplate.category || 'личное',
          steps: initialTemplate.steps || emptyBuilder().steps,
        }
      : emptyBuilder()
  )
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  function updateStep(index, patch) {
    setDraft(current => ({
      ...current,
      steps: current.steps.map((step, stepIndex) =>
        stepIndex === index ? { ...step, ...patch } : step
      ),
    }))
  }

  function addStep() {
    setDraft(current => ({
      ...current,
      steps: [
        ...current.steps,
        {
          id: `step-${current.steps.length + 1}`,
          type: 'free_text',
          title: `Шаг ${current.steps.length + 1}`,
          required: false,
        },
      ],
    }))
  }

  async function save() {
    setSaving(true)
    setError('')
    try {
      const saved = isEditing
        ? await api.journalTemplates.update(initialTemplate.id, user.id, draft)
        : await api.journalTemplates.create(user.id, draft)
      platform.haptic('success')
      onSaved(saved)
    } catch {
      setError('Не удалось сохранить личный шаблон. Существующая версия осталась без изменений.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <section className="animate-fade-in">
      <NestedScreenHeader
        title={isEditing ? 'редактировать шаблон.' : 'свой шаблон.'}
        onBack={onBack}
        registerSystemBack={false}
      />

      <div className="mt-5 space-y-4">
        <input
          value={draft.title}
          onChange={event => setDraft(current => ({ ...current, title: event.target.value }))}
          placeholder="Название"
          aria-label="Название шаблона"
          className="min-h-12 w-full rounded-2xl bg-emerald px-4 text-[16px] text-cream outline-none placeholder:text-muted"
        />
        <PracticeWritingCanvas
          value={draft.description}
          onChange={value => setDraft(current => ({ ...current, description: value }))}
          question="Описание шаблона"
          placeholder="Коротко: для чего этот шаблон?"
          ariaLabel="Описание шаблона"
        />
        <input
          value={draft.category}
          onChange={event => setDraft(current => ({ ...current, category: event.target.value }))}
          placeholder="Категория"
          aria-label="Категория шаблона"
          className="min-h-12 w-full rounded-2xl bg-emerald px-4 text-[16px] text-cream outline-none placeholder:text-muted"
        />

        <div className="space-y-3">
          {draft.steps.map((step, index) => (
            <div key={step.id} className="rounded-3xl bg-emerald p-4">
              <div className="flex items-center gap-3">
                <span className="text-[12px] font-bold text-gold">Шаг {index + 1}</span>
                {draft.steps.length > 1 && (
                  <button
                    type="button"
                    onClick={() =>
                      setDraft(current => ({
                        ...current,
                        steps: current.steps.filter((_, itemIndex) => itemIndex !== index),
                      }))
                    }
                    aria-label={`Удалить шаг ${index + 1}`}
                    className="ml-auto text-muted active:text-gold"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
              <input
                value={step.title}
                onChange={event => updateStep(index, { title: event.target.value })}
                aria-label={`Название шага ${index + 1}`}
                className="mt-3 min-h-11 w-full bg-transparent text-[16px] text-cream outline-none placeholder:text-muted"
              />
              <select
                value={step.type}
                onChange={event => updateStep(index, { type: event.target.value })}
                aria-label={`Тип шага ${index + 1}`}
                className="mt-2 min-h-11 w-full rounded-xl bg-emerald-light px-3 text-[15px] text-cream"
              >
                {STEP_TYPES.map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
              <label className="mt-3 flex items-center gap-2 text-[13px] text-muted">
                <input
                  type="checkbox"
                  checked={step.required}
                  onChange={event => updateStep(index, { required: event.target.checked })}
                  className="h-4 w-4 accent-gold"
                />
                Обязательный ответ
              </label>
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={addStep}
          disabled={draft.steps.length >= 12}
          className="flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl border border-cream/15 text-[14px] font-semibold text-cream disabled:opacity-40"
        >
          <Plus size={17} /> Добавить шаг
        </button>

        {error && (
          <p role="alert" className="text-[13px] text-muted">
            {error}
          </p>
        )}
        <button
          type="button"
          disabled={
            saving ||
            !draft.title.trim() ||
            !draft.description.trim() ||
            !draft.category.trim() ||
            draft.steps.some(step => !step.title.trim())
          }
          onClick={save}
          className="min-h-14 w-full rounded-full bg-gold px-[var(--mx-screen-x)] text-[15px] font-semibold text-emerald-deep disabled:opacity-35"
        >
          {saving ? 'Сохраняю…' : isEditing ? 'Сохранить новую версию' : 'Сохранить личный шаблон'}
        </button>
        <p className="text-[12px] leading-relaxed text-faint">
          Личный шаблон виден только тебе. При редактировании создаётся новая версия; начатые сессии
          сохраняют прежний набор вопросов.
        </p>
      </div>
    </section>
  )
}

export default function GuidedJournals({ user, onExit, onInputModeChange }) {
  const canUseGuidedJournals = Number(user?.id) > 0
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('')
  const [templates, setTemplates] = useState(null)
  const [allCategories, setAllCategories] = useState([])
  const [activeDrafts, setActiveDrafts] = useState([])
  const [completedSessions, setCompletedSessions] = useState(null)
  const [completedSessionsLoading, setCompletedSessionsLoading] = useState(true)
  const [completedSessionsError, setCompletedSessionsError] = useState('')
  const [completedSession, setCompletedSession] = useState(null)
  const [selected, setSelected] = useState(null)
  const [draft, setDraft] = useState(null)
  const [stepIndex, setStepIndex] = useState(0)
  const [flowStage, setFlowStage] = useState(null) // 'writing' | 'submitting' | 'mood-offer' | 'mood' | 'result' | 'error'
  const [submitError, setSubmitError] = useState(null)
  const [builderOpen, setBuilderOpen] = useState(false)

  // G8: панель вкладок скрыта на экране создания/редактирования шаблона
  useEffect(() => {
    onInputModeChange?.(builderOpen)
    return () => onInputModeChange?.(false)
  }, [builderOpen, onInputModeChange])
  const [editingTemplate, setEditingTemplate] = useState(null)
  const [deletingTemplate, setDeletingTemplate] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const categories = useMemo(() => allCategories, [allCategories])

  useEffect(() => {
    if (!canUseGuidedJournals) return undefined
    let active = true
    const timeoutId = window.setTimeout(async () => {
      if (active) setError('')
      try {
        const list = await api.journalTemplates.list(user.id, {
          q: query || undefined,
          category: category || undefined,
        })
        if (active) setTemplates(list)
      } catch {
        if (active) {
          setTemplates([])
          setError('Не удалось загрузить шаблоны. Попробуй ещё раз, когда появится связь.')
        }
      }
    }, 250)

    return () => {
      active = false
      window.clearTimeout(timeoutId)
    }
  }, [canUseGuidedJournals, query, category, user.id])

  useEffect(() => {
    if (!canUseGuidedJournals) return undefined
    let active = true
    api.journalTemplates
      .list(user.id)
      .then(items => {
        if (active)
          setAllCategories([...new Set((items || []).map(item => item.category).filter(Boolean))])
      })
      .catch(() => {
        if (active) setAllCategories([])
      })
    return () => {
      active = false
    }
  }, [canUseGuidedJournals, user.id])

  useEffect(() => {
    if (!canUseGuidedJournals) return
    setActiveDrafts(listJournalDrafts(user.id))
  }, [canUseGuidedJournals, user.id])

  const loadCompletedSessions = useCallback(async () => {
    if (!canUseGuidedJournals) return
    setCompletedSessionsLoading(true)
    setCompletedSessionsError('')
    try {
      const items = await api.journalTemplates.sessions(user.id, 'completed')
      setCompletedSessions(Array.isArray(items) ? items : [])
    } catch {
      setCompletedSessions([])
      setCompletedSessionsError(
        'Не удалось загрузить архив. Попробуй ещё раз, когда появится связь.'
      )
    } finally {
      setCompletedSessionsLoading(false)
    }
  }, [canUseGuidedJournals, user.id])

  useEffect(() => {
    if (!canUseGuidedJournals) return undefined
    const timeoutId = window.setTimeout(() => {
      void loadCompletedSessions()
    }, 0)
    return () => window.clearTimeout(timeoutId)
  }, [canUseGuidedJournals, loadCompletedSessions])

  async function openTemplate(template) {
    if (!canUseGuidedJournals) return
    setLoading(true)
    setError('')
    try {
      const detail = await api.journalTemplates.get(template.id, user.id)
      setSelected(detail)
    } catch {
      setError('Не удалось открыть этот шаблон.')
    } finally {
      setLoading(false)
    }
  }

  function resumeDraft(templateId, templateTitle) {
    const existing = readJournalDraft(user.id, templateId)
    const answers = existing?.answers || {}
    // Найти шаблон в загруженном списке, если есть
    const template = templates?.find(t => t.id === templateId) || null
    setSelected(template)
    const steps = template?.steps || []
    const firstUnanswered = steps.findIndex(step => !stepAnswerIsPresent(answers[step.id]))
    setStepIndex(firstUnanswered === -1 ? Math.max(steps.length - 1, 0) : firstUnanswered)
    setDraft({
      answers,
      template_id: templateId,
      idempotency_key: existing?.idempotency_key || null,
    })
    setFlowStage('writing')
    setSubmitError(null)
  }

  function startDraft() {
    if (!canUseGuidedJournals || !selected) return
    const existing = readJournalDraft(user.id, selected.id)
    const answers = existing?.answers || {}
    const steps = selected.steps || []
    const firstUnanswered = steps.findIndex(step => !stepAnswerIsPresent(answers[step.id]))
    setStepIndex(firstUnanswered === -1 ? Math.max(steps.length - 1, 0) : firstUnanswered)
    setDraft({
      answers,
      template_id: selected.id,
      idempotency_key: existing?.idempotency_key || null,
    })
    setFlowStage('writing')
    setSubmitError(null)
  }

  function updateAnswer(stepId, value) {
    const nextAnswers = { ...(draft?.answers || {}), [stepId]: value }
    const updatedDraft = { ...draft, answers: nextAnswers }
    setDraft(updatedDraft)
    // Debounced autosave to localStorage (no server call)
    saveJournalDraft(
      user.id,
      selected.id,
      nextAnswers,
      updatedDraft.idempotency_key,
      selected.title
    )
  }

  async function submitComplete() {
    if (flowStage === 'submitting') return // double-tap prevention
    if (!draft?.answers || !selected) return
    setFlowStage('submitting')
    setSubmitError(null)

    // Idempotency: reuse key if content unchanged, generate new if changed
    let key = draft.idempotency_key
    if (!key || !isKeyValid(key, draft.answers)) {
      key = generateIdempotencyKey(draft.answers)
      saveJournalDraft(user.id, selected.id, draft.answers, key, selected.title)
      setDraft(prev => ({ ...prev, idempotency_key: key }))
    }

    try {
      await api.journalTemplates.completeSession(user.id, selected.id, draft.answers, key)
      // Success: clear local draft + key
      clearJournalDraft(user.id, selected.id)
      setActiveDrafts(items => items.filter(item => item.templateId !== String(selected.id)))
      platform.haptic('success')

      // Blur active field to close keyboard before transition
      const active = document.activeElement
      if (active && typeof active.blur === 'function') active.blur()

      setFlowStage('mood-offer')
    } catch (error) {
      // Draft is NOT deleted on any error
      setSubmitError(error)
      setFlowStage('error')
      platform.haptic('error')
    }
  }

  function closeBuilder() {
    setBuilderOpen(false)
    setEditingTemplate(null)
  }

  function savePrivateTemplate(saved) {
    setTemplates(current => {
      const existing = current || []
      const withoutPrevious = existing.filter(template => template.id !== saved.id)
      return [saved, ...withoutPrevious]
    })
    setAllCategories(current => [...new Set([...current, saved.category].filter(Boolean))])
    closeBuilder()
    setSelected(null)
  }

  function openPrivateTemplateEditor() {
    if (!selected || selected.visibility !== 'private') return
    setEditingTemplate(selected)
    setBuilderOpen(true)
  }

  async function deletePrivateTemplate() {
    if (!canUseGuidedJournals || !selected || selected.visibility !== 'private' || deletingTemplate)
      return
    if (
      !window.confirm(
        'Удалить личный шаблон? Он исчезнет из каталога. Уже начатые сессии сохранят свой набор вопросов и не будут удалены.'
      )
    )
      return

    setDeletingTemplate(true)
    setError('')
    try {
      await api.journalTemplates.remove(selected.id, user.id)
      setTemplates(current => (current || []).filter(template => template.id !== selected.id))
      // Draft хранит неизменяемый snapshot: удаление шаблона не должно прятать
      // или разрушать уже начатую личную запись.
      setSelected(null)
      platform.haptic('success')
    } catch {
      setError('Не удалось удалить шаблон. Он остался без изменений.')
    } finally {
      setDeletingTemplate(false)
    }
  }

  if (!canUseGuidedJournals) {
    return (
      <section className="mt-8 animate-fade-in">
        {onExit && (
          <NestedScreenHeader
            title="направленные записи."
            onBack={onExit}
            registerSystemBack={false}
          />
        )}
        <div className="rounded-3xl bg-emerald p-5">
          <h2 className="font-display text-[25px] text-cream">Направленные записи</h2>
          <p className="mt-3 text-[14px] leading-relaxed text-muted">
            Направленные записи доступны после входа.
          </p>
        </div>
      </section>
    )
  }

  if (completedSession) {
    return (
      <CompletedSessionViewer
        completedSession={completedSession}
        onClose={() => setCompletedSession(null)}
      />
    )
  }

  if (builderOpen) {
    return (
      <TemplateBuilder
        user={user}
        initialTemplate={editingTemplate}
        onBack={closeBuilder}
        onSaved={savePrivateTemplate}
      />
    )
  }

  // ── Writing / completion / mood / result flow ──

  if (flowStage === 'mood') {
    return <MoodPractice user={user} onDone={() => setFlowStage('result')} />
  }

  if (flowStage === 'result') {
    return (
      <section className="mt-8 animate-fade-in text-center">
        <Check size={42} className="mx-auto text-gold" />
        <h3 className="mt-5 font-display text-[24px] text-cream">Запись сохранена</h3>
        <p className="mx-auto mt-3 max-w-sm text-[14px] leading-relaxed text-muted">
          Ответы отправлены. Черновик удалён с этого устройства.
        </p>
        <button
          type="button"
          data-testid="journal-v3-back-to-journal"
          onClick={() => {
            setFlowStage(null)
            setSelected(null)
            setDraft(null)
            setStepIndex(0)
            setActiveDrafts(listJournalDrafts(user.id))
          }}
          className="mt-7 min-h-12 rounded-full bg-gold px-6 text-[14px] font-semibold text-emerald-deep"
        >
          Вернуться в журнал
        </button>
      </section>
    )
  }

  if (flowStage === 'mood-offer') {
    return (
      <section className="mt-8 animate-fade-in text-center">
        <Check size={42} className="mx-auto text-gold" />
        <h3 className="mt-5 font-display text-[24px] text-cream">Запись сохранена</h3>
        <p className="mx-auto mt-3 max-w-sm text-[14px] leading-relaxed text-muted">
          Хочешь отметить настроение?
        </p>
        <div className="mt-7 flex flex-col gap-2">
          <button
            type="button"
            data-testid="journal-v3-mood-yes"
            onClick={() => setFlowStage('mood')}
            className="min-h-12 rounded-full bg-gold px-6 text-[14px] font-semibold text-emerald-deep"
          >
            Отметить настроение
          </button>
          <button
            type="button"
            data-testid="journal-v3-mood-skip"
            onClick={() => setFlowStage('result')}
            className="min-h-12 rounded-full border border-cream/15 px-6 text-[14px] font-semibold text-cream"
          >
            Пропустить
          </button>
        </div>
      </section>
    )
  }

  if (flowStage === 'error' && draft) {
    const steps = selected?.steps || []
    const step = steps[stepIndex]
    const isLast = stepIndex === steps.length - 1
    const answer = draft.answers?.[step?.id]
    const canContinue = !step?.required || stepAnswerIsPresent(answer)
    const isConflict = submitError?.status === 409
    const isClientError = submitError?.status === 404 || submitError?.status === 422
    const isNetworkError =
      submitError?.kind === 'network' ||
      submitError?.kind === 'timeout' ||
      (submitError?.status && submitError.status >= 500)

    const errorMessage = isConflict
      ? 'Конфликт: запись с таким ключом уже существует. Измени содержимое и попробуй снова.'
      : isClientError
        ? 'Не удалось завершить запись. Проверь шаблон и попробуй ещё раз.'
        : isNetworkError
          ? 'Нет связи. Черновик сохранён на устройстве — попробуй ещё раз, когда появится сеть.'
          : 'Не удалось завершить запись. Черновик сохранён.'

    return (
      <section className="animate-fade-in">
        <RoundBackButton onClick={() => setFlowStage('writing')} label="Назад к записи" />
        <p className="mt-5 text-[12px] font-bold uppercase tracking-wide text-gold">
          {selected?.title} · {stepIndex + 1} из {steps.length}
        </p>
        <h3 className="mt-3 font-display text-[27px] leading-tight text-cream">{step?.title}</h3>
        {step?.helper && (
          <p className="mt-3 text-[14px] leading-relaxed text-muted">{step.helper}</p>
        )}
        <StepInput step={step} value={answer} onChange={value => updateAnswer(step.id, value)} />
        <p role="alert" data-testid="journal-v3-error" className="mt-4 text-[13px] text-muted">
          {errorMessage}
        </p>
        <button
          type="button"
          data-testid="journal-v3-retry"
          disabled={!canContinue}
          onClick={submitComplete}
          className="mt-7 min-h-14 w-full rounded-full bg-gold px-[var(--mx-screen-x)] text-[15px] font-semibold text-emerald-deep disabled:opacity-35"
        >
          Попробовать снова
        </button>
      </section>
    )
  }

  if (flowStage === 'submitting' && draft) {
    const steps = selected?.steps || []
    const step = steps[stepIndex]
    return (
      <section className="animate-fade-in">
        <RoundBackButton onClick={() => {}} label="Завершаем…" />
        <p className="mt-5 text-[12px] font-bold uppercase tracking-wide text-gold">
          {selected?.title} · {stepIndex + 1} из {steps.length}
        </p>
        <h3 className="mt-3 font-display text-[27px] leading-tight text-cream">{step?.title}</h3>
        {step?.helper && (
          <p className="mt-3 text-[14px] leading-relaxed text-muted">{step.helper}</p>
        )}
        <StepInput step={step} value={draft.answers?.[step?.id]} onChange={() => {}} />
        <button
          type="button"
          disabled
          className="mt-7 min-h-14 w-full rounded-full bg-gold px-[var(--mx-screen-x)] text-[15px] font-semibold text-emerald-deep opacity-50"
        >
          Завершаем…
        </button>
      </section>
    )
  }

  if ((flowStage === 'writing' || flowStage === 'error') && draft) {
    const steps = selected?.steps || []
    const step = steps[stepIndex]
    const isLast = stepIndex === steps.length - 1
    const answer = draft.answers?.[step?.id]
    const canContinue = !step?.required || stepAnswerIsPresent(answer)

    return (
      <section className="animate-fade-in">
        <RoundBackButton
          onClick={() => {
            setFlowStage(null)
            setDraft(null)
            setStepIndex(0)
          }}
          label="Сохранить и выйти"
        />
        <p className="mt-5 text-[12px] font-bold uppercase tracking-wide text-gold">
          {selected?.title} · {stepIndex + 1} из {steps.length}
        </p>
        <h3 className="mt-3 font-display text-[27px] leading-tight text-cream">{step?.title}</h3>
        {step?.helper && (
          <p className="mt-3 text-[14px] leading-relaxed text-muted">{step.helper}</p>
        )}
        <StepInput step={step} value={answer} onChange={value => updateAnswer(step.id, value)} />
        {error && (
          <p role="alert" className="mt-4 text-[13px] text-muted">
            {error}
          </p>
        )}
        <button
          type="button"
          data-testid="journal-v3-next"
          disabled={!canContinue}
          onClick={() => {
            if (isLast) {
              submitComplete()
            } else {
              platform.haptic('light')
              setStepIndex(index => Math.min(index + 1, steps.length - 1))
            }
          }}
          className="mt-7 min-h-14 w-full rounded-full bg-gold px-[var(--mx-screen-x)] text-[15px] font-semibold text-emerald-deep disabled:opacity-35"
        >
          {isLast ? 'Завершить' : 'Сохранить и продолжить'}
        </button>
      </section>
    )
  }

  if (selected) {
    return (
      <section className="animate-fade-in">
        <RoundBackButton onClick={() => setSelected(null)} label="К каталогу" />
        <p className="mt-5 text-[12px] font-bold uppercase tracking-wide text-gold">
          {selected.category}
        </p>
        <h3 className="mt-3 font-display text-[28px] leading-tight text-cream">{selected.title}</h3>
        <p className="mt-3 text-[14px] leading-relaxed text-muted">{selected.description}</p>
        <div className="mt-6 space-y-3">
          {(selected.steps || []).map((step, index) => (
            <div key={step.id} className="rounded-2xl bg-emerald p-4">
              <span className="text-[11px] font-bold text-gold">{index + 1}</span>
              <p className="mt-1 text-[14px] font-semibold text-cream">{step.title}</p>
              {!step.required && <p className="mt-1 text-[12px] text-faint">Можно пропустить</p>}
            </div>
          ))}
        </div>
        {selected.visibility === 'private' && (
          <div className="mt-6 flex flex-wrap gap-2 border-t border-cream/10 pt-4">
            <button
              type="button"
              onClick={openPrivateTemplateEditor}
              className="min-h-10 rounded-full border border-cream/15 px-4 text-[13px] font-semibold text-cream active:text-gold"
            >
              Редактировать шаблон
            </button>
            <button
              type="button"
              disabled={deletingTemplate}
              onClick={deletePrivateTemplate}
              className="min-h-10 rounded-full px-3 text-[13px] font-semibold text-red-300 disabled:opacity-50"
            >
              {deletingTemplate ? 'Удаляем…' : 'Удалить шаблон'}
            </button>
          </div>
        )}
        {error && (
          <p role="alert" className="mt-4 text-[13px] text-muted">
            {error}
          </p>
        )}
        <button
          type="button"
          disabled={loading || deletingTemplate}
          onClick={startDraft}
          data-testid="journal-v3-start"
          className="mt-7 min-h-14 w-full rounded-full bg-gold px-[var(--mx-screen-x)] text-[15px] font-semibold text-emerald-deep disabled:opacity-35"
        >
          {loading ? 'Открываю…' : 'Начать или продолжить'}
        </button>
      </section>
    )
  }

  return (
    <section className="animate-fade-in">
      {onExit && (
        <>
          <NestedScreenHeader
            title="направленные записи."
            onBack={onExit}
            registerSystemBack={false}
          />
          <p className="text-[13px] leading-relaxed text-muted -mt-2 mb-5">
            Готовые вопросы и личные шаблоны для спокойной рефлексии.
          </p>
        </>
      )}
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="font-display text-[20px] text-cream">Твои записи</h3>
          <p className="mt-1 text-[13px] text-muted">Выбери короткий трек или собери свой.</p>
        </div>
        <button
          type="button"
          onClick={() => {
            setEditingTemplate(null)
            setBuilderOpen(true)
          }}
          aria-label="Создать личный шаблон"
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gold text-emerald-deep"
        >
          <Plus size={20} />
        </button>
      </div>
      {activeDrafts.length > 0 && (
        <div className="mt-5 rounded-3xl border border-gold/25 bg-emerald p-4">
          <p className="text-[12px] font-bold uppercase tracking-wide text-gold">Продолжить</p>
          <div className="mt-3 space-y-2">
            {activeDrafts.slice(0, 3).map(item => (
              <button
                key={item.templateId}
                type="button"
                data-testid="journal-v3-resume"
                onClick={() => resumeDraft(item.templateId, item.templateTitle)}
                className="flex min-h-12 w-full items-center justify-between rounded-2xl bg-emerald-light px-4 text-left"
              >
                <span className="text-[14px] font-semibold text-cream">
                  {item.templateTitle ||
                    templates?.find(t => t.id === Number(item.templateId))?.title ||
                    'Незавершённая запись'}
                </span>
                <span className="text-[12px] text-gold">Открыть</span>
              </button>
            ))}
          </div>
        </div>
      )}
      <div className="mt-5 rounded-3xl border border-cream/10 bg-emerald p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-[12px] font-bold uppercase tracking-wide text-gold">Архив</p>
            <p className="mt-1 text-[13px] text-muted">Завершённые направленные записи</p>
          </div>
          {completedSessions !== null && (
            <span className="rounded-full bg-cream/5 px-2.5 py-1 text-[12px] font-semibold text-cream">
              {completedSessions.length}
            </span>
          )}
        </div>
        {completedSessionsLoading && completedSessions === null ? (
          <p className="mt-3 text-[13px] text-muted">Загружаем архив…</p>
        ) : completedSessionsError ? (
          <div className="mt-3">
            <p role="alert" className="text-[13px] leading-relaxed text-muted">
              {completedSessionsError}
            </p>
            <button
              type="button"
              disabled={completedSessionsLoading}
              onClick={loadCompletedSessions}
              className="mt-3 min-h-10 rounded-full border border-cream/15 px-4 text-[13px] font-semibold text-cream active:text-gold disabled:opacity-50"
            >
              {completedSessionsLoading ? 'Повторяем…' : 'Повторить'}
            </button>
          </div>
        ) : completedSessions.length === 0 ? (
          <p className="mt-3 text-[13px] leading-relaxed text-muted">
            Завершённые направленные записи появятся здесь.
          </p>
        ) : (
          <div className="mt-3 space-y-2">
            {completedSessions.map(item => (
              <button
                key={item.id}
                type="button"
                onClick={() => setCompletedSession(item)}
                className="flex min-h-12 w-full items-center justify-between gap-3 rounded-2xl bg-emerald-light px-4 text-left"
              >
                <span className="min-w-0">
                  <span className="block truncate text-[14px] font-semibold text-cream">
                    {item.template?.title || 'Направленная запись'}
                  </span>
                  <span className="mt-1 block text-[12px] text-faint">
                    {formatArchiveDate(item.completedAt || item.updatedAt)}
                  </span>
                </span>
                <span className="shrink-0 text-[12px] text-gold">Смотреть</span>
              </button>
            ))}
          </div>
        )}
        <p className="mt-3 text-[12px] leading-relaxed text-faint">
          Архив не создаёт записи в Journey и пока не интегрирован с History.
        </p>
      </div>
      <label className="mt-5 flex min-h-12 items-center gap-3 rounded-2xl bg-emerald px-4 text-muted">
        <Search size={18} />
        <input
          value={query}
          onChange={event => setQuery(event.target.value)}
          placeholder="Поиск по шаблонам"
          className="min-w-0 flex-1 bg-transparent text-[16px] text-cream outline-none placeholder:text-muted"
        />
      </label>
      {categories.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2" aria-label="Фильтр по категориям">
          <button
            type="button"
            onClick={() => setCategory('')}
            aria-pressed={!category}
            className={[
              'min-h-9 rounded-full px-3 text-[12px] font-semibold',
              !category ? 'bg-gold text-emerald-deep' : 'bg-cream/5 text-muted',
            ].join(' ')}
          >
            Все
          </button>
          {categories.map(item => (
            <button
              key={item}
              type="button"
              onClick={() => setCategory(item)}
              aria-pressed={category === item}
              className={[
                'min-h-9 rounded-full px-3 text-[12px] font-semibold',
                category === item ? 'bg-gold text-emerald-deep' : 'bg-cream/5 text-muted',
              ].join(' ')}
            >
              {item}
            </button>
          ))}
        </div>
      )}
      {error && (
        <p role="alert" className="mt-4 text-[13px] text-muted">
          {error}
        </p>
      )}
      {templates === null ? (
        <p className="mt-8 text-[14px] text-muted">Загружаем шаблоны…</p>
      ) : templates.length === 0 ? (
        <div className="mt-8 rounded-3xl bg-emerald p-5">
          <p className="text-[15px] font-semibold text-cream">Ничего не найдено</p>
          <p className="mt-2 text-[13px] leading-relaxed text-muted">
            Попробуй другой запрос или создай личный шаблон.
          </p>
        </div>
      ) : (
        <div className="mt-5 space-y-3">
          {templates.map(template => (
            <button
              key={template.id}
              type="button"
              onClick={() => openTemplate(template)}
              className="w-full rounded-3xl bg-emerald p-5 text-left active:scale-[0.99] transition-transform"
            >
              <div className="flex items-start gap-3">
                <span className="mt-1 rounded-full bg-gold/10 px-2.5 py-1 text-[11px] font-bold text-gold">
                  {template.category}
                </span>
                {template.visibility === 'private' && (
                  <span className="mt-1 text-[11px] font-semibold text-faint">личный</span>
                )}
              </div>
              <p className="mt-3 text-[17px] font-semibold text-cream">{template.title}</p>
              <p className="mt-2 text-[13px] leading-relaxed text-muted">{template.description}</p>
              <p className="mt-3 text-[12px] text-faint">
                {template.stepCount} шага · версия {template.version}
              </p>
            </button>
          ))}
        </div>
      )}
    </section>
  )
}
