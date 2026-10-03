import { useEffect, useRef, useState } from 'react'

import { platform } from '../../platform'
import { api } from '../../lib/api'
import { useScrollFade } from '../../lib/useScrollFade'
import { PERSONAS } from './personas'
import { relativeConversationDate } from './conversationDate'
import { DIALOG_STARTER_CHIPS, PERSONA_STARTER_CHIP_LABELS } from '../../data/prompts'
import heroReference from '../../assets/dialog-hero-reference.png'

import './PersonaPicker.css'
import './DialogNotice.css'

const DEFAULT_INDEX = 1

// Соседняя (неактивная) карточка — 0.86 от активной, как соседи «Темы недели».
const NEIGHBOR_SCALE = 0.86

// Визуальный порядок entry-карусели: Наставник, Спутник (центр), Наблюдатель, Даймон.
const DISPLAY_PERSONAS = [PERSONAS[1], PERSONAS[0], PERSONAS[2]]

const PERSONA_NAMES = Object.fromEntries(PERSONAS.map(p => [p.key, p.name]))

const PERSONA_BY_KEY = Object.fromEntries(PERSONAS.map(p => [p.key, p]))

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
  const [conversationsError, setConversationsError] = useState(false)
  const [conversationsAttempt, setConversationsAttempt] = useState(0)
  const [creating, setCreating] = useState(false)
  const trackRef = useRef(null)
  const scaleFrameRef = useRef(null)
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
      measurePositions()
      syncActive()
    })
    return () => cancelAnimationFrame(frame)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Поворот телефона или ресайз: масштаб карточки считается от её ширины,
  // поэтому после смены размера пересчитываем кэш позиций и собираем карусель заново.
  useEffect(() => {
    const onResize = () => {
      if (!trackRef.current) return
      measurePositions()
      syncActive()
    }
    window.addEventListener('resize', onResize)
    return () => {
      window.removeEventListener('resize', onResize)
      if (scaleFrameRef.current) cancelAnimationFrame(scaleFrameRef.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Загружаем последние разговоры для блока «Продолжить разговор».
  useEffect(() => {
    if (!userId) return
    let cancelled = false
    api.mentalix
      .listConversations(userId, { limit: 4 })
      .then(data => {
        if (cancelled) return
        setConversations(Array.isArray(data) ? data : [])
        setConversationsError(false)
      })
      .catch(() => {
        // Сбой списка — не молчим: показываем баннер с «Повторить».
        if (!cancelled) setConversationsError(true)
      })
    return () => {
      cancelled = true
    }
  }, [userId, conversationsAttempt])

  // Мягкое затухание под шапкой Telegram — общий хук ставит data-атрибут
  // только на границе «прокручено/нет», не на каждом событии scroll.
  useScrollFade('mxDialogScrolled', true)

  // Кэш позиций карточек: offsetLeft/offsetWidth читаются один раз
  // (и при resize), а в rAF только scrollLeft → transform.
  const positionsRef = useRef([])

  function measurePositions() {
    const track = trackRef.current
    if (!track || !track.clientWidth) return
    positionsRef.current = Array.from(track.children).map(card => ({
      center: card.offsetLeft + card.offsetWidth / 2,
      width: card.offsetWidth,
    }))
  }

  // Масштаб карусели — как у «Темы недели» (ThemeQuestionCarousel):
  // активная карточка полного размера, сосед — NEIGHBOR_SCALE от неё.
  // Меняется только transform: ширина в разметке остаётся 204px, поэтому
  // высота активной карточки по-прежнему считается по содержимому, а соседи
  // из-за align-items: center стоят по центру трека.
  function applyScale() {
    const track = trackRef.current
    if (!track || !track.clientWidth) return
    const positions = positionsRef.current
    if (!positions.length) return
    const center = track.scrollLeft + track.clientWidth / 2
    const cards = track.children
    positions.forEach((pos, i) => {
      const card = cards[i]
      if (!card) return
      const t = Math.min(Math.abs(pos.center - center) / pos.width, 1)
      card.style.transform = `scale(${(1 - (1 - NEIGHBOR_SCALE) * t).toFixed(4)})`
    })
  }

  function syncActive() {
    const track = trackRef.current
    if (!track) return
    if (!positionsRef.current.length) measurePositions()
    applyScale()
    const center = track.scrollLeft + track.clientWidth / 2
    let closest = 0
    let distance = Infinity
    positionsRef.current.forEach((pos, index) => {
      const d = Math.abs(pos.center - center)
      if (d < distance) {
        closest = index
        distance = d
      }
    })
    setActive(closest)
  }

  // Свайп: масштаб и активная карточка пересчитываются кадром, не на каждый scroll.
  function handleCarouselScroll() {
    if (scaleFrameRef.current) return
    scaleFrameRef.current = requestAnimationFrame(() => {
      scaleFrameRef.current = null
      syncActive()
    })
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
          onScroll={handleCarouselScroll}
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

      {conversationsError && (
        <div className="mx-dialog-continue">
          <h3 className="mx-dialog-section-title">Продолжить разговор</h3>
          <div
            role="alert"
            data-testid="continue-conversation-error"
            className="mx-conversation-notice"
          >
            <span className="text-muted text-[13px] leading-snug">
              Не удалось загрузить разговоры
            </span>
            <button
              type="button"
              data-testid="continue-conversation-retry"
              className="mx-glass mx-conversation-retry"
              onClick={() => setConversationsAttempt(value => value + 1)}
            >
              Повторить
            </button>
          </div>
        </div>
      )}

      {!conversationsError && recentConversations.length > 0 && (
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

      {/* ── «Не знаешь, с чего начать?» — один набор чипсов при любой карточке ── */}

      <div className="mx-dialog-chips">
        <p className="mx-dialog-section-title">Не знаешь, с чего начать?</p>
        <div className="mx-dialog-chips__list">
          {DIALOG_STARTER_CHIPS.map(chip => (
            <button
              type="button"
              data-testid="dialog-starter-chip"
              key={chip.starter}
              className="mx-dialog-chip mx-glass"
              disabled={creating}
              onClick={() => void startWithChip(PERSONA_BY_KEY[chip.persona], chip.starter)}
            >
              {PERSONA_STARTER_CHIP_LABELS[chip.starter] || chip.starter}
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
