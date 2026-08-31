import { useState } from 'react'
import { api } from '../lib/api'
import { platform } from '../platform'
import { isLinkedWebWriteBlocked, LINKED_WEB_WRITE_NOTICE } from '../lib/webAuthLimits'

/*
 * MXL-STARTER-SET-001 v1 (issue #417, MXL-DEC-024).
 *
 * Ровно 3 контекста, ровно одна практика на контекст — approved scope
 * (issue #321): «не более одной практики», без ascezas, без новой
 * навигации. Контекст выбирается один раз за сессию; «принять» создаёт
 * настоящий ritual через уже существующий api.rituals.create — не
 * новую backend-инфраструктуру. Дальше это обычный ritual: streak,
 * review, redaktirovanie — всё через существующие экраны Rituals.
 *
 * Переименование практики перед accept (editingName) — из исходного
 * #321 («accept/skip/replace/edit»), выпало из более узкого Scope в
 * #417 при открытии issue; восстановлено и явно внесено обратно в
 * #417 owner-решением 31.08.2026 при разборе параллельной реализации
 * (PR #418) — не тихое расхождение issue vs код.
 */
const CONTEXTS = [
  {
    key: 'focus',
    label: 'Фокус',
    question: 'Не понимаешь, с чего начать?',
    ritual: {
      name: 'Один следующий шаг',
      category: 'psycho',
      goal: 'Понять, что делать дальше, вместо расплывчатого «разобраться со всем»',
      min_version: 'Написать один следующий шаг',
      optimal_version: 'Написать три следующих шага по приоритету',
      skip_consequence: 'Ничего страшного — можно продолжить без записи',
    },
  },
  {
    key: 'calm',
    label: 'Спокойствие',
    question: 'Хочешь короткую паузу перед делом?',
    ritual: {
      name: 'Пауза перед делом',
      category: 'psycho',
      goal: 'Создать короткую паузу перед следующей задачей',
      min_version: 'Две минуты тишины или спокойного дыхания',
      optimal_version: 'Пять минут без телефона и уведомлений',
      skip_consequence: 'Можно перейти к делу без паузы',
    },
  },
  {
    key: 'energy',
    label: 'Энергия',
    question: 'Нужно немного взбодриться?',
    ritual: {
      name: 'Маленькое движение',
      category: 'psycho',
      goal: 'Сделать следующее физическое действие меньше и проще',
      min_version: 'Стакан воды или две минуты движения',
      optimal_version: '10 минут лёгкой активности',
      skip_consequence: 'Можно продолжить без этого шага',
    },
  },
]

export default function StarterSetPicker({ user, onCreated, onSkip }) {
  const [step, setStep] = useState('choose')
  const [contextKey, setContextKey] = useState(null)
  const [editingName, setEditingName] = useState(false)
  const [name, setName] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  const context = CONTEXTS.find(c => c.key === contextKey) || null

  function chooseContext(key) {
    platform.haptic('light')

    const found = CONTEXTS.find(c => c.key === key)

    setContextKey(key)
    setName(found.ritual.name)
    setEditingName(false)
    setError(null)
    setStep('suggestion')
  }

  function replace() {
    platform.haptic('light')

    setStep('choose')
    setContextKey(null)
    setError(null)
  }

  async function accept() {
    if (!context || saving) return

    setSaving(true)
    setError(null)

    try {
      const draft = { ...context.ritual, name: name.trim() || context.ritual.name }
      const ritual = await api.rituals.create(user.id, draft)

      platform.haptic('light')

      onCreated?.(ritual)
    } catch (e) {
      console.error(e)

      if (isLinkedWebWriteBlocked(user, e)) {
        setError(LINKED_WEB_WRITE_NOTICE)
      } else {
        setError('Не получилось сохранить. Попробуй ещё раз или выбери практику вручную.')
      }
    } finally {
      setSaving(false)
    }
  }

  if (step === 'choose') {
    return (
      <>
        <h3 className="font-display mx-type-card text-cream mb-1">С чего хочешь начать?</h3>
        <p className="mx-type-list-body text-muted mb-4">
          Выбери, что сейчас ближе — предложим один маленький шаг
        </p>

        <div className="flex flex-col gap-2 w-full">
          {CONTEXTS.map(c => (
            <button
              key={c.key}
              onClick={() => chooseContext(c.key)}
              className="cta-pill mx-type-flow-action px-6 py-3 w-full"
            >
              {c.label}
            </button>
          ))}
        </div>

        <button
          onClick={() => {
            platform.haptic('light')
            onSkip?.()
          }}
          className="mx-type-meta text-muted mt-4 underline underline-offset-2"
        >
          Пропустить, выбрать самому
        </button>
      </>
    )
  }

  return (
    <>
      <span className="mx-type-meta text-muted mb-2 block">{context.question}</span>

      <h3 className="font-display mx-type-card text-cream mb-1">{context.ritual.name}</h3>

      <p className="mx-type-list-body text-muted mb-4">{context.ritual.goal}</p>

      {editingName ? (
        <input
          type="text"
          value={name}
          onChange={e => setName(e.target.value)}
          onBlur={() => setEditingName(false)}
          autoFocus
          className="w-full rounded-xl bg-emerald-light px-3 py-2 text-cream mx-type-list-body mb-3 text-center"
        />
      ) : (
        <button
          onClick={() => {
            platform.haptic('light')
            setEditingName(true)
          }}
          className="mx-type-meta text-muted mb-3 underline underline-offset-2"
        >
          Изменить название
        </button>
      )}

      <div className="flex flex-col gap-1.5 w-full mb-4 text-left">
        <div className="rounded-xl bg-emerald-light px-3 py-2">
          <span className="mx-type-meta text-faint uppercase tracking-wider block mb-0.5">
            Лёгкая версия
          </span>
          <span className="mx-type-list-body text-cream">{context.ritual.min_version}</span>
        </div>

        <div className="rounded-xl bg-emerald-light px-3 py-2">
          <span className="mx-type-meta text-faint uppercase tracking-wider block mb-0.5">
            Обычная версия
          </span>
          <span className="mx-type-list-body text-cream">{context.ritual.optimal_version}</span>
        </div>
      </div>

      {error && <p className="mx-type-meta text-muted mb-3">{error}</p>}

      <div className="flex items-center justify-center gap-2 w-full">
        <button
          onClick={accept}
          disabled={saving}
          className="cta-pill mx-type-flow-action px-9 py-3.5 disabled:opacity-60"
        >
          {saving ? 'Сохраняю…' : 'Принять'}
        </button>
      </div>

      <div className="flex items-center justify-center gap-4 mt-3">
        <button onClick={replace} className="mx-type-meta text-muted underline underline-offset-2">
          Заменить
        </button>

        <button
          onClick={() => {
            platform.haptic('light')
            onSkip?.()
          }}
          className="mx-type-meta text-muted underline underline-offset-2"
        >
          Пропустить
        </button>
      </div>
    </>
  )
}
