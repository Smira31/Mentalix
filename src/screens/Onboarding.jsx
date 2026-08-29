import { useEffect, useState } from 'react'
import { platform } from '../platform'
import { api } from '../lib/api'
import { Check } from 'lucide-react'
import BackButton from '../components/BackButton'
import {
  useFullscreenSurface,
  FULLSCREEN_SHELL_CLASS,
  FULLSCREEN_HEADER_SLOT_CLASS,
  FULLSCREEN_SCROLL_CLASS,
} from '../lib/fullscreenSurface'
import './Onboarding.css'

// ── Онбординг по схеме stoic.: приветствие → вопросы о себе →
// напоминания → «план готов» с зеркалом ответов ──

const FOCUS_OPTIONS = [
  {
    key: 'calm',
    label: 'Меньше тревоги',
    proof:
      'Регулярная рефлексия снижает уровень тревоги: это подтверждают более 200 исследований о письменных практиках.',
  },
  {
    key: 'discipline',
    label: 'Больше дисциплины',
    proof:
      'Дисциплина — не характер, а система. Ритуалы и аскезы держат её за тебя, когда мотивация кончилась.',
  },
  {
    key: 'focus',
    label: 'Собранность и фокус',
    proof:
      'Одно действие за раз работает лучше списка из десяти. Mentalix всегда показывает только следующий шаг.',
  },
  {
    key: 'sleep',
    label: 'Спокойный сон',
    proof:
      'Вечерняя выгрузка мыслей на бумагу помогает засыпать быстрее: голова перестаёт дожёвывать день.',
  },
  {
    key: 'self',
    label: 'Понять себя',
    proof:
      'Чек-ины копят данные о твоём состоянии. Через пару недель ты увидишь, что на тебя влияет на самом деле.',
  },
]

const AGE_OPTIONS = ['До 18', '18–24', '25–34', '35–44', '45+']

const REMINDER_OPTIONS = [
  { key: 'morning', label: 'Утро', time: '08:00', hour: 8, note: 'задать курс на день' },
  { key: 'day', label: 'День', time: '14:00', hour: 14, note: 'вернуться к себе в середине дня' },
  { key: 'evening', label: 'Вечер', time: '19:00', hour: 19, note: 'разобрать день, пока свежий' },
]

const PLAN_CARDS = [
  'Всё, что ты пишешь, остаётся только твоим',
  'Наставник, Собеседник и Следопыт готовы к разговору',
  'Первый шаг уже ждёт тебя на главной',
]

// ── шапка: системный Telegram BackButton · прогресс ──
function Head({ step, total, onBack }) {
  return (
    <div className="w-full max-w-md px-5 pt-5 grid grid-cols-[1fr_auto_1fr] items-center">
      <div className="justify-self-start">
        <BackButton onClick={onBack} />
      </div>

      {step < total - 1 ? (
        <div className="flex gap-1.5" aria-label={`Шаг ${step + 1} из ${total}`}>
          {Array.from({ length: total }).map((_, i) => (
            <span key={i} className="mx-onboarding-progress-dot" data-complete={i <= step} />
          ))}
        </div>
      ) : (
        <span aria-hidden="true" />
      )}

      <span aria-hidden="true" />
    </div>
  )
}

// ── карточка-вариант: выбранная инвертируется и раскрывает довод ──
function Option({ label, proof, selected, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="mx-onboarding-option w-full rounded-[22px] px-5 py-4 text-center border-0"
      data-selected={selected}
      aria-pressed={selected}
    >
      <span className="block text-[14px] font-bold">{label}</span>
      {proof && selected && (
        <span className="mx-onboarding-proof block text-[12.5px] leading-snug mt-2 opacity-70">
          {proof}
        </span>
      )}
    </button>
  )
}

