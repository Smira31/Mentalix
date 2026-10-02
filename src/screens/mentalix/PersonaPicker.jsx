import { useEffect, useRef, useState } from 'react'

import { platform } from '../../platform'
import { api } from '../../lib/api'
import { PERSONAS } from './personas'
import { relativeConversationDate } from './conversationDate'
import { isPreviewDemoMode } from '../../lib/demoMode'

import './PersonaPicker.css'

const DEFAULT_INDEX = 1

// Визуальный порядок entry-карусели: Наставник, Спутник (центр), Наблюдатель, Даймон.
const DISPLAY_PERSONAS = [PERSONAS[1], PERSONAS[0], PERSONAS[2]]

const PERSONA_NAMES = Object.fromEntries(PERSONAS.map(p => [p.key, p.name]))

const PROMISES = {
  mayak: 'Поможет разобраться в том, что чувствуешь.',
  kompas: 'Поможет увидеть новые перспективы и найти решения.',
  dnevnik: 'Поможет исследовать свои мысли и эмоции глубже.',
}

const DIALOG_DESCRIPTIONS = {
  mayak: 'Тёплый и внимательный разговор без оценки, когда нужно выговориться или услышать себя.',
  kompas: 'Строгий и честный. Разложит цель на шаги и не даст себя жалеть.',
  dnevnik: 'Наблюдательный. Подведёт итоги дня и заметит то, что ты пропустил.',
}

// 4-я карточка — Даймон. Не создаёт разговор (POST /conversations),
// открывает существующую игру.
const DAIMON_CARD = {
  key: 'daimon',
  name: 'Даймон',
  promise: 'Игра самопознания: брось кубик и узнай, где ты сейчас.',
  description: 'Внутренний голос. Первые броски бесплатно.',
}

