import { useMemo, useState } from 'react'

import BackButton from '../components/BackButton'
import PracticeWritingCanvas from '../components/PracticeWritingCanvas'
import { platform } from '../platform'
import { findLilaCard, LILA_DISCOVER_CARDS } from '../data/lilaDiscoverCards'
import { useSynced } from '../lib/store'
import { ConversationChat } from './Mentalix'
import './LilaDiscoverFlow.css'

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
    <div className="mx-lila-stage mx-screen-shell mx-auto flex h-full min-h-0 w-full max-w-md flex-col px-5">
      <div className="mx-lila-header grid h-[52px] shrink-0 grid-cols-[1fr_auto_1fr] items-center">
        <BackButton onClick={onBack} className="justify-self-start" />
        <span className="mx-type-section text-cream">{title}</span>
        <span aria-hidden="true" />
      </div>
      <div className="mx-lila-stage-content flex min-h-0 flex-1 flex-col pt-3">{children}</div>
    </div>
  )
}

function Intro({ onStart, onBack }) {
  return (
    <StageShell title="Лила" onBack={onBack}>
      <div className="flex flex-1 flex-col">
        <p className="mx-section-label">ПРАКТИКА · ЛИЛА</p>
        <h1 className="mx-type-flow-title mt-2 text-cream">Когда неясно, с чего начать</h1>
        <p className="mx-type-flow-body mt-3 max-w-[34ch] text-muted">
          Сначала опиши ситуацию своими словами. Затем выбери одну тему, чтобы начать разговор с
          Лилой. Это не тест и не диагноз.
        </p>
        <div className="mx-lila-action-zone mt-auto pt-6">
          <button
            type="button"
            onClick={onStart}
            className="cta-pill mx-type-flow-action w-full px-6 py-4"
          >
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
        <h1 className="mx-type-flow-title mt-2 text-cream">На что посмотрим внимательнее?</h1>
        <div className="mx-lila-query-preview mx-type-flow-body mt-3 text-muted">{query}</div>
        <div className="mt-4 grid gap-2" role="group" aria-label="Темы Лилы">
          {LILA_DISCOVER_CARDS.map(card => (
            <ChoiceButton
              key={card.id}
              active={selectedCardId === card.id}
              onClick={() => onPick(card.id)}
            >
              <span className="mx-type-card block text-cream">{card.title}</span>
              <span className="mx-type-list-body mt-1 block text-muted">{card.dilemma}</span>
            </ChoiceButton>
          ))}
        </div>
        <p className="mx-type-meta mt-auto pt-4 text-faint">
          Тема — только символический ориентир для разговора, не диагноз и не готовый ответ.
        </p>
      </div>
    </StageShell>
  )
}

function ContextSlot({ card, query }) {
  return (
    <div className="mx-lila-context mx-auto mb-3 w-full max-w-md">
      <div className="mx-ai-meta text-gold">Тема разговора · {card.title}</div>
      <div className="mx-ai-caption mt-1 line-clamp-1 text-muted">{query}</div>
    </div>
  )
}

function Completion({ onOpenJournal, onBack }) {
  return (
    <StageShell title="Готово" onBack={onBack}>
      <div className="flex flex-1 flex-col">
        <p className="mx-section-label">ПРАКТИКА · ЗАВЕРШЕНО</p>
        <h1 className="mx-type-flow-title mt-2 text-cream">Разговор можно продолжить позже</h1>
        <p className="mx-type-flow-body mt-3 text-muted">
          Разговор завершён. Открой журнал отдельно или вернись к списку практик.
        </p>
        <div className="mx-lila-action-zone mt-auto pt-6">
          <button
            type="button"
            onClick={onOpenJournal}
            className="cta-pill mx-type-flow-action w-full px-6 py-4"
          >
            Открыть журнал
          </button>
          <button
            type="button"
            onClick={onBack}
            className="mx-type-flow-action mx-auto mt-2 block min-h-11 px-3 text-muted active:text-gold"
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
      setStage('theme')
    } else {
      onBack()
    }
    platform.haptic('light')
  }

  if (stage === 'intro') return <Intro onStart={startQuery} onBack={onBack} />

  if (stage === 'query') {
    return (
      <StageShell title="Лила" onBack={goBack}>
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
          className="mx-lila-query-canvas min-h-0 flex-1"
        />
      </StageShell>
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
    return (
      <ConversationChat
        user={{ id: userId }}
        persona="lila"
        conversationMeta={LILA_CONVERSATION_META}
        initialPrompt={null}
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
