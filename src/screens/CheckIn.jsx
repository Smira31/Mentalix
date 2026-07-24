import { useState } from 'react'
import { platform } from '../platform'
import { api } from '../lib/api'
import { X, ChevronLeft } from 'lucide-react'

// ── Ежедневный чек-ин в стиле stoic.: один вопрос на экран ──
// Шаги: настроение → энергия → тревога → фокус → заметка → празднование
// Бэкенд: POST /api/checkin (mood, energy, anxiety, focus — 1..5, note)

// лицо с меняющимся ртом: от грустного (1) к сияющему (5)
function Face({ level, active, size = 56 }) {
  const mouths = [
    'M18 40 Q28 32 38 40',        // грустный
    'M18 38 Q28 35 38 38',        // так себе
    'M18 38 H38',                  // нейтральный
    'M18 36 Q28 42 38 36',        // улыбка
    'M16 34 Q28 46 40 34',        // сияющий
  ]
  return (
    <svg width={size} height={size} viewBox="0 0 56 56" fill="none">
      <circle cx="28" cy="28" r="26" className={active ? 'stroke-gold' : 'stroke-cream/25'} strokeWidth="2.5" />
      <circle cx="20" cy="22" r="2.4" className={active ? 'fill-gold' : 'fill-cream/40'} />
      <circle cx="36" cy="22" r="2.4" className={active ? 'fill-gold' : 'fill-cream/40'} />
      <path d={mouths[level - 1]} className={active ? 'stroke-gold' : 'stroke-cream/40'} strokeWidth="2.5" strokeLinecap="round" fill="none" />
    </svg>
  )
}

const SCALE_STEPS = [
  {
    key: 'mood',
    title: 'Как ты сейчас?',
    hint: 'Честный ответ важнее красивого',
    labels: ['Тяжко', 'Так себе', 'Нормально', 'Хорошо', 'Отлично'],
    faces: true,
  },
  {
    key: 'energy',
    title: 'Сколько в тебе энергии?',
    hint: 'Прислушайся к телу',
    labels: ['На нуле', 'Мало', 'Средне', 'Много', 'Через край'],
  },
  {
    key: 'anxiety',
    title: 'Насколько тревожно?',
    hint: 'Тревога — это просто данные',
    labels: ['Спокойно', 'Слегка', 'Заметно', 'Сильно', 'Штормит'],
  },
  {
    key: 'focus',
    title: 'Насколько ты собран?',
    hint: 'Где сейчас твоё внимание',
    labels: ['Рассеян', 'Плыву', 'Держусь', 'Собран', 'Кристально'],
  },
]

// вечером заметка превращается в короткую рефлексию: три вопроса о дне
const EVENING_PROMPTS = [
  { key: 'good', title: 'Что сегодня получилось?', hint: 'Даже маленькое считается', prefix: 'Получилось' },
  { key: 'hard', title: 'Что было трудно?', hint: 'Трудность — тоже часть пути', prefix: 'Трудно' },
  { key: 'takeaway', title: 'Какой вывод забираешь?', hint: 'Одна мысль, которую стоит запомнить', prefix: 'Вывод' },
]