export default function PersonaPicker({
  user,
  onPick,
  onContinueConversation,
  onShowAllConversations,
  onOpenDaimon,
}) {
  const [active, setActive] = useState(DEFAULT_INDEX)
  const [conversations, setConversations] = useState([])
  const [creating, setCreating] = useState(false)
  const trackRef = useRef(null)
  const userId = user?.id

  useEffect(() => {
    const track = trackRef.current
    const card = track?.children[DEFAULT_INDEX]
    if (!track || !card) return undefined
    const frame = requestAnimationFrame(() => {
      track.scrollTo({
        left: card.offsetLeft - (track.clientWidth - card.offsetWidth) / 2,
        behavior: 'auto',
      })
      syncActive()
    })
    return () => cancelAnimationFrame(frame)
  }, [])

  // Загружаем последние разговоры для блока «Продолжить разговор».
  useEffect(() => {
    if (!userId) return
    let cancelled = false
    api.mentalix
      .listConversations(userId, { limit: 4 })
      .then(data => {
        if (!cancelled) setConversations(Array.isArray(data) ? data : [])
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [userId])

  function syncActive() {
    const track = trackRef.current
    if (!track) return
    const center = track.scrollLeft + track.clientWidth / 2
    let closest = 0
    let distance = Infinity
    Array.from(track.children).forEach((card, index) => {
      const cardCenter = card.offsetLeft + card.offsetWidth / 2
      if (Math.abs(cardCenter - center) < distance) {
        closest = index
        distance = Math.abs(cardCenter - center)
      }
    })
    setActive(closest)
  }

  function selectRole(index) {
    const track = trackRef.current
    const card = track?.children[index]
    if (!track || !card) return
    platform.haptic('light')
    track.scrollTo({
      left: card.offsetLeft - (track.clientWidth - card.offsetWidth) / 2,
      behavior: 'smooth',
    })
    setActive(index)
  }

  // «НАЧАТЬ» на карточке: создаём НОВЫЙ разговор, открываем пустой чат.
  // Создание упало — открываем чат без conversation_id (как раньше).
  async function startRole(persona) {
    if (creating) return
    setCreating(true)
    platform.haptic('light')
    try {
      const conv = userId ? await api.mentalix.createConversation(userId, persona.key) : null
      onPick(persona.key, '', conv?.id || null)
    } catch {
      onPick(persona.key, '')
    } finally {
      setCreating(false)
    }
  }

  // Тап по чипсу: создаём НОВЫЙ разговор, текст чипса — в поле ввода, не отправляем.
  async function startWithChip(persona, chipText) {
    if (creating) return
    setCreating(true)
    platform.haptic('light')
    try {
      const conv = userId ? await api.mentalix.createConversation(userId, persona.key) : null
      onPick(persona.key, chipText, conv?.id || null)
    } catch {
      onPick(persona.key, chipText)
    } finally {
      setCreating(false)
    }
  }

  const activePersona = DISPLAY_PERSONAS[active] || DISPLAY_PERSONAS[0]
  const recentConversations = conversations.slice(0, 3)
  const hasMore = conversations.length > 3

  // Полный список карточек для рендера: 3 персоны + Даймон.
  const allCards = [...DISPLAY_PERSONAS, DAIMON_CARD]

  return (
    <main className="mx-dialog-entry" data-testid="dialog-entry">
      <section className="mx-dialog-hero" aria-labelledby="dialog-entry-title">
        <svg
          className="mx-dialog-hero-svg"
          viewBox="0 0 851 505"
          preserveAspectRatio="xMidYMin meet"
          aria-hidden="true"
        >
          <g className="mx-dialog-hero-lines">
            {/* Левый профиль */}
            <path
              d="M160 42 C140 55 122 70 110 85 C99 100 90 115 84 130 C78 145 74 160 71 175 L69 205 C67 220 63 235 56 250 C49 262 41 272 33 282 C28 290 25 298 26 306 C28 314 32 320 38 322 C48 325 56 330 60 342 C64 355 63 365 66 378 C69 390 73 400 77 410 C80 420 82 430 84 442 C87 452 92 460 100 465 C118 470 142 473 163 477 L163 492"
              fill="none"
            />
            <path
              d="M100 100 C180 96 280 100 360 105 C400 108 420 112 424 120 C424 135 422 148 416 158 C360 165 300 172 424 178 C424 195 422 210 418 222 C380 230 340 235 424 240 C424 255 422 270 418 282 C380 288 350 292 424 296 C422 305 418 312 410 316"
              fill="none"
            />
            {/* Правый профиль (зеркало) */}
            <path
              d="M691 42 C711 55 729 70 741 85 C752 100 761 115 767 130 C773 145 777 160 780 175 L782 205 C784 220 788 235 795 250 C802 262 810 272 818 282 C823 290 826 298 825 306 C823 314 819 320 813 322 C803 325 795 330 791 342 C787 355 788 365 785 378 C782 390 778 400 774 410 C771 420 769 430 767 442 C764 452 759 460 751 465 C733 470 709 473 688 477 L688 492"
              fill="none"
            />
            <path
              d="M751 100 C671 96 571 100 491 105 C451 108 431 112 427 120 C427 135 429 148 435 158 C491 165 551 172 427 178 C427 195 429 210 433 222 C471 230 511 235 427 240 C427 255 429 270 433 282 C471 288 501 292 427 296 C429 305 433 312 441 316"
              fill="none"
            />
          </g>
        </svg>
        <div className="mx-dialog-hero__content">
          <p className="mx-dialog-eyebrow font-label">ДИАЛОГ</p>
          <h1 id="dialog-entry-title" className="mx-type-hero">
            О чём хочешь поговорить <strong>прямо сейчас?</strong>
          </h1>
        </div>
      </section>

      <section className="mx-dialog-surface" aria-labelledby="dialog-role-title">
        <div className="mx-dialog-surface__header">
          <h2 id="dialog-role-title" className="mx-type-section">
            <span>Выбери роль</span>
            <strong>для разговора.</strong>
          </h2>
        </div>
        <div
          ref={trackRef}
          className="mx-dialog-carousel"
          data-testid="mentor-persona-track"
          role="region"
          aria-label="Выбор роли для разговора"
          onScroll={syncActive}
        >
          {allCards.map((persona, index) => {
            const isActive = active === index
            const isDaimon = persona.key === 'daimon'
            const promise = PROMISES[persona.key] || persona.promise
            const description = DIALOG_DESCRIPTIONS[persona.key] || persona.description
            return (
              <article
                key={persona.key}
                className={`mx-dialog-card mx-card-surface ${isActive ? 'is-active' : ''}`}
                data-testid="mentor-persona-card"
                aria-label={`${persona.name}: ${promise}`}
                aria-current={isActive ? 'true' : undefined}
                tabIndex={isActive ? 0 : -1}
                onClick={() => selectRole(index)}
                onKeyDown={event => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault()
                    selectRole(index)
                  }
                }}
              >
                <div className="mx-dialog-card__body">
                  <p className="mx-dialog-card__role mx-type-meta font-label">{persona.name}</p>
                  <h3 className="mx-type-persona-title">{persona.name}</h3>
                  <p className="mx-dialog-card__promise">{promise}</p>
                  <p className="mx-dialog-card__description mx-type-persona-body">{description}</p>
                  <button
                    type="button"
                    data-testid={`mentor-start-${persona.key}`}
                    className="mx-dialog-card__start mx-type-control"
                    tabIndex={isActive ? undefined : -1}
                    disabled={creating}
                    onClick={event => {
                      event.stopPropagation()
                      if (isDaimon) {
                        onOpenDaimon?.()
                      } else {
                        void startRole(persona)
                      }
                    }}
                    aria-label={`Начать разговор: ${persona.name}`}
                  >
                    Начать
                  </button>
                </div>
              </article>
            )
          })}
        </div>

        {/* ── «Продолжить разговор» — до 3 последних разговоров ── */}

        {recentConversations.length > 0 && (
          <div className="mx-dialog-continue" data-testid="continue-conversation-block">
            <h3 className="mx-dialog-continue__title">Продолжить разговор</h3>
            <ul className="mx-conversation-list">
              {recentConversations.map(conv => (
                <li key={conv.id}>
                  <button
                    type="button"
                    data-testid="continue-conversation-row"
                    className="mx-conversation-row"
                    onClick={() => onContinueConversation?.(conv)}
                  >
                    <span className="mx-conversation-row__persona">
                      {PERSONA_NAMES[conv.persona] || conv.persona}
                    </span>
                    <span className="mx-conversation-row__text">
                      {conv.title || conv.last_message || 'Без сообщений'}
                    </span>
                    <span className="mx-conversation-row__date">
                      {relativeConversationDate(conv.updated_at)}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
            {hasMore && (
              <button
                type="button"
                data-testid="all-conversations-link"
                className="mx-dialog-continue__all"
                onClick={() => onShowAllConversations?.()}
              >
                Все разговоры
              </button>
            )}
          </div>
        )}

        {/* ── «Не знаешь, с чего начать?» — чипсы стартера активной роли ── */}

        <div className="mx-dialog-chips">
          <p className="mx-dialog-chips__label">Не знаешь, с чего начать?</p>
          <div className="mx-dialog-chips__list">
            {(activePersona?.starters || []).map((starter, i) => (
              <button
                type="button"
                data-testid="dialog-starter-chip"
                key={`${activePersona.key}-${i}`}
                className="mx-dialog-chip"
                disabled={creating}
                onClick={() => void startWithChip(activePersona, starter)}
              >
                {starter}
              </button>
            ))}
          </div>
        </div>

        {/* ── Дисклеймер внизу ── */}
        <p className="mx-dialog-disclaimer" data-testid="dialog-disclaimer">
          Разговоры видишь только ты. Это не терапия.
        </p>
      </section>
    </main>
  )
}

export { PROMISES }
