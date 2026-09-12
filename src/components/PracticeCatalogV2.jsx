import { useMemo, useRef, useState } from 'react'
import { ArrowLeft, ArrowRight, ChevronRight } from 'lucide-react'

import JournalArt from './practice-art/JournalArt'
import SemanticGlyph from './SemanticGlyph'
import { getPracticeByKey, PRACTICE_COLLECTIONS } from '../lib/practiceCatalogRegistry'
import './ui-lab/LayeredPracticeCatalogExperiment.css'
import './ui-lab/practices-a11y-fixes.css'

const VISIBLE_COLLECTIONS = PRACTICE_COLLECTIONS.filter(collection => collection.key !== 'lila')

function PracticeGlyph({ kind, highlighted = false }) {
  return <SemanticGlyph kind={kind} animated={false} highlighted={highlighted} />
}

function JournalBanner({ onOpen }) {
  return (
    <article className="mx-layered-catalog__journal-hero">
      <div className="mx-layered-catalog__journal-hero-art" aria-hidden="true">
        <JournalArt />
      </div>
      <div className="mx-layered-catalog__journal-hero-copy">
        <span>ЖУРНАЛ · СЕГОДНЯ</span>
        <h2 className="mx-type-section">Разбери день на части</h2>
        <p>Семь простых вопросов, чтобы увидеть главное</p>
        <button type="button" className="mx-layered-catalog__pill" onClick={onOpen}>
          Открыть журнал <ArrowRight size={15} />
        </button>
      </div>
    </article>
  )
}

function PracticeRail({ practices, onOpen }) {
  const lila = getPracticeByKey(practices, 'lila-discover') || {
    key: 'lila-discover',
    title: 'Разобраться через Лилу',
    subtitle: 'Карта, несколько вопросов и один рабочий шаг',
    kind: 'journal',
    sub: 'lila-discover',
  }
  const railCards = [
    {
      key: 'lila-discover',
      title: 'Разобраться через Лилу',
      category: 'Лила',
      description: 'Карта, несколько вопросов и один рабочий шаг',
      status: 'НОВОЕ',
      kind: 'journal',
      active: true,
      practice: lila,
    },
    {
      key: 'lion-action',
      title: 'Импульс к действию с Львом',
      category: 'Мотивация',
      description: 'Мягкий толчок к делу, которое давно откладываешь',
      status: 'СКОРО',
      kind: 'purpose',
      active: false,
    },
    {
      key: 'focus-preview',
      title: 'Фокус',
      category: 'Концентрация',
      description: 'Освободи мысли и верни внимание к одному важному делу',
      status: 'СКОРО',
      kind: 'focus',
      active: false,
    },
  ]

  return (
    <section
      className="mx-layered-catalog__section mx-layered-catalog__rail-section"
      aria-label="Новое и рекомендованное"
    >
      <div className="mx-layered-catalog__rail-label">Новое и рекомендованное</div>
      <div className="mx-layered-catalog__rail" data-accent="gold">
        {railCards.map(card => (
          <button
            className="mx-layered-catalog__rail-card"
            type="button"
            key={card.key}
            disabled={!card.active}
            aria-label={card.active ? `Открыть ${card.title}` : `${card.title}, скоро`}
            onClick={() => card.active && onOpen(card.practice)}
          >
            <span className="mx-layered-catalog__avatar" aria-hidden="true">
              <PracticeGlyph kind={card.kind} highlighted={card.active} />
            </span>
            <span className="mx-layered-catalog__rail-badge">{card.status}</span>
            <span className="mx-layered-catalog__rail-category">{card.category}</span>
            <strong>{card.title}</strong>
            <small>{card.description}</small>
          </button>
        ))}
      </div>
    </section>
  )
}

