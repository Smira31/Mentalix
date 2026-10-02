import { useState } from 'react'
import { Plus, X } from 'lucide-react'

import Screen from '../../components/Screen'
import CapsLabel from '../../components/ui/CapsLabel'
import JournalField from '../../components/ui/JournalField'
import RoundNextButton from '../../components/ui/RoundNextButton'
import { useBackButton } from '../../platform/telegram.hooks'
import { platform } from '../../platform'
import { api } from '../../lib/api'
import './DailyJournalFlow.css'

const SETUP_STEPS = [
  {
    key: 'goals',
    label: 'Шаг 1 из 4 · Цели',
    title: 'Чего ты хочешь добиться в ближайший год?',
    hint: 'Можно коротко.',
  },
  {
    key: 'reminders',
    label: 'Шаг 2 из 4 · Кем я становлюсь',
    title: 'Кем я становлюсь',
    hint: 'Не похвала себе, а напоминание: что для тебя важно и каким ты хочешь быть. Например: я делаю главное до обеда.',
  },
  {
    key: 'vision',
    label: 'Шаг 3 из 4 · Картинка будущего',
    title: 'Картинка будущего',
    hint: 'Помогает не терять направление, когда всё идёт не по плану.',
  },
  {
    key: 'prompts',
    label: 'Шаг 4 из 4 · Мои вопросы',
    title: 'Вопросы для дневной записи',
    hint: 'Один вопрос на каждый день — по кругу. Можно изменить, удалить или добавить.',
  },
]

const VISION_FIELDS = [
  { key: 'scene', label: 'Где ты и что делаешь, когда всё получилось?' },
  { key: 'obstacle', label: 'Что может помешать?' },
  { key: 'plan', label: 'Что ты тогда сделаешь?' },
]

