import { useEffect, useRef, useState } from 'react'

import { platform } from '../../platform'
import { api } from '../../lib/api'
import { PERSONAS } from './personas'
import { relativeConversationDate } from './conversationDate'
import { PERSONA_STARTER_CHIP_LABELS } from '../../data/prompts'
import heroReference from '../../assets/dialog-hero-reference.png'

import './PersonaPicker.css'

const DEFAULT_INDEX = 1

// Визуальный порядок entry-карусели: Наставник, Спутник (центр), Наблюдатель, Даймон.
const DISPLAY_PERSONAS = [PERSONAS[1], PERSONAS[0], PERSONAS[2]]

const PERSONA_NAMES = Object.fromEntries(PERSONAS.map(p => [p.key, p.name]))

const PROMISES = {
  mayak: 'Выслушает, когда нужно выговориться.',
  kompas: 'Превратит намерение в один шаг.',
  dnevnik: 'Подведёт итоги дня со стороны.',
}

const DIALOG_DESCRIPTIONS = {
  mayak: 'Идёт рядом. Не оценивает и не торопит.',
  kompas: 'Честный и строгий. Не даст себя жалеть.',
  dnevnik: 'Спокойный. Замечает то, что ты пропустил.',
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

  // Мягкое затухание под шапкой Telegram — тот же механизм, что у «Шагов»
  // (PR #987): контент уходит под «Закрыть» с переходом, а не обрезается.
  useEffect(() => {
    const root = document.querySelector('.mx-app-scroll-root')
    if (!root) return undefined
    const sync = () => {
      root.dataset.mxDialogScrolled = root.scrollTop > 2 ? '1' : '0'
    }
    sync()
    root.addEventListener('scroll', sync, { passive: true })
    return () => {
      root.removeEventListener('scroll', sync)
      delete root.dataset.mxDialogScrolled
    }
  }, [])

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
        <img className="mx-dialog-hero-reference" src={heroReference} alt="" aria-hidden="true" />
        <div className="mx-dialog-hero__content">
          <p className="mx-dialog-eyebrow font-label">ДИАЛОГ</p>
          <h1 id="dialog-entry-title" className="mx-type-hero">
            О чём хочешь поговорить прямо сейчас?
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
                className={`mx-dialog-card ${isActive ? 'is-active' : ''}`}
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
      </section>

      {/* ── «Продолжить разговор» — до 3 последних разговоров ── */}

      {recentConversations.length > 0 && (
        <div className="mx-dialog-continue" data-testid="continue-conversation-block">
          <h3 className="mx-dialog-section-title">Продолжить разговор</h3>
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
        <p className="mx-dialog-section-title">Не знаешь, с чего начать?</p>
        <div className="mx-dialog-chips__list">
          {(activePersona?.starters || []).map((starter, i) => (
            <button
              type="button"
              data-testid="dialog-starter-chip"
              key={`${activePersona.key}-${i}`}
              className="mx-dialog-chip mx-glass"
              disabled={creating}
              onClick={() => void startWithChip(activePersona, starter)}
            >
              {PERSONA_STARTER_CHIP_LABELS[starter] || starter}
            </button>
          ))}
        </div>
      </div>

      {/* ── Дисклеймер внизу ── */}
      <p className="mx-dialog-disclaimer" data-testid="dialog-disclaimer">
        Разговоры видишь только ты. Это не терапия.
      </p>
    </main>
  )
}

export { PROMISES }