function ThemeCarousel({ theme, themeLoading = false, themeError = false, onOpen }) {
  const [questionIndex, setQuestionIndex] = useState(0)
  const trackRef = useRef(null)
  const questions = useMemo(
    () => (Array.isArray(theme?.days) ? theme.days.slice(0, 4) : []),
    [theme]
  )
  const safeQuestionIndex = Math.min(questionIndex, Math.max(0, questions.length - 1))

  function handleScroll() {
    const track = trackRef.current
    if (!track || !track.clientWidth) return
    const cards = [...track.querySelectorAll('.mx-layered-catalog__theme')]
    if (!cards.length) return

    const center = track.scrollLeft + track.clientWidth / 2
    const nextIndex = cards.reduce((closest, card, index) => {
      const distance = Math.abs(card.offsetLeft + card.offsetWidth / 2 - center)
      const closestDistance = Math.abs(
        cards[closest].offsetLeft + cards[closest].offsetWidth / 2 - center
      )
      return distance < closestDistance ? index : closest
    }, 0)

    setQuestionIndex(nextIndex)
  }

  if (themeLoading || themeError || !theme || questions.length === 0) {
    const title = themeLoading
      ? 'Загружаю вопросы'
      : themeError
        ? 'Вопросы не загрузились'
        : 'Пока нет вопросов'
    const copy = themeLoading
      ? 'Текущая тема появится через несколько секунд.'
      : themeError
        ? 'Не удалось загрузить тему. Проверь соединение и попробуй ещё раз.'
        : 'Опубликованная тема появится здесь, когда будет доступна для тебя.'

    return (
      <section className="mx-layered-catalog__section" aria-label="Тема недели" aria-live="polite">
        <div className="mx-layered-catalog__section-head">
          <div>
            <span>Тема недели:</span>
            <h2 className="mx-type-section">{title}</h2>
          </div>
        </div>
        <p className="mx-layered-catalog__empty-copy">{copy}</p>
      </section>
    )
  }

  return (
    <section
      className="mx-layered-catalog__section mx-layered-catalog__theme-section"
      aria-labelledby="production-theme-title"
    >
      <div className="mx-layered-catalog__section-head">
        <div>
          <span>Тема недели:</span>
          <h2 className="mx-type-section" id="production-theme-title">Один вопрос.</h2>
        </div>
      </div>
      <div className="mx-layered-catalog__theme-track" ref={trackRef} onScroll={handleScroll}>
        {questions.map((question, index) => (
          <article
            className="mx-layered-catalog__theme"
            key={question.day ?? index}
            aria-label={`Вопрос ${question.day ?? index + 1}: ${question.text}`}
          >
            <span className="mx-layered-catalog__theme-copy">
              <span className="mx-layered-catalog__theme-number">{question.day ?? index + 1}</span>
              <strong className="mx-layered-catalog__theme-question">{question.text}</strong>
              {question.prompt && (
                <span className="mx-layered-catalog__theme-subtitle">{question.prompt}</span>
              )}
            </span>
          </article>
        ))}
      </div>
      <span
        className="mx-layered-catalog__dots"
        role="img"
        aria-label={`Вопрос ${safeQuestionIndex + 1} из ${questions.length}`}
      >
        {questions.map((question, index) => (
          <i
            key={question.day ?? index}
            data-active={index === safeQuestionIndex ? 'true' : undefined}
            aria-hidden="true"
          />
        ))}
      </span>
      <div className="mx-layered-catalog__theme-actions">
        <button type="button" className="mx-layered-catalog__pill" onClick={() => onOpen(theme)}>
          Начать запись <ArrowRight size={15} />
        </button>
      </div>
    </section>
  )
}

function CollectionTile({ collection, onOpen }) {
  return (
    <button
      className="mx-layered-catalog__collection"
      data-collection-key={collection.key}
      type="button"
      onClick={() => onOpen(collection)}
    >
      <span className="mx-layered-catalog__collection-art" aria-hidden="true">
        <PracticeGlyph kind={collection.kind} />
      </span>
      <strong>{collection.title}</strong>
      <small>{collection.description}</small>
      <ChevronRight
        className="mx-layered-catalog__collection-chevron"
        size={17}
        aria-hidden="true"
      />
    </button>
  )
}

function CollectionGrid({ onOpen }) {
  return (
    <section className="mx-layered-catalog__section" aria-label="Коллекции">
      <div className="mx-layered-catalog__section-head">
        <div>
          <span>Собрано для тебя</span>
          <h2 className="mx-type-section">Коллекции</h2>
        </div>
        <small>{VISIBLE_COLLECTIONS.length}</small>
      </div>
      <div className="mx-layered-catalog__collections">
        {VISIBLE_COLLECTIONS.map(collection => (
          <CollectionTile key={collection.key} collection={collection} onOpen={onOpen} />
        ))}
      </div>
    </section>
  )
}

function itemLabel(item) {
  return item?.name || item?.title || item?.text || 'Без названия'
}