export default function CheckIn({ user, onDone }) {
  const isEvening = new Date().getHours() >= 18
  const noteSteps = isEvening ? EVENING_PROMPTS.length : 1
  const [step, setStep] = useState(0) // шкалы → заметка/рефлексия → празднование
  const [values, setValues] = useState({ mood: null, energy: null, anxiety: null, focus: null })
  const [note, setNote] = useState('')
  const [answers, setAnswers] = useState({})
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(false)

  const totalSteps = SCALE_STEPS.length + noteSteps
  const doneStep = totalSteps // индекс экрана празднования

  function pick(key, level) {
    platform.haptic('light')
    setValues((v) => ({ ...v, [key]: level }))
    // авто-переход: выбрал — едем дальше, как у stoic.
    setTimeout(() => setStep((s) => s + 1), 280)
  }

  async function submit() {
    setSaving(true)
    setError(false)
    const finalNote = isEvening
      ? EVENING_PROMPTS
          .map((pr) => (answers[pr.key] || '').trim() && `${pr.prefix}: ${answers[pr.key].trim()}`)
          .filter(Boolean)
          .join('\n') || null
      : note.trim() || null
    try {
      await api.checkin.save(user.id, { ...values, note: finalNote })
      platform.haptic('success')
      setStep(doneStep)
    } catch (e) {
      console.error(e)
      setError(true)
    } finally {
      setSaving(false)
    }
  }

  // ── празднование ──
  if (step === doneStep) {
    return (
      <div className="fixed inset-0 z-[60] bg-emerald-deep flex flex-col items-center justify-center px-8 text-center animate-fade-in">
        <div className="animate-celebrate-pop mb-8">
          <Face level={values.mood || 4} active size={88} />
        </div>
        <h2 className="font-display text-[26px] text-cream leading-tight">Чек-ин записан</h2>
        <p className="text-[15px] text-cream/50 mt-3 leading-relaxed">
          Ты услышал себя — это тоже шаг.
          <br />
          Путь продолжается.
        </p>
        <button
          onClick={() => { platform.haptic('light'); onDone() }}
          className="cta-pill text-[16px] px-12 py-4 mt-10"
        >
          К дню
        </button>
      </div>
    )
  }

  const isNoteStep = step >= SCALE_STEPS.length
  const scale = SCALE_STEPS[step]
  const promptIdx = step - SCALE_STEPS.length
  const prompt = isEvening ? EVENING_PROMPTS[promptIdx] : null
  const isLastNote = promptIdx === noteSteps - 1

  return (
    <div className="fixed inset-0 z-[60] bg-emerald-deep flex flex-col animate-fade-in">
      {/* шапка: назад · прогресс · закрыть */}
      <div className="flex items-center justify-between px-5 pt-5">
        <button
          onClick={() => { platform.haptic('light'); step === 0 ? onDone() : setStep(step - 1) }}
          aria-label="Назад"
          className="w-10 h-10 rounded-full bg-emerald flex items-center justify-center active:scale-95 transition-transform border-0"
        >
          <ChevronLeft size={20} className="text-cream/60" />
        </button>
        <div className="flex gap-1.5">
          {Array.from({ length: totalSteps }).map((_, i) => (
            <span
              key={i}
              className={`w-1.5 h-1.5 rounded-full ${i <= step ? 'bg-gold' : 'bg-cream/15'}`}
            />
          ))}
        </div>
        <button
          onClick={() => { platform.haptic('light'); onDone() }}
          aria-label="Закрыть"
          className="w-10 h-10 rounded-full bg-emerald flex items-center justify-center active:scale-95 transition-transform border-0"
        >
          <X size={18} className="text-cream/60" />
        </button>
      </div>

      {/* ── шаги-шкалы ── */}
      {!isNoteStep && (
        <div key={step} className="flex-1 flex flex-col items-center justify-center px-6 animate-fade-in">
          <div className="text-[12px] text-cream/35 font-semibold mb-2 uppercase tracking-wide">
            Чек-ин дня · {step + 1} из {totalSteps}
          </div>
          <h2 className="font-display text-[26px] text-cream text-center leading-tight">{scale.title}</h2>
          <p className="text-[14px] text-cream/45 mt-2 mb-10">{scale.hint}</p>

          <div className="flex items-end justify-center gap-3 w-full max-w-sm">
            {[1, 2, 3, 4, 5].map((lvl) => {
              const active = values[scale.key] === lvl
              return (
                <button
                  key={lvl}
                  onClick={() => pick(scale.key, lvl)}
                  className="flex flex-col items-center gap-2 border-0 bg-transparent active:scale-90 transition-transform flex-1"
                >
                  {scale.faces ? (
                    <Face level={lvl} active={active} />
                  ) : (
                    <span
                      className={[
                        'w-12 h-12 rounded-full flex items-center justify-center text-[16px] font-bold transition-colors',
                        active ? 'bg-gold text-emerald-deep' : 'bg-emerald text-cream/50',
                      ].join(' ')}
                    >
                      {lvl}
                    </span>
                  )}
                  <span className={`text-[10px] font-semibold leading-tight text-center ${active ? 'text-gold' : 'text-cream/35'}`}>
                    {scale.labels[lvl - 1]}
                  </span>
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* ── заметка (день) / рефлексия (вечер) ── */}
      {isNoteStep && (
        <div key={step} className="flex-1 flex flex-col px-6 pt-10 animate-fade-in">
          <div className="text-[12px] text-cream/35 font-semibold mb-2 uppercase tracking-wide text-center">
            {isEvening ? 'Вечерняя рефлексия' : 'Чек-ин дня'} · {step + 1} из {totalSteps}
          </div>
          <h2 className="font-display text-[26px] text-cream text-center leading-tight">
            {prompt ? prompt.title : 'Что на уме?'}
          </h2>
          <p className="text-[14px] text-cream/45 mt-2 mb-6 text-center">
            {prompt ? prompt.hint : 'Пара слов — уже разговор с собой. Можно пропустить.'}
          </p>
          <textarea
            value={prompt ? (answers[prompt.key] || '') : note}
            onChange={(e) =>
              prompt
                ? setAnswers((a) => ({ ...a, [prompt.key]: e.target.value }))
                : setNote(e.target.value)
            }
            placeholder="Начни писать..."
            rows={5}
            className="w-full max-w-md mx-auto rounded-3xl bg-emerald text-cream placeholder-cream/30 p-5 text-[15px] leading-relaxed outline-none border border-cream/10 focus:border-gold/40 resize-none font-body"
          />
          {error && (
            <p className="text-[13px] text-cream/60 text-center mt-4">
              Не получилось сохранить — проверь связь и попробуй ещё раз
            </p>
          )}
          <div className="flex flex-col items-center gap-3 mt-8 pb-10">
            {prompt && !isLastNote ? (
              <button
                onClick={() => { platform.haptic('light'); setStep(step + 1) }}
                className="cta-pill text-[16px] px-12 py-4"
              >
                Дальше
              </button>
            ) : (
              <button
                onClick={submit}
                disabled={saving}
                className="cta-pill text-[16px] px-12 py-4 disabled:opacity-50"
              >
                {saving ? 'Сохраняю...' : 'Завершить'}
              </button>
            )}
            {!saving && (
              <button
                onClick={() => {
                  platform.haptic('light')
                  prompt && !isLastNote ? setStep(step + 1) : submit()
                }}
                className="text-[13px] font-semibold text-cream/40 bg-transparent border-0"
              >
                Пропустить
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
