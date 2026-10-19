import { useRef, useState } from 'react'
import { Plus, X } from 'lucide-react'

import Screen from '../../components/Screen'
import CapsLabel from '../../components/ui/CapsLabel'
import JournalField from '../../components/ui/JournalField'
import RoundNextButton from '../../components/ui/RoundNextButton'
import { useBackButton } from '../../platform/telegram.hooks'
import { platform } from '../../platform'
import { api } from '../../lib/api'
import { useAutoFocusField } from '../../lib/useAutoFocusField'
import './DailyJournalFlow.css'

const SETUP_STEPS = [
  {
    key: 'goals',
    label: 'Шаг 1 из 5 · Цели',
    title: 'Чего ты хочешь добиться в ближайший год?',
    hint: 'Можно коротко.',
  },
  {
    key: 'reminders',
    label: 'Шаг 2 из 5 · Каким я хочу быть',
    title: 'Каким я хочу быть',
    hint: 'Не про результат, а про тебя — как ты живёшь каждый день.',
  },
  {
    key: 'vision',
    label: 'Шаг 3 из 5 · Картинка будущего',
    title: 'Картинка будущего',
    hint: 'Помогает не терять направление, когда всё идёт не по плану.',
  },
  {
    key: 'prompts',
    label: 'Шаг 4 из 5 · Мои вопросы',
    title: 'Вопросы для дневной записи',
    hint: 'Один вопрос на каждый день — по кругу. Можно изменить, удалить или добавить.',
  },
  {
    key: 'reminder',
    label: 'Шаг 5 из 5 · Напоминание',
    title: 'Когда напомнить?',
    hint: 'Бот напомнит, только если ты ещё не писал сегодня.',
  },
]

/*
 * #1090: «Картинка будущего» — порядок и смысл WOOP сохранены
 * ( Wish → Obstacle → Plan ), тексты шагов уточнены владельцем.
 */
const VISION_SUBSTEPS = [
  {
    key: 'scene',
    title: 'Представь день через год, когда всё получилось. Что изменилось?',
    hint: 'Одна-две детали: что ты видишь и что чувствуешь.',
    placeholder: 'Например: просыпаюсь без тревоги и сразу знаю, с чего начать день',
    chips: ['спокойствие', 'уверенность', 'лёгкость', 'гордость за себя', 'свобода'],
  },
  {
    key: 'obstacle',
    title: 'Что может помешать?',
    hint: 'То, что обычно сбивает именно тебя.',
    placeholder: 'Например: прихожу уставшим и залипаю в телефон',
    chips: [
      'Усталость',
      'Лента и телефон',
      'Страх, что не получится',
      'Откладываю на потом',
      'Нет сил после работы',
      'Сомнения в себе',
    ],
  },
  {
    key: 'plan',
    title: 'Если это случится — что ты сделаешь?',
    hint: 'Простой план «если… то…» — заранее, пока есть силы.',
    placeholder: 'Например: если устал — делаю минимум, 2 минуты',
    chips: [
      'Сделаю минимум — 2 минуты',
      'Уберу телефон в другую комнату',
      'Выйду пройтись на 5 минут',
      'Напишу одну строку',
      'Напомню себе, ради чего',
      'Попрошу помощи',
    ],
  },
]

const GOAL_PLACEHOLDERS = [
  'Например: пробежать 10 км',
  'Например: сменить работу',
  'Например: читать каждый день',
]

const GOAL_CHIPS = [
  'Высыпаться',
  'Больше двигаться',
  'Найти дело по душе',
  'Меньше тревоги',
  'Навести порядок в деньгах',
  'Читать регулярно',
  'Больше времени с близкими',
]

/*
 * #1090: строка шага 2 — неизменяемый префикс + продолжение.
 * В настройке хранится только продолжение (без префикса); итоговый
 * экран печатает префикс сам.
 */
const IDENTITY_PREFIX = 'Я — человек, который…'
const IDENTITY_PLACEHOLDER = 'держит слово'
const IDENTITY_CHIPS = [
  'держит слово',
  'делает главное первым',
  'ложится вовремя',
  'двигается каждый день',
  'говорит «нет» без вины',
  'не сравнивает себя с другими',
  'спокойно встречает трудности',
  'находит время для близких',
]