function CollectionScreen({ collection, practices, rituals, ascezas, onBack, onOpenPractice }) {
  const practiceItems = (collection.practiceKeys || [])
    .map(key => getPracticeByKey(practices, key))
    .filter(Boolean)
  const source = collection.source || null
  const liveItems = source === 'rituals' ? rituals : source === 'ascezas' ? ascezas : []
  const items = liveItems.length ? liveItems : practiceItems
  const openSource = () => onOpenPractice({ key: source, sub: source }, collection.key)

  return (
    <section className="mx-layered-category" aria-labelledby="production-category-title">
      <header className="mx-layered-category__header">
        <button
          type="button"
          className="mx-layered-category__back"
          aria-label="Назад к коллекциям"
          onClick={onBack}
        >
          <ArrowLeft size={19} />
        </button>
        <div className="mx-layered-category__heading">
          <h2 className="mx-type-section" id="production-category-title">{collection.title}.</h2>
          <p>{collection.description}</p>
        </div>
        <span aria-hidden="true" />
      </header>
      <div className="mx-layered-category__body">
        <section className="mx-layered-category__section">
          <span className="mx-layered-category__label">{source ? 'Твои данные' : 'Практики'}</span>
          {source && liveItems.length === 0 ? (
            <div className="mx-layered-category__body">
              <p className="text-muted text-[13px]">
                {source === 'rituals'
                  ? 'Здесь появятся твои ритуалы.'
                  : 'Здесь появятся твои аскезы.'}
              </p>
              <button type="button" className="mx-layered-catalog__pill" onClick={openSource}>
                {source === 'rituals' ? 'Открыть ритуалы' : 'Открыть аскезы'}
              </button>
            </div>
          ) : (
            <div className="mx-layered-category__grid">
              {items.map(item => {
                const isLive = !item.key
                const practice = item.key ? item : null
                const key = practice?.key || `${collection.key}-${item.id || itemLabel(item)}`
                return (
                  <button
                    className="mx-layered-category__card"
                    type="button"
                    key={key}
                    onClick={() =>
                      isLive ? openSource() : practice && onOpenPractice(practice, collection.key)
                    }
                  >
                    <span className="mx-layered-category__art" aria-hidden="true">
                      <span className="mx-layered-category__art-glyph">
                        <PracticeGlyph kind={practice?.kind || collection.kind} />
                      </span>
                      <span className="mx-layered-category__art-base" />
                    </span>
                    <strong>{practice?.title || itemLabel(item)}</strong>
                    <small>
                      {practice?.subtitle ||
                        (source === 'rituals'
                          ? item.today_level
                            ? 'сегодня выполнено'
                            : 'открыть ритуалы'
                          : item.today_status === 'held'
                            ? 'сегодня удержано'
                            : 'открыть аскезы')}
                    </small>
                    {practice?.completedToday && (
                      <span className="mx-layered-category__completion">сегодня</span>
                    )}
                  </button>
                )
              })}
            </div>
          )}
        </section>
      </div>
    </section>
  )
}

export default function PracticeCatalogV2({
  practices,
  rituals,
  ascezas,
  themes,
  themeLoading = false,
  themesError = false,
  onOpenPractice,
  selectedCollectionKey = null,
  onCollectionChange,
  onOpenJournal,
  onOpenTheme,
}) {
  const selectedCollection =
    PRACTICE_COLLECTIONS.find(collection => collection.key === selectedCollectionKey) || null
  const visiblePractices = useMemo(() => practices || [], [practices])

  if (selectedCollection) {
    return (
      <div className="mx-production-catalog mx-production-catalog--category">
        <CollectionScreen
          collection={selectedCollection}
          practices={visiblePractices}
          rituals={rituals}
          ascezas={ascezas}
          onBack={() => onCollectionChange?.(null)}
          onOpenPractice={onOpenPractice}
        />
      </div>
    )
  }

  return (
    <div
      className="mx-layered-catalog mx-production-catalog mx-layered-catalog--mxl-547-preview"
      data-accent="gold"
    >
      <JournalBanner onOpen={onOpenJournal} />
      <PracticeRail practices={visiblePractices} onOpen={onOpenPractice} />
      <ThemeCarousel
        key={themes?.[0]?.id ?? (themeLoading ? 'loading' : themesError ? 'error' : 'empty')}
        theme={themes?.[0] || null}
        themeLoading={themeLoading}
        themeError={themesError}
        onOpen={onOpenTheme}
      />
      <CollectionGrid onOpen={collection => onCollectionChange?.(collection.key)} />
    </div>
  )
}
