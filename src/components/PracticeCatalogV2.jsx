import { useMemo } from 'react'
import { ChevronRight } from 'lucide-react'

import SemanticGlyph from './SemanticGlyph'
import ThemeQuestionCarousel from './ThemeQuestionCarousel'
import { getPracticeByKey, PRACTICE_COLLECTIONS } from '../lib/practiceCatalogRegistry'
import { illustrations } from '../assets/illustrations'
import './ui-lab/StepsExploreRedesign.css'

const VISIBLE_COLLECTIONS = PRACTICE_COLLECTIONS.filter(collection => collection.key !== 'lila')

function PracticeGlyph({ kind, highlighted = false }) {
  return <SemanticGlyph kind={kind} animated={false} highlighted={highlighted} />
}

/* ── 2. Большая карточка журнала ── */
function JournalBanner({ onOpen }) {
  return (
    <article className="mx-steps-journal">
      <div className="mx-steps-journal__art" aria-hidden="true">
        {illustrations.stepsHero
          ? (() => {
              const HeroArt = illustrations.stepsHero
              return <HeroArt />
            })()
          : null}
      </div>
      <div className="mx-steps-journal__body">
        <span className="mx-steps-journal__label">Журнал · сегодня</span>
        <h2 className="mx-steps-journal__title">Страница для себя</h2>
        <p className="mx-steps-journal__desc">Перечитай, кем становишься, и выпиши всё из головы. 5 минут.</p>
        <button type="button" className="mx-steps-journal__cta" data-testid="journal-open-cta" onClick={onOpen}>
          Открыть журнал <ChevronRight size={15} />
        </button>
      </div>
    </article>
  )
}

/* ── 3. Новое и рекомендованное ── */
function RailCard({ card, onOpen }) {
  const CardArt = card.illustrationKey ? illustrations[card.illustrationKey] : null
  return (
    <button
      className="mx-steps-rail-card"
      type="button"
      disabled={!card.active}
      aria-label={card.active ? `Открыть ${card.title}` : `${card.title}, скоро`}
      onClick={() => card.active && onOpen(card.practice)}
    >
      <span className="mx-steps-rail-card__icon" aria-hidden="true">
        {CardArt ? (
          <CardArt />
        ) : (
          <PracticeGlyph kind={card.kind} highlighted={card.active} />
        )}
      </span>
      <span
        className={`mx-steps-rail-card__badge ${card.badgeColor === 'gold' ? 'mx-steps-rail-card__badge--gold' : ''}`}
      >
        {card.status}
      </span>
      <span className="mx-steps-rail-card__category">{card.category}</span>
      <strong className="mx-steps-rail-card__title">{card.title}</strong>
      <small className="mx-steps-rail-card__desc">{card.description}</small>
    </button>
  )
}

function PracticeRail({ practices, onOpen }) {
  const daimon = getPracticeByKey(practices, 'daimon') || {
    key: 'daimon',
    title: 'Даймон',
    subtitle: 'Игра для самопознания: вопрос, кубик, разговор с внутренним голосом',
    kind: 'daimon',
    sub: 'daimon',
  }
  const railCards = [
    {
      key: 'daimon',
      title: 'Даймон',
      category: 'Самопознание',
      description: 'Игра для самопознания: вопрос, кубик, разговор с внутренним голосом',
      status: 'НОВОЕ',
      badgeColor: 'gold',
      kind: 'daimon',
      illustrationKey: 'daimonCard',
      active: true,
      practice: daimon,
    },
    {
      key: 'lion-action',
      title: 'Импульс со Львом',
      category: 'Мотивация',
      description: 'Мягкий толчок к делу, которое давно откладываешь',
      status: 'СКОРО',
      badgeColor: 'black',
      kind: 'purpose',
      active: false,
    },
    {
      key: 'focus-preview',
      title: 'Фокус',
      category: 'Концентрация',
      description: 'Освободи мысли и верни внимание к одному важному делу',
      status: 'СКОРО',
      badgeColor: 'black',
      kind: 'focus',
      active: false,
    },
  ]

  return (
    <div className="mx-steps-rail" data-accent="gold">
      {railCards.map(card => (
        <RailCard key={card.key} card={card} onOpen={onOpen} />
      ))}
    </div>
  )
}

