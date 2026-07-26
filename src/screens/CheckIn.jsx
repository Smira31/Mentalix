import { useState } from 'react'
import { platform } from '../platform'
import { api } from '../lib/api'
import { X, ChevronLeft } from 'lucide-react'
import { ArtDoor } from '../components/Art'

// ── Чек-ин и вечерний «Анализ дня» ──
// Утром: четыре шкалы + короткая мысль.
// Вечером: шкалы (если ещё не отмечался) + две карточки —
// «Уроки дня» и «Чем горжусь».

function Face({ level, active, size = 56 }) {
  const mouths = [
    'M18 40 Q28 32 38 40',
    'M18 38 Q28 35 38 38',
    'M18 38 H38',
    'M18 36 Q28 42 38 36',
    'M16 34 Q28 46 40 34',
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
  { key: 'mood', title: 'Как ты сейчас?', hint: 'Честный ответ важнее красивого',
    labels: ['Тяжко', 'Так себе', 'Нормально', 'Хорошо', 'Отлично'], faces: true },
  { key: 'energy', title: 'Сколько в тебе энергии?', hint: 'Прислушайся к телу',
    labels: ['На нуле', 'Мало', 'Средне', 'Много', 'Через край'] },
  { key: 'anxiety', title: 'Сколько шума в голове?', hint: 'Тревога — это просто данные',
    labels: ['Тихо', 'Слегка', 'Заметно', 'Сильно', 'Штормит'] },
  { key: 'focus', title: 'Насколько ты собран?', hint: 'Где сейчас твоё внимание',
    labels: ['Рассеян', 'Плыву', 'Держусь', 'Собран', 'Кристально'] },
]

// карточка 1 — уроки и выводы
const LESSON_FIELDS = [
  { key: 'done', label: 'Что получилось?', placeholder: 'Даже маленькое считается' },
  { key: 'hard', label: 'Что было трудно?', placeholder: 'Трудность — тоже часть пути' },
  { key: 'lesson', label: 'Какой вывод забираешь?', placeholder: 'Одна мысль, которую стоит запомнить' },
]

const PROUD_HINTS = [
  'Что сделал, хотя не хотелось?',
  'Где повёл себя так, как хочешь вести всегда?',
  'Что заметил в себе хорошего?',
]

export default function CheckIn({ user, onDone, mode = 'auto', existing = null }) {
  const isEvening = mode === 'evening' || (mode === 'auto' && new Date().getHours() >= 18)
  const skipScales = isEvening && !!existing

  const [values, setValues] = useState({
    mood: existing?.mood ?? null,
    energy: existing?.energy ?? null,
    anxiety: existing?.anxiety ?? null,
    focus: existing?.focus ?? null,
  })
  const [lessons, setLessons] = useState({})
  const [proud, setProud] = useState(['', '', ''])
  const [note, setNote] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(false)

  const scaleCount = skipScales ? 0 : SCALE_STEPS.length
  const cardCount = isEvening ? 2 : 1
  const totalSteps = scaleCount + cardCount
  const doneStep = totalSteps

  const [step, setStep] = useState(0)

  function pick(key, level) {
    platform.haptic('light')
    setValues((v) => ({ ...v, [key]: level }))
    setTimeout(() => setStep((s) => s + 1), 280)
  }

  function composeNote() {
    if (!isEvening) return note.trim() || null
    const parts = []
    const l = LESSON_FIELDS.map((f) => (lessons[f.key] || '').trim() && `${f.label} ${lessons[f.key].trim()}`).filter(Boolean)
    if (l.length) parts.push('Уроки дня\n' + l.join('\n'))
    const p = proud.map((t) => t.trim()).filter(Boolean)
    if (p.length) parts.push('Горжусь\n' + p.map((t, i) => `${i + 1}. ${t}`).join('\n'))
    return parts.join('\n\n') || null
  }

  async function submit() {
    setSaving(true)
    setError(false)
    try {
      await api.checkin.save(user.id, {
        mood: values.mood ?? 3,
        energy: values.energy ?? 3,
        anxiety: values.anxiety ?? 3,
        focus: values.focus ?? 3,
        note: composeNote(),
      })
      platform.haptic('success')
      setStep(doneStep)
    } catch (e) {
      console.error(e)
      setError(true)
    } finally {
      setSaving(false)
    }
  }

  // ── финал ──
  if (step >= doneStep) {
    return (
      <div className="fixed inset-0 z-[60] bg-emerald-deep flex flex-col items-center justify-center px-8 text-center animate-fade-in"
        style={{ paddingTop: 'var(--tg-top, 0px)' }}>
        {isEvening ? <ArtDoor size={140} className="mb-4" /> : null}
        <div className="animate-celebrate-pop mb-6">
          <Face level={values.mood || 4} active size={isEvening ? 64 : 88} />
        </div>
        <h2 className="font-display text-[26px] text-cream leading-tight">
          {isEvening ? 'День закрыт' : 'Чек-ин записан'}
        </h2>
        <p className="text-[15px] text-cream/50 mt-3 leading-relaxed">
          {isEvening ? 'Ты разобрал день, а не бросил его.' : 'Ты услышал себя — это тоже шаг.'}
        </p>
        <button onClick={() => { platform.haptic('light'); onDone() }} className="cta-pill text-[16px] px-12 py-4 mt-10">
          {isEvening ? 'Ко сну' : 'К дню'}
        </button>
      </div>
    )
  }

  const isCard = step >= scaleCount
  const cardIdx = step - scaleCount
  const scale = SCALE_STEPS[step]

  return (
    <div className="fixed inset-0 z-[60] bg-emerald-deep flex flex-col animate-fade-in overflow-y-auto"
      style={{ paddingTop: 'var(--tg-top, 0px)' }}>
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
            <span key={i} className={`w-1.5 h-1.5 rounded-full ${i <= step ? 'bg-gold' : 'bg-cream/15'}`} />
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

      {/* ── шкалы ── */}
      {!isCard && (
        <div key={step} className="flex-1 flex flex-col items-center justify-center px-6 py-8 animate-fade-in">
          <div className="text-[12px] text-cream/35 font-semibold mb-2 uppercase tracking-wide">
            {isEvening ? 'Анализ дня' : 'Чек-ин'} · {step + 1} из {totalSteps}
          </div>
          <h2 className="font-display text-[26px] text-cream text-center leading-tight">{scale.title}</h2>
          <p className="text-[14px] text-cream/45 mt-2 mb-10">{scale.hint}</p>
          <div className="flex items-end justify-center gap-3 w-full max-w-sm">
            {[1, 2, 3, 4, 5].map((lvl) => {
              const active = values[scale.key] === lvl
              return (
                <button key={lvl} onClick={() => pick(scale.key, lvl)}
                  className="flex flex-col items-center gap-2 border-0 bg-transparent active:scale-90 transition-transform flex-1">
                  {scale.faces ? (
                    <Face level={lvl} active={active} />
                  ) : (
                    <span className={[
                      'w-12 h-12 rounded-full flex items-center justify-center text-[16px] font-bold transition-colors',
                      active ? 'bg-gold text-emerald-deep' : 'bg-emerald text-cream/50',
                    ].join(' ')}>{lvl}</span>
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

      {/* ── карточка 1: уроки дня (вечер) / мысль (день) ── */}
      {isCard && cardIdx === 0 && (
        <div key="c1" className="flex-1 flex flex-col justify-center px-6 py-8 animate-fade-in">
          <div className="text-[12px] text-cream/35 font-semibold mb-2 uppercase tracking-wide text-center">
            {isEvening ? `Анализ дня · ${step + 1} из ${totalSteps}` : `Чек-ин · ${totalSteps} из ${totalSteps}`}
          </div>
          <h2 className="font-display text-[26px] text-cream text-center leading-tight">
            {isEvening ? 'Уроки дня' : 'Что на уме?'}
          </h2>
          <p className="text-[14px] text-cream/45 mt-2 mb-6 text-center">
            {isEvening ? 'Разбери день, пока он ещё свежий. Любое поле можно пропустить.' : 'Пара слов — уже разговор с собой.'}
          </p>

          {isEvening ? (
            <div className="space-y-3 max-w-md mx-auto w-full">
              {LESSON_FIELDS.map((f) => (
                <div key={f.key} className="rounded-[26px] bg-emerald p-4">
                  <div className="text-[13px] font-bold text-cream mb-2">{f.label}</div>
                  <textarea
                    value={lessons[f.key] || ''}
                    onChange={(e) => setLessons((l) => ({ ...l, [f.key]: e.target.value }))}
                    placeholder={f.placeholder}
                    rows={2}
                    className="w-full bg-transparent text-cream placeholder-cream/25 text-[15px] leading-relaxed outline-none resize-none font-body"
                  />
                </div>
              ))}
            </div>
          ) : (
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Начни писать..."
              rows={5}
              className="w-full max-w-md mx-auto rounded-3xl bg-emerald text-cream placeholder-cream/30 p-5 text-[15px] leading-relaxed outline-none border border-cream/10 focus:border-gold/40 resize-none font-body"
            />
          )}

          {error && <p className="text-[13px] text-cream/60 text-center mt-4">Не получилось сохранить — проверь связь</p>}

          <div className="flex flex-col items-center gap-3 mt-7">
            <button
              onClick={() => { platform.haptic('light'); isEvening ? setStep(step + 1) : submit() }}
              disabled={saving}
              className="cta-pill text-[16px] px-12 py-4 disabled:opacity-50"
            >
              {isEvening ? 'Дальше' : saving ? 'Сохраняю...' : 'Завершить'}
            </button>
            {!saving && (
              <button onClick={() => { platform.haptic('light'); isEvening ? setStep(step + 1) : submit() }}
                className="text-[13px] font-semibold text-cream/40 bg-transparent border-0">
                Пропустить
              </button>
            )}
          </div>
        </div>
      )}

      {/* ── карточка 2: чем горжусь ── */}
      {isCard && cardIdx === 1 && (
        <div key="c2" className="flex-1 flex flex-col justify-center px-6 py-8 animate-fade-in">
          <div className="text-[12px] text-cream/35 font-semibold mb-2 uppercase tracking-wide text-center">
            Анализ дня · {totalSteps} из {totalSteps}
          </div>
          <h2 className="font-display text-[26px] text-cream text-center leading-tight">Чем горжусь</h2>
          <p className="text-[14px] text-cream/45 mt-2 mb-6 text-center">
            Три пункта. Мелочи считаются — из них и состоит день.
          </p>

          <div className="space-y-2.5 max-w-md mx-auto w-full">
            {proud.map((v, i) => (
              <div key={i} className="rounded-full bg-emerald px-5 py-3.5 flex items-center gap-3">
                <span className="w-6 h-6 rounded-full bg-gold/15 text-gold text-[12px] font-bold flex items-center justify-center shrink-0">
                  {i + 1}
                </span>
                <input
                  value={v}
                  onChange={(e) => setProud((p) => p.map((x, j) => (j === i ? e.target.value : x)))}
                  placeholder={PROUD_HINTS[i]}
                  className="flex-1 bg-transparent text-cream placeholder-cream/25 text-[15px] outline-none font-body"
                />
              </div>
            ))}
          </div>

          {error && <p className="text-[13px] text-cream/60 text-center mt-4">Не получилось сохранить — проверь связь</p>}

          <div className="flex flex-col items-center gap-3 mt-7">
            <button onClick={submit} disabled={saving} className="cta-pill text-[16px] px-12 py-4 disabled:opacity-50">
              {saving ? 'Сохраняю...' : 'Закрыть день'}
            </button>
            {!saving && (
              <button onClick={submit} className="text-[13px] font-semibold text-cream/40 bg-transparent border-0">
                Пропустить
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
