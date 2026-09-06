import { useMemo, useState } from 'react'

import BackButton from '../components/BackButton'
import PracticeWritingCanvas from '../components/PracticeWritingCanvas'
import { api } from '../lib/api'
import { useSynced } from '../lib/store'
import { platform } from '../platform'
import { findLilaCard, LILA_DISCOVER_CARDS } from '../data/lilaDiscoverCards'

export const LILA_TOPIC_PROFILE_KEY = 'mx-lila-topic-profile-v1'

function Shell({ children, onBack, title = 'Лила' }) {
  return (
    <div className="mx-screen-shell mx-auto w-full max-w-md px-5 pb-10">
      <div className="mb-8 grid min-h-[42px] grid-cols-[1fr_auto_1fr] items-center">
        <BackButton onClick={onBack} />
        <span className="font-display text-[18px] text-cream">{title}</span>
        <span aria-hidden="true" />
      </div>
      {children}
    </div>
  )
}

function ChoiceButton({ active, children, onClick }) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={`min-h-12 w-full rounded-2xl px-4 py-3 text-left text-[13px] transition-colors ${
        active ? 'bg-gold text-emerald-deep' : 'bg-emerald text-muted active:bg-emerald-light'
      }`}
    >
      {children}
    </button>
  )
}

function Intro({ onPick, onBack }) {
  return (
    <Shell onBack={onBack}>
      <p className="mx-section-label">DISCOVER</p>
      <h1 className="mt-3 font-display text-[29px] font-semibold leading-[1.05] tracking-[-0.03em] text-cream">
        Когда неясно, с чего начать
      </h1>
      <p className="mt-4 text-[14px] leading-relaxed text-muted">
        Выбери карту, ответь на несколько коротких вопросов и проверь одну гипотезу. Это не тест и
        не диагноз.
      </p>
      <div className="mt-8 grid gap-3">
        {LILA_DISCOVER_CARDS.map(card => (
          <button
            key={card.id}
            type="button"
            onClick={() => onPick(card.id)}
            className="rounded-3xl border border-cream/[0.1] bg-emerald/70 p-5 text-left active:bg-emerald-light"
          >
            <span className="block font-display text-[18px] font-semibold text-cream">
              {card.title}
            </span>
            <span className="mt-2 block text-[13px] leading-relaxed text-muted">
              {card.dilemma}
            </span>
          </button>
        ))}
      </div>
    </Shell>
  )
}

export default function LilaDiscoverFlow({ userId, onBack, onOpenJournal }) {
  const [stage, setStage] = useState('intro')
  const [cardId, setCardId] = useState(null)
  const [questionIndex, setQuestionIndex] = useState(0)
  const [answers, setAnswers] = useState([])
  const [hypothesis, setHypothesis] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [topicProfile, setTopicProfile] = useSynced(LILA_TOPIC_PROFILE_KEY, {})
  const card = useMemo(() => findLilaCard(cardId), [cardId])

  function pickCard(nextCardId) {
    setCardId(nextCardId)
    setQuestionIndex(0)
    setAnswers([])
    setError('')
    setStage('questions')
    platform.haptic('light')
  }

  async function finishQuestions() {
    if (
      !card ||
      answers.length !== card.questions.length ||
      answers.some(answer => !answer?.trim())
    )
      return
    setSaving(true)
    setError('')
    try {
      const prompt = [
        'Ты помогаешь пользователю сформулировать мягкую рабочую гипотезу без диагноза и категоричных выводов.',
        `Тема: ${card.topic}.`,
        `Вопросы и ответы: ${card.questions.map((question, index) => `${question} — ${answers[index]}`).join('; ')}`,
        'Ответь кратко: одна гипотеза, один обратимый шаг на сегодня и один сигнал, по которому пользователь поймёт, помогло ли это.',
      ].join(' ')
      const reply = await api.mentalix.send(userId, prompt, 'mayak')
      setHypothesis(
        reply?.content || 'Попробуй один маленький обратимый шаг и посмотри, что изменится.'
      )
      setStage('confirm')
      platform.haptic('success')
    } catch (nextError) {
      console.error(nextError)
      setError('Не удалось получить гипотезу. Проверь соединение и попробуй ещё раз.')
    } finally {
      setSaving(false)
    }
  }

  function confirm(confidence) {
    if (!card) return
    setTopicProfile({
      ...topicProfile,
      [card.topic]: { confidence, updatedAt: new Date().toISOString() },
    })
    setStage('complete')
    platform.haptic('success')
  }

  if (stage === 'intro') return <Intro onPick={pickCard} onBack={onBack} />

  if (stage === 'questions' && card) {
    const question = card.questions[questionIndex]
    return (
      <Shell onBack={onBack}>
        <PracticeWritingCanvas
          question={question}
          description="Ответь одним-двумя предложениями."
          value={answers[questionIndex] || ''}
          onChange={value => {
            const next = [...answers]
            next[questionIndex] = value
            setAnswers(next)
          }}
          placeholder="Напиши здесь…"
          ariaLabel={question}
          autoFocus
          submitLabel={questionIndex === card.questions.length - 1 ? 'Показать гипотезу' : 'Дальше'}
          submitDisabled={saving}
          onSubmit={() => {
            if (questionIndex < card.questions.length - 1) setQuestionIndex(index => index + 1)
            else void finishQuestions()
          }}
        />
        {error && (
          <p className="mt-4 text-[13px] text-red-200" role="alert">
            {error}
          </p>
        )}
      </Shell>
    )
  }

  if (stage === 'confirm') {
    return (
      <Shell onBack={onBack}>
        <p className="mx-section-label">Рабочая гипотеза</p>
        <h1 className="mt-3 font-display text-[25px] font-semibold leading-tight text-cream">
          Проверь её в реальности
        </h1>
        <div className="mt-6 rounded-3xl border border-gold/25 bg-gold/[0.07] p-5 text-[14px] leading-relaxed text-cream">
          {hypothesis}
        </div>
        <p className="mt-6 text-[13px] leading-relaxed text-muted">
          Насколько это похоже на твою ситуацию?
        </p>
        <div className="mt-4 grid gap-2">
          <ChoiceButton onClick={() => confirm('yes')}>Да, похоже</ChoiceButton>
          <ChoiceButton onClick={() => confirm('partial')}>Частично</ChoiceButton>
          <ChoiceButton onClick={() => confirm('no')}>Нет, не похоже</ChoiceButton>
        </div>
      </Shell>
    )
  }

  return (
    <Shell onBack={onBack}>
      <p className="mx-section-label">Следующий шаг</p>
      <h1 className="mt-3 font-display text-[25px] font-semibold leading-tight text-cream">
        Гипотеза сохранена
      </h1>
      <p className="mt-4 text-[14px] leading-relaxed text-muted">
        Тема добавлена в локальный профиль. Теперь преврати её в маленький эксперимент в
        существующем журнале.
      </p>
      <button
        type="button"
        onClick={onOpenJournal}
        className="cta-pill mt-8 w-full px-6 py-4 text-[15px]"
      >
        Открыть журнал
      </button>
      <button
        type="button"
        onClick={onBack}
        className="mx-auto mt-3 block min-h-11 px-3 text-[13px] font-semibold text-muted active:text-gold"
      >
        Вернуться к практикам
      </button>
    </Shell>
  )
}
