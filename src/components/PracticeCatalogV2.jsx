import { useMemo, useRef, useState } from 'react'
import { ArrowLeft, ArrowRight, ChevronRight } from 'lucide-react'

import JournalArt from './practice-art/JournalArt'
import SemanticGlyph from './SemanticGlyph'
import {
  getPracticeByKey,
  PRACTICE_COLLECTIONS,
  PRACTICE_RAIL_KEYS,
} from '../lib/practiceCatalogRegistry'
import './ui-lab/LayeredPracticeCatalogExperiment.css'

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
        <h3>Собери день в четыре шага</h3>
        <p>Идея, действие, анализ и новый шаг — спокойно, в своём темпе.</p>
        <button type="button" className="mx-layered-catalog__pill" onClick={onOpen}>
          Открыть журнал <ArrowRight size={15} />
        </button>
      </div>
    </article>
  )
}

function PracticeRail({ practices, onOpen }) {
  const railPractices = PRACTICE_RAIL_KEYS.map(key => getPracticeByKey(practices, key)).filter(
    Boolean
  )

  return (
    <section
      className="mx-layered-catalog__section mx-layered-catalog__rail-section"
      aria-label="Новое и рекомендованное"
    >
      <div className="mx-layered-catalog__rail-label">Выбери новое или рекомендованное</div>
      <div className="mx-layered-catalog__rail" data-accent="gold">
        {railPractices.map((practice, index) => (
          <button
            className="mx-layered-catalog__rail-card"
            type="button"
            key={practice.key}
            disabled={!practice.available}
            onClick={() => onOpen(practice)}
          >
            <span className="mx-layered-catalog__avatar" aria-hidden="true">
              <PracticeGlyph kind={practice.kind} highlighted={index === 0} />
            </span>
            <span className="mx-layered-catalog__rail-menu" aria-hidden="true">
              •••
            </span>
            <span className="mx-layered-catalog__rail-badge">
              {index === 0 ? 'НОВОЕ' : 'РЕКОМЕНДОВАНО'}
            </span>
            <span className="mx-layered-catalog__rail-category">{practice.section}</span>
            <strong>{practice.title}</strong>
            <small>{practice.subtitle}</small>
          </button>
        ))}
      </div>
    </section>
  )
}

function ThemeCarousel({ themes, onOpen }) {
  const [themeIndex, setThemeIndex] = useState(0)
  const trackRef = useRef(null)

  const safeThemeIndex = Math.min(themeIndex, Math.max(0, themes.length - 1))

  function handleScroll() {
    const track = trackRef.current
    if (!track || !track.clientWidth) return
    setThemeIndex(Math.round(track.scrollLeft / track.clientWidth))
  }

  if (!themes.length) {
    return (
      <section className="mx-layered-catalog__section" aria-label="Тема недели">
        <div className="mx-layered-catalog__section-head">
          <div>
            <span>Тема недели</span>
            <h3>Пока нет тем</h3>
          </div>
        </div>
        <p className="mx-layered-catalog__empty-copy">
          Опубликованные темы появятся здесь, когда backend вернёт их для пользователя.
        </p>
      </section>
    )
  }

  const activeTheme = themes[safeThemeIndex]

  return (
    <section className="mx-layered-catalog__section" aria-label="Тема недели">
      <div className="mx-layered-catalog__section-head">
        <div>
          <span>Тема недели</span>
          <h3>Один вопрос</h3>
        </div>
        <small>
          {safeThemeIndex + 1} / {themes.length}
        </small>
      </div>
      <div className="mx-layered-catalog__theme-track" ref={trackRef} onScroll={handleScroll}>
        {themes.map((theme, index) => (
          <button
            className="mx-layered-catalog__theme"
            type="button"
            key={theme.id}
            onClick={() => onOpen(theme)}
          >
            <span className="mx-layered-catalog__theme-copy">
              <span className="mx-layered-catalog__theme-number">
                {String(index + 1).padStart(2, '0')}
              </span>
              <strong className="mx-layered-catalog__theme-question">{theme.title}</strong>
              <span className="mx-layered-catalog__theme-subtitle">{theme.subtitle}</span>
              <span className="mx-layered-catalog__theme-progress">
                {theme.reflected_days || 0}/{theme.total_days || 0} дней
              </span>
            </span>
          </button>
        ))}
      </div>
      <span className="mx-layered-catalog__dots" aria-hidden="true">
        {themes.map(theme => (
          <i
            key={theme.id}
            data-active={themes.indexOf(theme) === safeThemeIndex ? 'true' : undefined}
          />
        ))}
      </span>
      <div className="mx-layered-catalog__theme-actions">
        <button
          type="button"
          className="mx-layered-catalog__pill"
          onClick={() => onOpen(activeTheme)}
        >
          Открыть тему <ArrowRight size={15} />
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
          <h3>Коллекции</h3>
        </div>
        <small>5</small>
      </div>
      <div className="mx-layered-catalog__collections">
        {PRACTICE_COLLECTIONS.map(collection => (
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
  const liveItems =
    collection.source === 'rituals' ? rituals : collection.source === 'ascezas' ? ascezas : []
  const items = liveItems.length ? liveItems : practiceItems

  return (
    <section className="mx-layered-category" aria-labelledby="production-category-title">
      <header className="mx-layered-category__header">
        <button type="button" aria-label="Назад к коллекциям" onClick={onBack}>
          <ArrowLeft size={19} />
        </button>
        <div className="mx-layered-category__heading">
          <h3 id="production-category-title">{collection.title}.</h3>
          <p>{collection.description}</p>
        </div>
        <span aria-hidden="true" />
      </header>
      <div className="mx-layered-category__body">
        <section className="mx-layered-category__section">
          <span className="mx-layered-category__label">
            {collection.source ? 'Твои данные' : 'Практики'}
          </span>
          <div className="mx-layered-category__grid">
            {items.map(item => {
              const practice = item.key ? item : null
              const key = practice?.key || `${collection.key}-${item.id || itemLabel(item)}`
              return (
                <button
                  className="mx-layered-category__card"
                  type="button"
                  key={key}
                  disabled={!practice}
                  onClick={() => practice && onOpenPractice(practice)}
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
                      (collection.source === 'rituals'
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
  onOpenPractice,
  onOpenJournal,
  onOpenTheme,
}) {
  const [selectedCollection, setSelectedCollection] = useState(null)
  const visiblePractices = useMemo(() => practices || [], [practices])

  if (selectedCollection) {
    return (
      <div className="mx-production-catalog mx-production-catalog--category">
        <CollectionScreen
          collection={selectedCollection}
          practices={visiblePractices}
          rituals={rituals}
          ascezas={ascezas}
          onBack={() => setSelectedCollection(null)}
          onOpenPractice={onOpenPractice}
        />
      </div>
    )
  }

  return (
    <div className="mx-layered-catalog mx-production-catalog" data-accent="gold">
      <JournalBanner onOpen={onOpenJournal} />
      <PracticeRail practices={visiblePractices} onOpen={onOpenPractice} />
      <ThemeCarousel themes={themes} onOpen={onOpenTheme} />
      <CollectionGrid onOpen={setSelectedCollection} />
    </div>
  )
}
