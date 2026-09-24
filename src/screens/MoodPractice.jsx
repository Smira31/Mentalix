import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { ArrowRight } from 'lucide-react'

import { platform } from '../platform'
import { api } from '../lib/api'
import BackButton from '../components/BackButton'
import {
  useFullscreenSurface,
  FULLSCREEN_SHELL_CLASS,
  FULLSCREEN_HEADER_SLOT_CLASS,
  FULLSCREEN_SCROLL_CLASS,
} from '../lib/fullscreenSurface'
import { getFullscreenPortalTarget } from '../lib/fullscreenSurface'
import {
  Face,
  SCALE_STEPS,
  EMOTIONS,
  CheckInQuestion,
  CheckInScaleQuestion,
  CheckInNextControls,
  CheckInCompletionArt,
} from './CheckIn'
import './CheckInDemo.css'

const INTRO_SEEN_KEY = 'mx-mood-practice-intro-seen'

const MOOD_SCALE = SCALE_STEPS[0]

const CONTEXT_OPTIONS = [
  { label: 'работа', value: 'work' },
  { label: 'дом', value: 'home' },
  { label: 'отношения', value: 'relationships' },
  { label: 'здоровье', value: 'health' },
  { label: 'учёба', value: 'study' },
  { label: 'другое', value: 'other' },
]

const INTRO_PARAGRAPHS = [
  'Иногда достаточно остановиться и назвать то, что чувствуешь.',
  'Это короткая практика — заметить настроение и эмоцию.',
  'Можно добавить пару слов и подышать, если захочешь.',
]

const STEP_INTRO = 0
const STEP_MOOD = 1
const STEP_EMOTION = 2
const STEP_CONTEXT = 3
const STEP_BREATHING = 4
const STEP_DONE = 5

function hasIntroBeenSeen() {
  try {
    return localStorage.getItem(INTRO_SEEN_KEY) === '1'
  } catch {
    return false
  }
}

function markIntroSeen() {
  try {
    localStorage.setItem(INTRO_SEEN_KEY, '1')
  } catch {
    // приватный режим — не повод падать
  }
}