/* ── 4. Тема недели ── */
function ThemeCarousel({
  theme,
  themeLoading = false,
  themeError = false,
  onOpen,
  onRetry,
  onOpenAllThemes,
}) {
  if (themeLoading || themeError || !theme || !Array.isArray(theme.days) || theme.days.length === 0) {
    return (
      <section className="mx-steps-theme-section" aria-label="Тема недели" aria-live="polite">
        <div className="mx-steps-theme-panel">
          <h2 className="mx-steps-theme-heading">
            <span className="mx-steps-theme-heading__label">Тема недели:</span>
            <span className="mx-steps-theme-heading__name">
              {themeLoading ? 'Загрузка…' : themeError ? 'Ошибка' : 'Скоро'}
            </span>
          </h2>
          {themeLoading ? (
            <div className="mx-steps-theme-skeleton" role="status" aria-label="Загрузка вопросов">
              <span className="animate-pulse" aria-hidden="true" />
            </div>
          ) : (
            <>
              <p className="mx-steps-empty-copy">
                {themeError
                  ? 'Вопросы не загрузились. Не удалось загрузить тему. Проверь соединение и попробуй ещё раз.'
                  : 'Пока нет вопросов. Опубликованная тема появится здесь, когда будет доступна для тебя.'}
              </p>
              {themeError && (
                <button type="button" className="mx-steps-pill" onClick={onRetry}>
                  Повторить
                </button>
              )}
            </>
          )}
        </div>
      </section>
    )
  }

  return (
    <section className="mx-steps-theme-section" aria-labelledby="steps-theme-title">
      <div className="mx-steps-theme-panel">
        <h2 className="mx-steps-theme-heading" id="steps-theme-title">
          <span className="mx-steps-theme-heading__label">Тема недели:</span>
          <span className="mx-steps-theme-heading__name">
            {theme.title
              ? theme.title.endsWith('.')
                ? theme.title
                : `${theme.title}.`
              : 'Один вопрос.'}
          </span>
        </h2>
        <ThemeQuestionCarousel
          questions={theme.days}
          onWrite={() => onOpen(theme)}
          onViewAnswer={() => onOpen(theme)}
        />
      </div>
      {onOpenAllThemes && (
        <button
          type="button"
          className="mx-steps-pill mx-steps-pill--outline"
          onClick={onOpenAllThemes}
        >
          Все темы
        </button>
      )}
    </section>
  )
}

/* ── 5. Коллекции ── */
function CollectionTile({ collection, onOpen }) {
  const isSoon = collection.active === false || collection.soon
  return (
    <button
      className="mx-steps-collection"
      data-collection-key={collection.key}
      type="button"
      disabled={isSoon}
      aria-label={isSoon ? `${collection.title}, скоро` : `Открыть ${collection.title}`}
      onClick={() => {
        if (!isSoon) onOpen(collection)
      }}
    >
      <strong className="mx-steps-collection__title">{collection.title}</strong>
      <small className="mx-steps-collection__desc">
        {isSoon ? 'Скоро' : collection.description}
      </small>
      <ChevronRight className="mx-steps-collection__chevron" size={17} aria-hidden="true" />
    </button>
  )
}

function CollectionGrid({ onOpen, error = false, onRetry }) {
  return (
    <section
      className="mx-steps-collections-section"
      aria-label="Коллекции"
      data-count={VISIBLE_COLLECTIONS.length}
    >
      <h2 className="mx-steps-collections-heading">Коллекции</h2>
      <div className="mx-steps-collections">
        {VISIBLE_COLLECTIONS.map(collection => (
          <CollectionTile key={collection.key} collection={collection} onOpen={onOpen} />
        ))}
      </div>
      {error && (
        <div role="alert" data-testid="steps-collections-error">
          <p className="mx-steps-empty-copy">Не удалось загрузить ритуалы и аскезы.</p>
          <button type="button" className="mx-steps-pill" onClick={onRetry}>
            Повторить
          </button>
        </div>
      )}
    </section>
  )
}

export default function PracticeCatalogV2({
  practices,
  themes,
  themeLoading = false,
  themesError = false,
  onRetryThemes,
  onOpenPractice,
  onOpenCollection,
  onOpenJournal,
  onOpenTheme,
  onOpenAllThemes,
  collectionsError = false,
  onRetryCollections,
}) {
  const visiblePractices = useMemo(() => practices || [], [practices])

  return (
    <div className="mx-steps-explore-catalog mx-layered-catalog--mxl-547-preview">
      <JournalBanner onOpen={onOpenJournal} />
      <PracticeRail practices={visiblePractices} onOpen={onOpenPractice} />
      <ThemeCarousel
        key={themes?.[0]?.id ?? (themeLoading ? 'loading' : themesError ? 'error' : 'empty')}
        theme={themes?.[0] || null}
        themeLoading={themeLoading}
        themeError={themesError}
        onRetry={onRetryThemes}
        onOpen={onOpenTheme}
        onOpenAllThemes={onOpenAllThemes}
      />
      <CollectionGrid
        onOpen={onOpenCollection}
        error={collectionsError}
        onRetry={onRetryCollections}
      />
    </div>
  )
}