const PROMPT_CHIPS = [
  'Что сегодня было хорошего?',
  'Чему я сегодня научился?',
  'Где я сегодня был честен с собой?',
  'Что я хочу отпустить?',
]

const REMINDER_TILES = [
  { label: 'Утром', time: '08:00' },
  { label: 'Днём', time: '13:00' },
  { label: 'Вечером', time: '21:00' },
]

/*
 * #1081 (MXL-QA-008): «Цели» и «Кем я становлюсь» — длинная строка
 * переносится аккуратно, а не уезжает в горизонтальный скролл <input>.
 * Поле — textarea с автовысотой: высота пересчитывается при каждом рендере
 * (контролируемое значение) и при вводе.
 */
function autoGrowField(el) {
  if (!el) return
  el.style.height = 'auto'
  el.style.height = `${el.scrollHeight}px`
}

export default function DailyJournalSetup({ userId, initialSetup, onComplete, onBack }) {
  const [stepIndex, setStepIndex] = useState(0)
  const [visionSubStep, setVisionSubStep] = useState(0)
  const [goals, setGoals] = useState(() => {
    const g = initialSetup?.goals || []
    return [g[0] || '', g[1] || '', g[2] || '']
  })
  const [reminders, setReminders] = useState(() => {
    const r = initialSetup?.reminders?.filter(x => x.trim()) || []
    return r.length > 0 ? [...r] : ['']
  })
  const [vision, setVision] = useState(
    () => initialSetup?.vision || { scene: '', obstacle: '', plan: '' }
  )
  const [prompts, setPrompts] = useState(() => {
    const p = initialSetup?.prompts || []
    return p.length > 0 ? [...p] : ['']
  })
  // #1090: у нового пользователя (настройка ещё не сохранялась) по
  // умолчанию выбрано «Вечером 21:00»; сохранённый выбор не трогаем.
  const [reminder, setReminder] = useState(() => {
    if (!initialSetup?.updated_at) return { enabled: true, time: '21:00' }
    return initialSetup.reminder || { enabled: true, time: '21:00' }
  })
  const [customTime, setCustomTime] = useState(
    () => initialSetup?.reminder?.time || '21:00'
  )
  const [reminderMode, setReminderMode] = useState(() => {
    if (!initialSetup?.updated_at) return 'preset'
    const r = initialSetup?.reminder
    if (!r?.enabled) return 'off'
    return REMINDER_TILES.some(t => t.time === r.time) ? 'preset' : 'custom'
  })
  // #1090: чипы готовых вопросов показываются по «+ Добавить вопрос»
  const [promptChipsVisible, setPromptChipsVisible] = useState(false)
  const [saving, setSaving] = useState(false)
  const timeInputRef = useRef(null)

  const step = SETUP_STEPS[stepIndex]
  const isLastStep = stepIndex === SETUP_STEPS.length - 1
  const stepFieldRef = useRef(null)

  // MXL-KEYBOARD-001: многошаговая форма фокусирует первое актуальное поле
  // шага — и шаг «Цели», и «Напоминания», и «Мои вопросы», а не только
  // подэкран «Картинка будущего». Шаг «Напоминание» (плитки времени) поля
  // ввода не имеет, поэтому фокус туда не ставится.
  useAutoFocusField(stepFieldRef, `${stepIndex}:${visionSubStep}`)

  // ── Чипы шага (#1090): использованный чип скрыт, свободный виден ──
  const stepChips = (() => {
    if (stepIndex === 0) {
      return GOAL_CHIPS.filter(chip => !goals.some(g => g.includes(chip)))
    }
    if (stepIndex === 1) {
      return IDENTITY_CHIPS.filter(chip => !reminders.some(r => r.includes(chip)))
    }
    if (stepIndex === 2) {
      const sub = VISION_SUBSTEPS[visionSubStep]
      const value = vision[sub.key] || ''
      return sub.chips.filter(chip => !value.includes(chip))
    }
    if (stepIndex === 3) {
      if (!promptChipsVisible) return []
      return PROMPT_CHIPS.filter(chip => !prompts.some(p => p.includes(chip)))
    }
    return []
  })()

  function handleChipTap(text) {
    platform.haptic('light')
    if (stepIndex === 0) {
      setGoals(prev => {
        const emptyIdx = prev.findIndex(g => !g.trim())
        if (emptyIdx >= 0) {
          const next = [...prev]
          next[emptyIdx] = text
          return next
        }
        return prev.length < 5 ? [...prev, text] : prev
      })
      return
    }
    if (stepIndex === 1) {
      setReminders(prev => {
        const emptyIdx = prev.findIndex(r => !r.trim())
        if (emptyIdx >= 0) {
          const next = [...prev]
          next[emptyIdx] = text
          return next
        }
        return prev.length < 5 ? [...prev, text] : prev
      })
      return
    }
    if (stepIndex === 2) {
      const sub = VISION_SUBSTEPS[visionSubStep]
      setVision(prev => {
        const current = prev[sub.key] || ''
        return { ...prev, [sub.key]: current.trim() ? `${current}, ${text}` : text }
      })
      return
    }
    if (stepIndex === 3) {
      setPrompts(prev => {
        const emptyIdx = prev.findIndex(p => !p.trim())
        if (emptyIdx >= 0) {
          const next = [...prev]
          next[emptyIdx] = text
          return next
        }
        return prev.length < 7 ? [...prev, text] : prev
      })
    }
  }

  function hasContent() {
    if (stepIndex === 0) return goals.some(g => g.trim())
    if (stepIndex === 1) return reminders.some(r => r.trim())
    if (stepIndex === 2) {
      const fieldKey = VISION_SUBSTEPS[visionSubStep].key
      return Boolean(vision[fieldKey]?.trim())
    }
    if (stepIndex === 3) return prompts.some(p => p.trim())
    if (stepIndex === 4) return true
    return false
  }

  function goBack() {
    if (stepIndex === 2 && visionSubStep > 0) {
      platform.haptic('light')
      setVisionSubStep(i => i - 1)
      return
    }
    if (stepIndex === 3) {
      platform.haptic('light')
      setStepIndex(2)
      setVisionSubStep(2)
      return
    }
    if (stepIndex === 4) {
      platform.haptic('light')
      setStepIndex(3)
      return
    }
    if (stepIndex > 0) {
      platform.haptic('light')
      setStepIndex(i => i - 1)
      return
    }
    onBack()
  }

  useBackButton(goBack)

  function proceed() {
    if (stepIndex === 2 && visionSubStep < 2) {
      platform.haptic('light')
      setVisionSubStep(i => i + 1)
      return
    }
    if (!isLastStep) {
      platform.haptic('light')
      if (stepIndex === 2) setVisionSubStep(0)
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
      reminder,
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
    setReminders(prev => {
      const next = prev.filter((_, idx) => idx !== i)
      return next.length > 0 ? next : ['']
    })
  }

  function updatePrompt(i, value) {
    setPrompts(prev => prev.map((p, idx) => (idx === i ? value : p)))
  }

  function addPrompt() {
    if (prompts.length >= 7) return
    setPromptChipsVisible(true)
    setPrompts(prev => [...prev, ''])
  }

  function deletePrompt(i) {
    if (prompts.length <= 1) return
    setPrompts(prev => prev.filter((_, idx) => idx !== i))
  }

  // ── Reminder tile handlers ──
  function selectReminderTile(time) {
    platform.haptic('light')
    setReminderMode('preset')
    setReminder({ enabled: true, time })
    setCustomTime(time)
  }

  function selectReminderCustom(timeStr) {
    setCustomTime(timeStr)
    setReminder({ enabled: true, time: timeStr })
  }

  function handleCustomTileClick() {
    platform.haptic('light')
    if (reminderMode === 'custom') {
      // Повторный тап — открываем выбор времени снова
      const input = timeInputRef.current
      if (input) {
        input.focus()
        if (typeof input.showPicker === 'function') {
          try { input.showPicker() } catch (_) { /* not supported */ }
        }
      }
      return
    }
    setReminderMode('custom')
    setReminder({ enabled: true, time: customTime })
  }

  function selectReminderOff() {
    platform.haptic('light')
    setReminderMode('off')
    setReminder({ enabled: false, time: '21:00' })
  }

  function renderChips() {
    if (stepChips.length === 0) return null
    return (
      <div className="mx-dj-setup__chips" data-testid="dj-setup-chips">
        {stepChips.map(chip => (
          <button
            key={chip}
            type="button"
            className="mx-dj-setup__chip"
            data-testid="dj-setup-chip"
            onClick={() => handleChipTap(chip)}
          >
            {chip}
          </button>
        ))}
      </div>
    )
  }

  function renderStep() {
    if (stepIndex === 0) {
      return (
        <>
          <CapsLabel className="mx-dj-setup__step-label">{step.label}</CapsLabel>
          <JournalField question={step.title} hint={step.hint} className="mx-dj-setup__field-group" />
          {goals.map((g, i) => (
            <textarea
              key={i}
              ref={el => {
                autoGrowField(el)
                if (i === 0) stepFieldRef.current = el
              }}
              rows={1}
              className="mx-dj-setup__input"
              value={g}
              onChange={e => updateGoal(i, e.target.value)}
              placeholder={GOAL_PLACEHOLDERS[i] || GOAL_PLACEHOLDERS[0]}
              maxLength={500}
              data-testid={`dj-setup-goal-${i}`}
            />
          ))}
          {renderChips()}
        </>
      )
    }

    if (stepIndex === 1) {
      return (
        <>
          <CapsLabel className="mx-dj-setup__step-label">{step.label}</CapsLabel>
          <JournalField question={step.title} hint={step.hint} className="mx-dj-setup__field-group" />
          {reminders.map((r, i) => (
            <div key={i} className="mx-dj-setup__identity-row" data-testid={`dj-setup-identity-row-${i}`}>
              <span className="mx-dj-setup__prefix" data-testid={`dj-setup-identity-prefix-${i}`}>
                {IDENTITY_PREFIX}
              </span>
              <div className="mx-dj-setup__input-row">
                <textarea
                  ref={el => {
                    autoGrowField(el)
                    if (i === 0) stepFieldRef.current = el
                  }}
                  rows={1}
                  className="mx-dj-setup__input"
                  value={r}
                  onChange={e => updateReminder(i, e.target.value)}
                  placeholder={IDENTITY_PLACEHOLDER}
                  maxLength={500}
                  data-testid={`dj-setup-reminder-${i}`}
                />
                {r.trim() && (
                  <button
                    type="button"
                    className="mx-dj-setup__delete"
                    onClick={() => deleteReminder(i)}
                    aria-label="Удалить"
                    data-testid={`dj-setup-reminder-delete-${i}`}
                  >
                    <X size={16} strokeWidth={1.5} />
                  </button>
                )}
              </div>
            </div>
          ))}
          {!reminders.some(r => !r.trim()) && reminders.length < 5 && (
            <button
              type="button"
              className="mx-dj-setup__add"
              data-testid="dj-setup-add"
              onClick={addReminder}
            >
              <Plus size={16} strokeWidth={1.5} /> Добавить
            </button>
          )}
          {renderChips()}
        </>
      )
    }

    if (stepIndex === 2) {
      const sub = VISION_SUBSTEPS[visionSubStep]
      const subLabel = `${step.label} · ${visionSubStep + 1}/3`
      return (
        <>
          <CapsLabel className="mx-dj-setup__step-label" data-testid="dj-setup-vision-label">
            {subLabel}
          </CapsLabel>
          <h2 className="mx-dj-setup__vision-title">{sub.title}</h2>
          <p className="mx-dj-setup__hint" data-testid="dj-setup-vision-hint">
            {sub.hint}
          </p>
          <textarea
            ref={stepFieldRef}
            className="mx-dj-setup__vision-field"
            value={vision[sub.key]}
            onChange={e => setVision(prev => ({ ...prev, [sub.key]: e.target.value }))}
            rows={3}
            maxLength={1000}
            placeholder={sub.placeholder}
            data-testid={`dj-setup-vision-${sub.key}`}
          />
          {renderChips()}
        </>
      )
    }

    if (stepIndex === 3) {
      return (
        <>
          <CapsLabel className="mx-dj-setup__step-label">{step.label}</CapsLabel>
          <JournalField question={step.title} hint={step.hint} className="mx-dj-setup__field-group" />
          {prompts.map((p, i) => (
            <div key={i} className="mx-dj-setup__input-row">
              <textarea
                ref={i === 0 ? stepFieldRef : undefined}
                className="mx-dj-setup__input mx-dj-setup__input--textarea"
                value={p}
                onChange={e => updatePrompt(i, e.target.value)}
                placeholder={`Вопрос ${i + 1}`}
                maxLength={500}
                rows={2}
                data-testid={`dj-setup-prompt-${i}`}
              />
              {p.trim() && prompts.length > 1 && (
                <button
                  type="button"
                  className="mx-dj-setup__delete"
                  onClick={() => deletePrompt(i)}
                  aria-label="Удалить"
                  data-testid={`dj-setup-prompt-delete-${i}`}
                >
                  <X size={16} strokeWidth={1.5} />
                </button>
              )}
            </div>
          ))}
          {!prompts.some(p => !p.trim()) && prompts.length < 7 && (
            <button
              type="button"
              className="mx-dj-setup__add"
              data-testid="dj-setup-add-prompt"
              onClick={addPrompt}
            >
              <Plus size={16} strokeWidth={1.5} /> Добавить вопрос
            </button>
          )}
          {renderChips()}
        </>
      )
    }

    // Step 4: Reminder (tiles)
    return (
      <>
        <CapsLabel className="mx-dj-setup__step-label" data-testid="dj-setup-reminder-label">
          {step.label}
        </CapsLabel>
        <JournalField question={step.title} hint={step.hint} className="mx-dj-setup__field-group" />
        <div className="mx-dj-reminder__tiles">
          {REMINDER_TILES.map(tile => (
            <button
              key={tile.time}
              type="button"
              className={`mx-dj-reminder__tile${
                reminderMode === 'preset' && reminder.time === tile.time
                  ? ' mx-dj-reminder__tile--selected'
                  : ''
              }`}
              data-testid={`dj-setup-reminder-${tile.label}`}
              onClick={() => selectReminderTile(tile.time)}
            >
              <span>{tile.label}</span>
              <span className="mx-dj-reminder__tile-time">{tile.time}</span>
            </button>
          ))}
          <button
            type="button"
            className={`mx-dj-reminder__tile${
              reminderMode === 'custom' ? ' mx-dj-reminder__tile--selected' : ''
            }`}
            data-testid="dj-setup-reminder-custom"
            onClick={handleCustomTileClick}
          >
            <span>Своё время</span>
            {reminderMode === 'custom' && (
              <span className="mx-dj-reminder__tile-time">{reminder.time}</span>
            )}
          </button>
          {reminderMode === 'custom' && (
            <div className="mx-dj-reminder__time-picker">
              <input
                ref={timeInputRef}
                type="time"
                step={300}
                className="mx-dj-reminder__time-input"
                value={reminder.time}
                onChange={e => selectReminderCustom(e.target.value)}
                data-testid="dj-setup-reminder-time"
              />
            </div>
          )}
          <button
            type="button"
            className={`mx-dj-reminder__tile${
              reminderMode === 'off' ? ' mx-dj-reminder__tile--selected' : ''
            }`}
            data-testid="dj-setup-reminder-off"
            onClick={selectReminderOff}
          >
            <span>Не напоминать</span>
          </button>
        </div>
      </>
    )
  }

  const content = hasContent()

  /*
   * #1090: круглая кнопка как в чек-ине — пока ничего не введено, ✕ (назад);
   * после ввода/выбора «→»; на последнем шаге ✓ (сохранить).
   */
  const submitIcon = !content ? 'close' : isLastStep ? 'check' : 'arrow'
  const submitLabel = !content
    ? 'Назад'
    : isLastStep
      ? 'Сохранить'
      : 'Далее'

  return (
    <Screen
      onBack={goBack}
      registerSystemBack={false}
      scroll
      footer={
        <div className="mx-dj-footer-bar">
          <RoundNextButton
            onClick={content ? proceed : goBack}
            icon={submitIcon}
            label={submitLabel}
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