export default function DailyJournalSetup({ userId, initialSetup, onComplete, onBack }) {
  const [stepIndex, setStepIndex] = useState(0)
  const [goals, setGoals] = useState(() => {
    const g = initialSetup?.goals || []
    return [g[0] || '', g[1] || '', g[2] || '']
  })
  const [reminders, setReminders] = useState(() => {
    const r = initialSetup?.reminders || []
    const padded = [...r, ...Array(Math.max(0, 2 - r.length)).fill('')]
    return padded.slice(0, 5)
  })
  const [vision, setVision] = useState(
    () => initialSetup?.vision || { scene: '', obstacle: '', plan: '' }
  )
  const [prompts, setPrompts] = useState(() => {
    const p = initialSetup?.prompts || []
    return p.length > 0 ? [...p] : ['']
  })
  const [saving, setSaving] = useState(false)

  const step = SETUP_STEPS[stepIndex]
  const isLastStep = stepIndex === SETUP_STEPS.length - 1

  function hasContent() {
    if (stepIndex === 0) return goals.some(g => g.trim())
    if (stepIndex === 1) return reminders.some(r => r.trim())
    if (stepIndex === 2)
      return Boolean(vision.scene.trim() || vision.obstacle.trim() || vision.plan.trim())
    if (stepIndex === 3) return prompts.some(p => p.trim())
    return false
  }

  function goBack() {
    if (stepIndex > 0) {
      platform.haptic('light')
      setStepIndex(i => i - 1)
      return
    }
    onBack()
  }

  useBackButton(goBack)

  function proceed() {
    if (!isLastStep) {
      platform.haptic('light')
      setStepIndex(i => i + 1)
      return
    }
    saveAndComplete()
  }

  async function saveAndComplete() {
    const payload = {
      goals: goals.filter(g => g.trim()),
      reminders: reminders.filter(r => r.trim()),
      vision,
      prompts: prompts.filter(p => p.trim()).slice(0, 7),
    }
    setSaving(true)
    try {
      const result = await api.dailyJournal.saveSetup(userId, payload)
      platform.haptic('success')
      onComplete(result)
    } catch (error) {
      console.error('[dailyJournal] setup save failed', error)
      platform.haptic('light')
      onComplete(payload)
    } finally {
      setSaving(false)
    }
  }

  function updateGoal(i, value) {
    setGoals(prev => prev.map((g, idx) => (idx === i ? value : g)))
  }

  function updateReminder(i, value) {
    setReminders(prev => prev.map((r, idx) => (idx === i ? value : r)))
  }

  function addReminder() {
    if (reminders.length >= 5) return
    setReminders(prev => [...prev, ''])
  }

  function deleteReminder(i) {
    if (reminders.length <= 1) return
    setReminders(prev => prev.filter((_, idx) => idx !== i))
  }

  function updatePrompt(i, value) {
    setPrompts(prev => prev.map((p, idx) => (idx === i ? value : p)))
  }

  function addPrompt() {
    if (prompts.length >= 7) return
    setPrompts(prev => [...prev, ''])
  }

  function deletePrompt(i) {
    if (prompts.length <= 1) return
    setPrompts(prev => prev.filter((_, idx) => idx !== i))
  }

  function renderStep() {
    if (stepIndex === 0) {
      return (
        <>
          <CapsLabel className="mx-dj-setup__step-label">{step.label}</CapsLabel>
          <JournalField question={step.title} hint={step.hint} className="mx-dj-setup__field-group" />
          {goals.map((g, i) => (
            <input
              key={i}
              type="text"
              className="mx-dj-setup__input"
              value={g}
              onChange={e => updateGoal(i, e.target.value)}
              placeholder={`Цель ${i + 1}`}
              maxLength={500}
              data-testid={`dj-setup-goal-${i}`}
            />
          ))}
        </>
      )
    }

    if (stepIndex === 1) {
      return (
        <>
          <CapsLabel className="mx-dj-setup__step-label">{step.label}</CapsLabel>
          <JournalField question={step.title} hint={step.hint} className="mx-dj-setup__field-group" />
          {reminders.map((r, i) => (
            <div key={i} className="mx-dj-setup__input-row">
              <input
                type="text"
                className="mx-dj-setup__input"
                value={r}
                onChange={e => updateReminder(i, e.target.value)}
                placeholder={`Напоминание ${i + 1}`}
                maxLength={500}
                data-testid={`dj-setup-reminder-${i}`}
              />
              {reminders.length > 1 && (
                <button
                  type="button"
                  className="mx-dj-setup__delete"
                  onClick={() => deleteReminder(i)}
                  aria-label="Удалить"
                >
                  <X size={16} strokeWidth={1.5} />
                </button>
              )}
            </div>
          ))}
          {reminders.length < 5 && (
            <button type="button" className="mx-dj-setup__add" onClick={addReminder}>
              <Plus size={16} strokeWidth={1.5} /> Добавить
            </button>
          )}
        </>
      )
    }

    if (stepIndex === 2) {
      return (
        <>
          <CapsLabel className="mx-dj-setup__step-label">{step.label}</CapsLabel>
          <JournalField question={step.title} hint={step.hint} className="mx-dj-setup__field-group" />
          {VISION_FIELDS.map(field => (
            <div key={field.key} style={{ marginBottom: 'var(--mx-space-3)' }}>
              <p
                style={{
                  fontSize: '14px',
                  color: 'rgb(var(--c-muted))',
                  marginBottom: 'var(--mx-space-2)',
                }}
              >
                {field.label}
              </p>
              <textarea
                className="mx-dj-setup__input"
                value={vision[field.key]}
                onChange={e => setVision(prev => ({ ...prev, [field.key]: e.target.value }))}
                rows={2}
                maxLength={1000}
                data-testid={`dj-setup-vision-${field.key}`}
              />
            </div>
          ))}
        </>
      )
    }

    // Step 3: Prompts
    return (
      <>
        <CapsLabel className="mx-dj-setup__step-label">{step.label}</CapsLabel>
        <JournalField question={step.title} hint={step.hint} className="mx-dj-setup__field-group" />
        {prompts.map((p, i) => (
          <div key={i} className="mx-dj-setup__input-row">
            <input
              type="text"
              className="mx-dj-setup__input"
              value={p}
              onChange={e => updatePrompt(i, e.target.value)}
              placeholder={`Вопрос ${i + 1}`}
              maxLength={500}
              data-testid={`dj-setup-prompt-${i}`}
            />
            {prompts.length > 1 && (
              <button
                type="button"
                className="mx-dj-setup__delete"
                onClick={() => deletePrompt(i)}
                aria-label="Удалить"
              >
                <X size={16} strokeWidth={1.5} />
              </button>
            )}
          </div>
        ))}
        {prompts.length < 7 && (
          <button type="button" className="mx-dj-setup__add" onClick={addPrompt}>
            <Plus size={16} strokeWidth={1.5} /> Добавить вопрос
          </button>
        )}
      </>
    )
  }

  const content = hasContent()

  return (
    <Screen
      onBack={goBack}
      registerSystemBack={false}
      scroll
      footer={
        <div className="mx-dj-footer-bar">
          <RoundNextButton
            onClick={proceed}
            icon={content ? 'check' : 'close'}
            label={isLastStep ? (content ? 'Сохранить' : 'Пропустить') : content ? 'Далее' : 'Пропустить'}
            disabled={saving}
            testId="dj-setup-next"
          />
        </div>
      }
    >
      <div className="mx-dj-setup">{renderStep()}</div>
    </Screen>
  )
}