export default function MoodPractice({ user, onDone }) {
  const [step, setStep] = useState(() => (hasIntroBeenSeen() ? STEP_MOOD : STEP_INTRO))
  const [mood, setMood] = useState(null)
  const [emotion, setEmotion] = useState(null)
  const [context, setContext] = useState(null)
  const [note, setNote] = useState('')
  const [breathingCompleted, setBreathingCompleted] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const { style: surfaceStyle } = useFullscreenSurface()

  useEffect(() => {
    api.events.log(user.id, 'mood_practice_start', 'mood_practice').catch(() => {})
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function handleBack() {
    platform.haptic('light')

    if (step === STEP_INTRO || step === STEP_MOOD) {
      onDone()
      return
    }

    setStep(current => current - 1)
  }

  async function save(withBreathing) {
    setSaving(true)
    setError('')

    try {
      await api.moodPractices.create({
        mood,
        emotion,
        context,
        note: note.trim() || null,
        breathing_completed: withBreathing,
      })

      platform.haptic('success')
      setBreathingCompleted(withBreathing)
      setStep(STEP_DONE)
    } catch (saveError) {
      console.error(saveError)
      setError('Не удалось сохранить. Попробуй ещё раз.')
    } finally {
      setSaving(false)
    }
  }

  // ── Вступление ──

  if (step === STEP_INTRO) {
    return createPortal(
      <div className={FULLSCREEN_SHELL_CLASS} style={surfaceStyle}>
        <div
          className={`${FULLSCREEN_HEADER_SLOT_CLASS} flex items-center px-[var(--mx-screen-x)]`}
        >
          <BackButton onClick={handleBack} />
        </div>

        <div className={FULLSCREEN_SCROLL_CLASS}>
          <div className="w-full max-w-md mx-auto px-[var(--mx-screen-x)] flex flex-col min-h-full">
            <div className="flex-1 flex flex-col justify-center">
              <h1 className="font-display mx-type-page text-cream lowercase text-center mb-10">
                настроение.
              </h1>
              <div className="px-7 space-y-2">
                {INTRO_PARAGRAPHS.map(text => (
                  <p key={text} className="text-[15px] font-normal leading-[1.45] text-cream">
                    {text}
                  </p>
                ))}
              </div>
            </div>

            <div className="pb-10 flex justify-center" style={{ paddingBottom: 'calc(var(--app-safe-bottom) + 40px)' }}>
              <button
                type="button"
                data-testid="mood-practice-start"
                onClick={() => {
                  platform.haptic('light')
                  markIntroSeen()
                  setStep(STEP_MOOD)
                }}
                className="min-h-10 rounded-full bg-cream px-6 text-[15px] font-semibold text-emerald-deep"
                style={{ width: '82px', height: '40px' }}
              >
                Начать
              </button>
            </div>
          </div>
        </div>
      </div>,
      getFullscreenPortalTarget()
    )
  }

  // ── Завершение ──

  if (step === STEP_DONE) {
    return createPortal(
      <div className={FULLSCREEN_SHELL_CLASS} style={surfaceStyle}>
        <div
          className={`${FULLSCREEN_HEADER_SLOT_CLASS} flex items-center px-[var(--mx-screen-x)]`}
        >
          <BackButton onClick={onDone} />
        </div>

        <div className={FULLSCREEN_SCROLL_CLASS}>
          <div className="w-full max-w-md mx-auto px-[var(--mx-screen-x)] flex flex-1 flex-col items-center justify-center text-center">
            <CheckInCompletionArt />
            <h2 className="mt-8 font-display text-[28px] leading-[1.2] text-cream">
              Настроение
              <strong className="block font-bold">отмечено.</strong>
            </h2>
            <button
              type="button"
              data-testid="mood-practice-done"
              onClick={onDone}
              className="mt-10 min-h-14 w-full max-w-sm rounded-full bg-cream px-6 text-[18px] font-bold text-emerald-deep"
              style={{ maxWidth: 'calc(100% - 56px)' }}
            >
              Готово
            </button>
          </div>
        </div>
      </div>,
      getFullscreenPortalTarget()
    )
  }

  // ── Общий каркас для шагов шкалы/эмоций/контекста/дыхания ──

  const moodLevel = mood || 3
  const emotionOptions = EMOTIONS[moodLevel] || EMOTIONS[3]

  return createPortal(
    <div className={FULLSCREEN_SHELL_CLASS} style={surfaceStyle}>
      <div
        className={`${FULLSCREEN_HEADER_SLOT_CLASS} flex items-center px-[var(--mx-screen-x)]`}
      >
        <BackButton onClick={handleBack} />
      </div>

      <div className={FULLSCREEN_SCROLL_CLASS}>
        <div
          key={step}
          className="w-full max-w-md mx-auto px-[var(--mx-screen-x)] flex flex-1 flex-col items-center justify-center animate-fade-in"
        >
          {/* ── Шаг: Лица (шкала настроения) ── */}
          {step === STEP_MOOD && (
            <div className="w-full flex flex-col items-center">
              <CheckInScaleQuestion
                scale={MOOD_SCALE}
                value={mood}
                onPick={level => {
                  platform.haptic('light')
                  setMood(level)
                }}
              />
              <div className="mt-6 flex items-center gap-3">
                <span className="text-[14px] font-medium text-muted">Дата:</span>
                <span
                  className="flex items-center gap-1.5 rounded-full px-4 py-1.5 text-[16px] font-medium text-cream"
                  style={{ background: 'rgb(var(--c-card2))', height: '34px' }}
                  data-testid="mood-practice-date"
                >
                  Сейчас
                </span>
              </div>
            </div>
          )}

          {/* ── Шаг: Эмоции ── */}
          {step === STEP_EMOTION && (
            <div className="w-full flex flex-col items-center">
              <CheckInQuestion
                title="Что ближе всего к тому, что ты чувствуешь?"
                headingAs="h2"
                headingClassName="font-display text-cream text-[22px] font-semibold leading-[1.3]"
              />
              <div className="mt-8 flex flex-col items-center gap-1.5 w-full">
                {emotionOptions.map(item => {
                  const active = emotion === item
                  return (
                    <button
                      key={item}
                      type="button"
                      data-testid="mood-practice-emotion"
                      data-emotion={item}
                      onClick={() => {
                        platform.haptic('light')
                        setEmotion(active ? null : item)
                      }}
                      className={`rounded-full px-5 text-[15px] font-medium transition-colors ${
                        active
                          ? 'bg-cream text-emerald-deep'
                          : 'bg-emerald text-cream'
                      }`}
                      style={{ height: '38px' }}
                    >
                      {item.charAt(0).toUpperCase() + item.slice(1)}
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* ── Шаг: Контекст + заметка ── */}
          {step === STEP_CONTEXT && (
            <div className="w-full flex flex-col">
              <CheckInQuestion
                title="Что происходит?"
                hint="Пара слов — уже разговор с собой."
                headingAs="h2"
                className="w-full text-left"
                headingClassName="font-display text-cream text-[22px] font-bold leading-[1.2]"
                hintClassName="mt-1.5 text-[15px] text-muted"
              />
              <textarea
                value={note}
                onChange={e => setNote(e.target.value.slice(0, 2000))}
                placeholder="Начни писать…"
                aria-label="Что происходит"
                data-testid="mood-practice-note"
                maxLength={2000}
                className="mt-6 w-full rounded-2xl bg-emerald p-4 text-[16px] leading-[1.4] text-cream placeholder:text-muted resize-none border-0 outline-none"
                style={{ minHeight: '120px' }}
              />
              <p className="mt-3 text-[11px] font-medium text-muted">Контекст (необязательно)</p>
              <div className="mt-2 grid grid-cols-3 gap-2">
                {CONTEXT_OPTIONS.map(opt => {
                  const active = context === opt.value
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      data-testid="mood-practice-context"
                      data-context={opt.value}
                      onClick={() => {
                        platform.haptic('light')
                        setContext(active ? null : opt.value)
                      }}
                      className={`rounded-2xl py-3 text-[14px] font-medium transition-colors ${
                        active
                          ? 'bg-cream text-emerald-deep'
                          : 'bg-emerald text-cream'
                      }`}
                    >
                      {opt.label}
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* ── Шаг: Предложение подышать ── */}
          {step === STEP_BREATHING && (
            <div className="w-full flex flex-col items-center text-center" style={{ paddingTop: '15vh' }}>
              <p className="text-[22px] leading-[1.3] text-cream">
                <strong className="font-bold">Ты остановился и заметил, что чувствуешь.</strong>
                <br />
                Попробуешь короткое дыхание?
              </p>
              {error && (
                <p role="alert" className="mt-6 text-[14px] text-red-300">
                  {error}
                </p>
              )}
              <div
                className="mt-10 flex gap-2 w-full"
                style={{ maxWidth: 'calc(100% - 56px)' }}
              >
                <button
                  type="button"
                  data-testid="mood-practice-breathe"
                  onClick={() => save(true)}
                  disabled={saving}
                  className="flex-1 rounded-full text-[17px] font-medium disabled:opacity-50"
                  style={{
                    height: '53px',
                    background: 'rgb(var(--c-line))',
                    color: 'rgb(var(--c-bg))',
                    borderRadius: '999px',
                  }}
                >
                  {saving ? 'Сохраняю…' : 'Подышать минуту'}
                </button>
                <button
                  type="button"
                  data-testid="mood-practice-skip-breathing"
                  onClick={() => save(false)}
                  disabled={saving}
                  className="flex-1 rounded-full text-[17px] font-medium text-cream disabled:opacity-50"
                  style={{
                    height: '53px',
                    background: 'rgb(var(--c-card2))',
                    borderRadius: '999px',
                  }}
                >
                  {saving ? 'Сохраняю…' : 'Не сейчас'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Кнопка «Далее» для шагов шкалы, эмоций и контекста ── */}
      {step === STEP_MOOD && (
        <CheckInNextControls
          onNext={() => setStep(STEP_EMOTION)}
          disabled={!mood}
        />
      )}
      {step === STEP_EMOTION && (
        <CheckInNextControls
          onNext={() => setStep(STEP_CONTEXT)}
          disabled={!emotion}
        />
      )}
      {step === STEP_CONTEXT && (
        <CheckInNextControls
          onNext={() => setStep(STEP_BREATHING)}
          disabled={false}
        />
      )}
    </div>,
    getFullscreenPortalTarget()
  )
}