export default function Onboarding({ user, onFinish }) {
  const [step, setStep] = useState(0)
  const [focuses, setFocuses] = useState([])
  const [age, setAge] = useState(null)
  const [reminder, setReminder] = useState('morning')
  const [revealed, setRevealed] = useState(0)

  /*
   * Раньше отступ сверху запрашивался как var(--tg-top, 0px),
   * но такой переменной в проекте нет — она нигде не объявлена.
   * Значит фактически применялся 0px, и в fullscreen онбординг
   * лез под контролы Telegram. Теперь экран живёт по тому же
   * контракту, что CheckIn и «Тема недели».
   */
  const { style: surfaceStyle } = useFullscreenSurface()

  const TOTAL = 5

  // На финальном экране карточки уже занимают свои места и только
  // набирают контраст. Так список не прыгает во время появления.
  useEffect(() => {
    if (step !== 4) return
    const timers = PLAN_CARDS.map((_, i) =>
      setTimeout(
        () => {
          setRevealed(i + 1)
          if (i === PLAN_CARDS.length - 1) {
            platform.haptic('light')
          }
        },
        420 + i * 520
      )
    )
    return () => timers.forEach(clearTimeout)
  }, [step])

  function next() {
    platform.haptic('light')
    setStep(s => s + 1)
  }

  async function finish() {
    platform.haptic('medium')
    const opt = REMINDER_OPTIONS.find(r => r.key === reminder)
    try {
      localStorage.setItem('mx-onboarding', JSON.stringify({ focuses, age, reminder }))
    } catch {
      // приватный режим/квота — не критично
    }
    try {
      if (user?.id && opt) {
        await api.profile.saveSettings(user.id, { reminder_enabled: true, reminder_hour: opt.hour })
      }
    } catch (e) {
      console.error(e)
    }
    onFinish()
  }

  const chosenFocusLabels = FOCUS_OPTIONS.filter(f => focuses.includes(f.key)).map(f =>
    f.label.toLowerCase()
  )

  return (
    <div className={FULLSCREEN_SHELL_CLASS} style={surfaceStyle}>
      <div className={FULLSCREEN_HEADER_SLOT_CLASS}>
        {step > 0 && (
          <Head step={step} total={TOTAL} onBack={() => setStep(current => current - 1)} />
        )}
      </div>
      <div className={FULLSCREEN_SCROLL_CLASS}>
        {/* ── 0. Приветствие ── */}
        {step === 0 && (
          <div className="mx-onboarding-step mx-onboarding-intro-step flex-1 w-full max-w-md flex flex-col items-center justify-center px-8 text-center">
            <div className="mx-onboarding-intro-copy flex flex-col items-center">
              <h2 className="font-display text-[30px] text-cream leading-tight">Mentalix.</h2>
              <p className="text-[14px] text-muted mt-4 leading-relaxed max-w-xs">
                Пара вопросов — и приложение соберётся под тебя. Это займёт минуту.
              </p>
              <button onClick={next} className="cta-pill text-[16px] px-14 py-4 mt-10">
                Начать
              </button>
            </div>
          </div>
        )}

        {/* ── 1. Фокусы ── */}
        {step === 1 && (
          <div
            key="s1"
            className="mx-onboarding-step flex-1 w-full max-w-md flex flex-col justify-center px-6 py-8"
          >
            <h2 className="font-display text-[22px] text-cream text-center leading-tight">
              Что сейчас важнее всего?
            </h2>
            <p className="text-[13px] text-muted mt-3 mb-7 text-center leading-snug">
              Ответы соберут приложение под твои задачи. Можно выбрать несколько.
            </p>
            <div className="space-y-2.5">
              {FOCUS_OPTIONS.map(o => (
                <Option
                  key={o.key}
                  label={o.label}
                  proof={o.proof}
                  selected={focuses.includes(o.key)}
                  onClick={() => {
                    platform.haptic('light')
                    setFocuses(f =>
                      f.includes(o.key) ? f.filter(k => k !== o.key) : [...f, o.key]
                    )
                  }}
                />
              ))}
            </div>
            <p className="text-[12px] text-faint text-center mt-6 leading-snug">
              Выбор ничего не ограничивает — все функции остаются доступными.
            </p>
            <button
              type="button"
              onClick={next}
              disabled={focuses.length === 0}
              className="cta-pill text-[16px] px-14 py-4 mx-auto mt-8 disabled:opacity-30"
            >
              Дальше
            </button>
          </div>
        )}

        {/* ── 2. Возраст ── */}
        {step === 2 && (
          <div
            key="s2"
            className="mx-onboarding-step flex-1 w-full max-w-md flex flex-col justify-center px-6 py-8"
          >
            <h2 className="font-display text-[22px] text-cream text-center leading-tight">
              Сколько тебе лет?
            </h2>
            <p className="text-[13px] text-muted mt-3 mb-7 text-center leading-snug">
              Чтобы говорить с тобой на одном языке.
            </p>
            <div className="space-y-2.5">
              {AGE_OPTIONS.map(a => (
                <Option
                  key={a}
                  label={a}
                  selected={age === a}
                  onClick={() => {
                    platform.haptic('light')
                    setAge(a)
                  }}
                />
              ))}
            </div>
            <p className="text-[12px] text-faint text-center mt-6">Это остаётся только у тебя.</p>
            <button
              type="button"
              onClick={next}
              disabled={!age}
              className="cta-pill text-[16px] px-14 py-4 mx-auto mt-8 disabled:opacity-30"
            >
              Дальше
            </button>
          </div>
        )}

        {/* ── 3. Напоминание ── */}
        {step === 3 && (
          <div
            key="s3"
            className="mx-onboarding-step flex-1 w-full max-w-md flex flex-col justify-center px-6 py-8"
          >
            <h2 className="font-display text-[22px] text-cream text-center leading-tight">
              Когда напомнить о себе?
            </h2>
            <p className="text-[13px] text-muted mt-3 mb-7 text-center leading-snug">
              Привычка держится на одном постоянном времени. Бот пришлёт короткое сообщение — не
              спам.
            </p>

            <div className="space-y-2.5">
              {REMINDER_OPTIONS.map(r => {
                const on = reminder === r.key
                return (
                  <button
                    key={r.key}
                    onClick={() => {
                      platform.haptic('light')
                      setReminder(r.key)
                    }}
                    type="button"
                    className={[
                      'mx-onboarding-reminder w-full rounded-3xl px-5 py-4 flex items-center gap-4 border-0 text-left',
                      on ? 'bg-cream text-emerald-deep' : 'bg-emerald text-cream',
                    ]}
                    aria-pressed={on}
                  >
                    <span className="flex-1">
                      <span
                        className={`block text-[12px] font-bold ${on ? 'opacity-60' : 'text-muted'}`}
                      >
                        {r.label}
                      </span>
                      <span className="block font-display text-[22px] leading-tight">{r.time}</span>
                      <span
                        className={`block text-[12px] mt-0.5 ${on ? 'opacity-60' : 'text-faint'}`}
                      >
                        {r.note}
                      </span>
                    </span>
                    <span
                      className={[
                        'mx-onboarding-reminder-check w-6 h-6 rounded-full flex items-center justify-center shrink-0',
                        on ? 'bg-emerald-deep text-cream' : 'bg-cream/10 text-transparent',
                      ].join(' ')}
                    >
                      <Check size={14} strokeWidth={3} />
                    </span>
                  </button>
                )
              })}
            </div>

            <button
              type="button"
              onClick={next}
              className="cta-pill text-[16px] px-14 py-4 mx-auto mt-8"
            >
              Дальше
            </button>
          </div>
        )}

        {/* ── 4. План готов ── */}
        {step === 4 && (
          <div
            key="s4"
            className="mx-onboarding-step flex-1 w-full max-w-md flex flex-col justify-center px-6 py-8"
          >
            <h2 className="font-display text-[24px] text-cream text-center leading-tight">
              Готово. Путь размечен.
            </h2>
            {chosenFocusLabels.length > 0 && (
              <p className="text-[13px] text-muted mt-3 text-center leading-snug">
                Фокус: <span className="text-cream font-bold">{chosenFocusLabels.join(', ')}</span>
              </p>
            )}

            <div className="space-y-2.5 mt-8">
              {PLAN_CARDS.map((text, i) => {
                const shown = revealed > i
                return (
                  <div
                    key={i}
                    className="mx-onboarding-plan-card rounded-3xl bg-emerald px-5 py-4 flex items-center gap-3"
                    data-revealed={shown}
                  >
                    <span className="flex-1 text-[13px] font-semibold text-cream leading-snug">
                      {text}
                    </span>
                    <Check
                      size={20}
                      strokeWidth={2.5}
                      className="mx-onboarding-plan-check shrink-0"
                      data-revealed={shown}
                      aria-hidden="true"
                    />
                  </div>
                )
              })}
            </div>

            {/* лабиринт заполняется по мере готовности плана */}
            <button
              type="button"
              onClick={finish}
              disabled={revealed < PLAN_CARDS.length}
              className="cta-pill text-[16px] px-14 py-4 mx-auto mt-8 disabled:opacity-30"
            >
              {revealed < PLAN_CARDS.length ? 'Собираю...' : 'Войти'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
