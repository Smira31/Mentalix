import { useMemo, useState } from 'react'

import PracticeWritingCanvas from '../components/PracticeWritingCanvas'
import { platform } from '../platform'
import { findLilaCard, LILA_DISCOVER_CARDS } from '../data/lilaDiscoverCards'
import { useSynced } from '../lib/store'
import { ConversationChat } from './Mentalix'

export const LILA_TOPIC_PROFILE_KEY = 'mx-lila-topic-profile-v1'

export const LILA_CONVERSATION_META = {
  key: 'lila',
  name: 'Лила',
  tagline: 'поможет увидеть следующий шаг',
  desc: 'Спокойный проводник для свободного разбора ситуации и проверки одной рабочей гипотезы.',
  asking: 'Лила спрашивает',
  typing: 'собирает следующий вопрос…',
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

function StageShell({ children, title, onBack }) {
  return (
    <div className="mx-screen-shell mx-auto flex min-h-[100dvh] w-full max-w-md flex-col px-5 pb-[max(40px,var(--app-safe-bottom,env(safe-area-inset-bottom,0px)))] pt-[max(18px,var(--app-safe-top,env(safe-area-inset-top,0px)))]">
      <div className="mb-8 grid min-h-[42px] shrink-0 grid-cols-[1fr_auto_1fr] items-center">
        <button
          type="button"
          onClick={onBack}
          aria-label="Назад"
          className="min-h-11 justify-self-start px-2 text-[13px] font-semibold text-muted active:text-gold"
        >
          Назад
        </button>
        <span className="font-display text-[18px] text-cream">{title}</span>
        <span aria-hidden="true" />
      </div>
      {children}
    </div>
  )
}

function Intro({ onStart, onBack }) {
  return (
    <StageShell title="Лила" onBack={onBack}>
      <div className="flex flex-1 flex-col">
        <p className="mx-section-label">ПРАКТИКА · ЛИЛА</p>
        <h1 className="mt-3 font-display text-[29px] font-semibold leading-[1.05] tracking-[-0.03em] text-cream">
          Когда неясно, с чего начать
        </h1>
        <p className="mt-4 max-w-[34ch] text-[14px] leading-relaxed text-muted">
          Сначала опиши ситуацию своими словами. Затем выбери одну тему, чтобы начать разговор с
          Лилой. Это не тест и не диагноз.
        </p>
        <div className="mt-auto pt-10">
          <button type="button" onClick={onStart} className="cta-pill w-full px-6 py-4 text-[15px]">
            Описать ситуацию
          </button>
        </div>
      </div>
    </StageShell>
  )
}

function ThemePicker({ query, selectedCardId, onPick, onBack }) {
  return (
    <StageShell title="Тема" onBack={onBack}>
      <div className="flex flex-1 flex-col">
        <h1 className="mt-3 font-display text-[27px] font-semibold leading-tight text-cream">
          На что посмотрим внимательнее?
        </h1>
        <div className="mt-5 rounded-2xl bg-cream/[0.06] px-4 py-3 text-[13px] leading-relaxed text-muted">
          {query}
        </div>
        <div className="mt-6 grid gap-3" role="group" aria-label="Темы Лилы">
          {LILA_DISCOVER_CARDS.map(card => (
            <ChoiceButton
              key={card.id}
              active={selectedCardId === card.id}
              onClick={() => onPick(card.id)}
            >
              <span className="block font-display text-[17px] text-cream">{card.title}</span>
              <span className="mt-1 block leading-relaxed text-muted">{card.dilemma}</span>
            </ChoiceButton>
          ))}
        </div>
        <p className="mt-auto pt-8 text-[12px] leading-relaxed text-faint">
          Тема — только символический ориентир для разговора, не диагноз и не готовый ответ.
        </p>
      </div>
    </StageShell>
  )
}

function ContextSlot({ card, query }) {
  return (
    <div className="mx-auto mb-5 w-full max-w-md rounded-2xl border border-gold/20 bg-gold/[0.06] px-4 py-3">
      <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-gold">
        Тема разговора · {card.title}
      </div>
      <div className="mt-1 line-clamp-3 text-[12px] leading-relaxed text-muted">{query}</div>
    </div>
  )
}

function Completion({ onOpenJournal, onBack }) {
  return (
    <StageShell title="Готово" onBack={onBack}>
      <div className="flex flex-1 flex-col">
        <p className="mx-section-label">ПРАКТИКА · ЗАВЕРШЕНО</p>
        <h1 className="mt-3 font-display text-[27px] font-semibold leading-tight text-cream">
          Разговор можно продолжить позже
        </h1>
        <p className="mt-4 text-[14px] leading-relaxed text-muted">
          Разговор завершён. Открой журнал отдельно или вернись к списку практик.
        </p>
        <div className="mt-auto pt-10">
          <button
            type="button"
            onClick={onOpenJournal}
            className="cta-pill w-full px-6 py-4 text-[15px]"
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
        </div>
      </div>
    </StageShell>
  )
}

export default function LilaDiscoverFlow({ userId, onBack, onOpenJournal }) {
  const [stage, setStage] = useState('intro')
  const [query, setQuery] = useState('')
  const [cardId, setCardId] = useState(null)
  const [selectedCardId, setSelectedCardId] = useState(null)
  const [dialogStarted, setDialogStarted] = useState(false)
  const [topicProfile, setTopicProfile] = useSynced(LILA_TOPIC_PROFILE_KEY, {})
  const card = useMemo(() => findLilaCard(cardId), [cardId])

  function startQuery() {
    setStage('query')
    platform.haptic('light')
  }

  function continueToTheme() {
    const trimmed = query.trim()
    if (!trimmed) return
    setQuery(trimmed)
    setStage('theme')
    platform.haptic('light')
  }

  function selectTheme(nextCardId) {
    setCardId(nextCardId)
    setSelectedCardId(nextCardId)
    setStage('dialog')
    platform.haptic('success')
  }

  function finishDialog() {
    if (!card) return
    setTopicProfile({
      ...topicProfile,
      [card.topic]: { confidence: 'dialogue-complete', updatedAt: new Date().toISOString() },
    })
    setStage('completion')
    platform.haptic('success')
  }

  function goBack() {
    if (stage === 'query') {
      setStage('intro')
    } else if (stage === 'theme') {
      setStage('query')
    } else if (stage === 'dialog') {
      setDialogStarted(true)
      setStage('theme')
    } else {
      onBack()
    }
    platform.haptic('light')
  }

  if (stage === 'intro') return <Intro onStart={startQuery} onBack={onBack} />

  if (stage === 'query') {
    return (
      <div className="mx-screen-shell mx-auto flex min-h-[100dvh] w-full max-w-md flex-col pb-[max(40px,var(--app-safe-bottom,env(safe-area-inset-bottom,0px)))] pt-[max(18px,var(--app-safe-top,env(safe-area-inset-top,0px)))]">
        <div className="shrink-0 px-5">
          <button
            type="button"
            onClick={goBack}
            className="min-h-11 px-2 text-[13px] font-semibold text-muted active:text-gold"
          >
            Назад
          </button>
        </div>
        <PracticeWritingCanvas
          question="Что сейчас хочешь разобрать?"
          description="Опиши ситуацию своими словами. Достаточно нескольких предложений — без правильной формулировки."
          value={query}
          onChange={setQuery}
          placeholder="Например: я откладываю разговор и не понимаю, как начать…"
          ariaLabel="Опиши ситуацию для разговора с Лилой"
          autoFocus
          submitLabel="Выбрать тему"
          submitDisabled={!query.trim()}
          onSubmit={continueToTheme}
          className="min-h-0 flex-1"
        />
      </div>
    )
  }

  if (stage === 'theme') {
    return (
      <ThemePicker
        query={query}
        selectedCardId={selectedCardId}
        onPick={selectTheme}
        onBack={goBack}
      />
    )
  }

  if (stage === 'dialog' && card) {
    const internalPrompt = [
      'Начни бережный многотуровый разговор с пользователем.',
      `Исходный запрос пользователя: ${query}`,
      `Выбранная тема: ${card.topic}.`,
      `Символический контекст карты: ${card.title} — ${card.dilemma}`,
      'Ответь первым коротким сообщением: отрази запрос, задай один открытый вопрос и не ставь диагнозов.',
    ].join(' ')

    return (
      <ConversationChat
        user={{ id: userId }}
        persona="lila"
        conversationMeta={LILA_CONVERSATION_META}
        initialPrompt={dialogStarted ? null : internalPrompt}
        initialDisplayText={query}
        hideHistory
        contextSlot={<ContextSlot card={card} query={query} />}
        footerSlot={
          <div className="shrink-0 px-4 pb-2 pt-2">
            <button
              type="button"
              onClick={finishDialog}
              className="mx-auto block min-h-10 px-4 text-[12px] font-semibold text-muted active:text-gold"
            >
              Завершить разговор
            </button>
          </div>
        }
        onBack={goBack}
      />
    )
  }

  return <Completion onOpenJournal={onOpenJournal} onBack={onBack} />
}
