import { useEffect, useState } from 'react'
import { platform } from '../platform'
import { api } from '../lib/api'
import { ChevronLeft, Check } from 'lucide-react'
import MazeLogo from '../components/MazeLogo'
import { MotifArt } from '../components/Motif'
import { useFullscreenSurface } from '../lib/fullscreenSurface'

// ── Онбординг по схеме stoic.: приветствие → вопросы о себе →
// напоминания → «план готов» с зеркалом ответов ──

const FOCUS_OPTIONS = [
  { key: 'calm', label: 'Меньше тревоги', proof: 'Регулярная рефлексия снижает уровень тревоги: это подтверждают более 200 исследований о письменных практиках.' },
  { key: 'discipline', label: 'Больше дисциплины', proof: 'Дисциплина — не характер, а система. Ритуалы и аскезы держат её за тебя, когда мотивация кончилась.' },
  { key: 'focus', label: 'Собранность и фокус', proof: 'Одно действие за раз работает лучше списка из десяти. Mentalix всегда показывает только следующий шаг.' },
  { key: 'sleep', label: 'Спокойный сон', proof: 'Вечерняя выгрузка мыслей на бумагу помогает засыпать быстрее: голова перестаёт дожёвывать день.' },
  { key: 'self', label: 'Понять себя', proof: 'Чек-ины копят данные о твоём состоянии. Через пару недель ты увидишь, что на тебя влияет на самом деле.' },
]

const AGE_OPTIONS = ['До 18', '18–24', '25–34', '35–44', '45+']

const REMINDER_OPTIONS = [
  { key: 'morning', label: 'Утро', time: '08:00', hour: 8, note: 'задать курс на день' },
  { key: 'day', label: 'День', time: '14:00', hour: 14, note: 'вернуться к себе в середине дня' },
  { key: 'evening', label: 'Вечер', time: '19:00', hour: 19, note: 'разобрать день, пока свежий' },
]

const PLAN_CARDS = [
  { motif: 'povedenie', text: 'Всё, что ты пишешь, остаётся только твоим' },
  { motif: 'sobesednik', text: 'Наставник, Собеседник и Следопыт готовы к разговору' },
  { motif: 'lestnica', text: 'Первый шаг уже ждёт тебя на главной' },
]

// ── шапка: назад · прогресс · пропустить ──
function Head({ step, total, onBack, onSkip }) {
  return (
    <div className="w-full max-w-md px-5 pt-5 flex items-center justify-between">
      {step > 0 ? (
        <button
          onClick={() => { platform.haptic('light'); onBack() }}
          aria-label="Назад"
          className="w-10 h-10 rounded-full bg-emerald flex items-center justify-center active:scale-95 transition-transform border-0"
        >
          <ChevronLeft size={20} className="text-cream/60" />
        </button>
      ) : <span className="w-10" />}

      <div className="flex gap-1.5">
        {Array.from({ length: total }).map((_, i) => (
          <span key={i} className={`w-1.5 h-1.5 rounded-full ${i <= step ? 'bg-gold' : 'bg-cream/15'}`} />
        ))}
      </div>

      {onSkip ? (
        <button
          onClick={() => { platform.haptic('light'); onSkip() }}
          className="text-[13px] font-bold text-cream/35 bg-transparent border-0 py-1 w-14 text-right"
        >
          Далее
        </button>
      ) : <span className="w-10" />}
    </div>
  )
}

// ── карточка-вариант: выбранная инвертируется и раскрывает довод ──
function Option({ label, proof, selected, onClick }) {
  return (
    <button
      onClick={onClick}
      className={[
        'w-full text-center transition-all duration-300 border-0',
        proof && selected ? 'rounded-3xl px-5 py-4' : 'rounded-full px-5 py-4',
        selected ? 'bg-cream text-emerald-deep' : 'bg-emerald text-cream',
      ].join(' ')}
    >
      <span className="block text-[15px] font-bold">{label}</span>
      {proof && selected && (
        <span className="block text-[12.5px] leading-snug mt-2 opacity-70 animate-fade-in">{proof}</span>
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

  // на финальном экране карточки проявляются одна за другой
  useEffect(() => {
    if (step !== 4) return
    setRevealed(0)
    const timers = PLAN_CARDS.map((_, i) =>
      setTimeout(() => {
        setRevealed(i + 1)
        platform.haptic('light')
      }, 700 + i * 900)
    )
    return () => timers.forEach(clearTimeout)
  }, [step])

  function next() {
    platform.haptic('light')
    setStep((s) => s + 1)
  }

  async function finish() {
    platform.haptic('medium')
    const opt = REMINDER_OPTIONS.find((r) => r.key === reminder)
    try {
      localStorage.setItem('mx-onboarding', JSON.stringify({ focuses, age, reminder }))
    } catch {}
    try {
      if (user?.id && opt) {
        await api.profile.saveSettings(user.id, { reminder_enabled: true, reminder_hour: opt.hour })
      }
    } catch (e) {
      console.error(e)
    }
    onFinish()
  }

  const chosenFocusLabels = FOCUS_OPTIONS.filter((f) => focuses.includes(f.key)).map((f) => f.label.toLowerCase())

  return (
    <div
      className="fixed top-0 left-0 right-0 z-[70] bg-emerald-deep flex flex-col items-center animate-fade-in overflow-y-auto"
      style={surfaceStyle}
    >
      {step > 0 && step < 4 && (
        <Head step={step} total={TOTAL} onBack={() => setStep(step - 1)} onSkip={next} />
      )}

      {/* ── 0. Приветствие ── */}
      {step === 0 && (
        <div className="flex-1 w-full max-w-md flex flex-col items-center justify-center px-8 text-center animate-fade-in">
          <MazeLogo size={190} progress={0.35} className="mb-10" />
          <h2 className="font-display text-[30px] text-cream leading-tight">
            это Mentalix.
            <br />
            твоя система, а не мотивация
          </h2>
          <p className="text-[15px] text-cream/50 mt-4 leading-relaxed max-w-xs">
            Пара вопросов — и приложение соберётся под тебя. Это займёт минуту.
          </p>
          <button onClick={next} className="cta-pill text-[16px] px-14 py-4 mt-10">
            Начать
          </button>
        </div>
      )}

      {/* ── 1. Фокусы ── */}
      {step === 1 && (
        <div key="s1" className="flex-1 w-full max-w-md flex flex-col justify-center px-6 py-8 animate-fade-in">
          <h2 className="font-display text-[26px] text-cream text-center leading-tight">Что сейчас важнее всего?</h2>
          <p className="text-[14px] text-cream/45 mt-3 mb-7 text-center leading-snug">
            Ответы соберут приложение под твои задачи. Можно выбрать несколько.
          </p>
          <div className="space-y-2.5">
            {FOCUS_OPTIONS.map((o) => (
              <Option
                key={o.key}
                label={o.label}
                proof={o.proof}
                selected={focuses.includes(o.key)}
                onClick={() => {
                  platform.haptic('light')
                  setFocuses((f) => (f.includes(o.key) ? f.filter((k) => k !== o.key) : [...f, o.key]))
                }}
              />
            ))}
          </div>
          <p className="text-[12px] text-cream/30 text-center mt-6 leading-snug">
            Выбор ничего не ограничивает — все функции остаются доступными.
          </p>
          <button
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
        <div key="s2" className="flex-1 w-full max-w-md flex flex-col justify-center px-6 py-8 animate-fade-in">
          <h2 className="font-display text-[26px] text-cream text-center leading-tight">Сколько тебе лет?</h2>
          <p className="text-[14px] text-cream/45 mt-3 mb-7 text-center leading-snug">
            Чтобы говорить с тобой на одном языке.
          </p>
          <div className="space-y-2.5">
            {AGE_OPTIONS.map((a) => (
              <Option
                key={a}
                label={a}
                selected={age === a}
                onClick={() => { platform.haptic('light'); setAge(a); setTimeout(next, 260) }}
              />
            ))}
          </div>
          <p className="text-[12px] text-cream/30 text-center mt-6">Это остаётся только у тебя.</p>
        </div>
      )}

      {/* ── 3. Напоминание ── */}
      {step === 3 && (
        <div key="s3" className="flex-1 w-full max-w-md flex flex-col justify-center px-6 py-8 animate-fade-in">
          <h2 className="font-display text-[26px] text-cream text-center leading-tight">
            Когда напомнить о себе?
          </h2>
          <p className="text-[14px] text-cream/45 mt-3 mb-7 text-center leading-snug">
            Привычка держится на одном постоянном времени. Бот пришлёт короткое сообщение — не спам.
          </p>

          <div className="space-y-2.5">
            {REMINDER_OPTIONS.map((r) => {
              const on = reminder === r.key
              return (
                <button
                  key={r.key}
                  onClick={() => { platform.haptic('light'); setReminder(r.key) }}
                  className={[
                    'w-full rounded-3xl px-5 py-4 flex items-center gap-4 border-0 transition-colors text-left',
                    on ? 'bg-cream text-emerald-deep' : 'bg-emerald text-cream',
                  ].join(' ')}
                >
                  <span className="flex-1">
                    <span className={`block text-[13px] font-bold ${on ? 'opacity-60' : 'text-cream/45'}`}>{r.label}</span>
                    <span className="block font-display text-[24px] leading-tight">{r.time}</span>
                    <span className={`block text-[12px] mt-0.5 ${on ? 'opacity-60' : 'text-cream/35'}`}>{r.note}</span>
                  </span>
                  <span
                    className={[
                      'w-6 h-6 rounded-full flex items-center justify-center shrink-0 transition-colors',
                      on ? 'bg-emerald-deep text-cream' : 'bg-cream/10 text-transparent',
                    ].join(' ')}
                  >
                    <Check size={14} strokeWidth={3} />
                  </span>
                </button>
              )
            })}
          </div>

          <button onClick={next} className="cta-pill text-[16px] px-14 py-4 mx-auto mt-8">
            Дальше
          </button>
        </div>
      )}

      {/* ── 4. План готов ── */}
      {step === 4 && (
        <div key="s4" className="flex-1 w-full max-w-md flex flex-col justify-center px-6 py-8 animate-fade-in">
          <h2 className="font-display text-[28px] text-cream text-center leading-tight">
            Готово. Путь размечен.
          </h2>
          {chosenFocusLabels.length > 0 && (
            <p className="text-[14px] text-cream/55 mt-3 text-center leading-snug">
              Фокус: <span className="text-cream font-bold">{chosenFocusLabels.join(', ')}</span>
            </p>
          )}

          <div className="space-y-2.5 mt-8">
            {PLAN_CARDS.map((c, i) => {
              const shown = revealed > i
              return (
                <div
                  key={i}
                  className={[
                    'rounded-3xl bg-emerald px-5 py-4 flex items-center gap-4 transition-all duration-500',
                    shown ? 'opacity-100 translate-y-0' : 'opacity-25 translate-y-1',
                  ].join(' ')}
                >
                  <MotifArt name={c.motif} size={44} className="shrink-0" />
                  <span className="flex-1 text-[14px] font-semibold text-cream leading-snug">{c.text}</span>
                  <span
                    className={[
                      'w-6 h-6 rounded-full flex items-center justify-center shrink-0 transition-all',
                      shown ? 'bg-gold/20 text-gold animate-celebrate-pop' : 'bg-cream/5 text-transparent',
                    ].join(' ')}
                  >
                    <Check size={14} strokeWidth={3} />
                  </span>
                </div>
              )
            })}
          </div>

          {/* лабиринт заполняется по мере готовности плана */}
          <div className="flex justify-center mt-9">
            <MazeLogo size={110} progress={revealed / PLAN_CARDS.length} />
          </div>

          <button
            onClick={finish}
            disabled={revealed < PLAN_CARDS.length}
            className="cta-pill text-[16px] px-14 py-4 mx-auto mt-8 disabled:opacity-30"
          >
            {revealed < PLAN_CARDS.length ? 'Собираю...' : 'Войти'}
          </button>
        </div>
      )}
    </div>
  )
}
