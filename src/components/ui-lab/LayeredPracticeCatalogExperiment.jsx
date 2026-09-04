import { useState } from 'react'
import { ArrowLeft, ArrowRight, ChevronRight, Lock, X } from 'lucide-react'

import SemanticGlyph from '../SemanticGlyph'
import { ExperimentShell } from './UiExperiments'
import { CURRENT_PRACTICES } from './ProductionBaseline'

import './LayeredPracticeCatalogExperiment.css'

// TODO: заменить на финальный сюжет глифа после отдельного product/design-решения.
const TEMPORARY_CATALOG_DATA = {
  hero: {
    date: '02–08 сентября',
    title: 'Сезон медленных вечеров',
    description:
      'Замедлиться после длинного дня и вернуть внимание к тому, что действительно важно. Выбери одну тихую практику для себя.',
    meta: '5 практик · 3–7 мин',
  },
  themes: [
    { number: '01', title: 'Замечать', question: 'Что уже происходит внутри?', kind: 'meditation' },
    {
      number: '02',
      title: 'Собирать',
      question: 'Куда сейчас можно вернуть внимание?',
      kind: 'focus',
    },
    {
      number: '03',
      title: 'Продолжать',
      question: 'Какой следующий шаг достаточно мал?',
      kind: 'next-step',
    },
  ],
  collections: [
    { title: 'На одну минуту', description: 'Дыхание и короткая пауза', kind: 'ui-exp-003-breath' },
    {
      title: 'Когда трудно начать',
      description: 'Первый шаг и фокус',
      kind: 'ui-exp-003-next-step',
    },
    { title: 'Вечерняя тишина', description: '', kind: 'ui-exp-003-evening' },
    { title: 'Собрать день', description: '', kind: 'ui-exp-003-journal' },
  ],
}

const UI_EXP_003_RAIL_GLYPHS = {
  meditation: 'ui-exp-003-meditation',
  ritual: 'ui-exp-003-ritual',
  asceza: 'ui-exp-003-asceza',
  'next-step': 'ui-exp-003-next-step',
  release: 'ui-exp-003-release',
}

// TODO: временные данные для UI Lab; реальный список практик владелец продукта добавит сам.
const TEMPORARY_CATEGORY_ITEMS = {
  'На одну минуту': [
    {
      section: 'Основные практики',
      title: 'Дыхание',
      description: 'Короткая пауза, чтобы вернуться в момент',
      kind: 'breath',
    },
    {
      section: 'Основные практики',
      title: 'Точка опоры',
      description: 'Заметь, что уже поддерживает тебя',
      kind: 'focus',
    },
    {
      section: 'Дополнительно',
      title: 'Мягкий старт',
      description: 'Один спокойный шаг без спешки',
      kind: 'next-step',
      premium: true,
    },
  ],
  'Когда трудно начать': [
    {
      section: 'Основные практики',
      title: 'Первый шаг',
      description: 'Уменьшить задачу до действия на минуту',
      kind: 'next-step',
    },
    {
      section: 'Основные практики',
      title: 'Одно из всех',
      description: 'Выбрать ровно одно направление внимания',
      kind: 'focus',
    },
    {
      section: 'Дополнительно',
      title: 'Без вины',
      description: 'Вернуться к делу без самокритики',
      kind: 'release',
      premium: true,
    },
  ],
  'Вечерняя тишина': [
    {
      section: 'Основные практики',
      title: 'Замечать',
      description: 'Увидеть, как прошёл день',
      kind: 'meditation',
    },
    {
      section: 'Основные практики',
      title: 'Отпустить',
      description: 'Оставить незавершённое до завтра',
      kind: 'release',
    },
    {
      section: 'Дополнительно',
      title: 'Тихий вопрос',
      description: 'Небольшая рефлексия перед сном',
      kind: 'journal',
      premium: true,
    },
  ],
  'Собрать день': [
    {
      section: 'Основные практики',
      title: 'Запись дня',
      description: 'Собрать мысли в несколько строк',
      kind: 'journal',
    },
    {
      section: 'Основные практики',
      title: 'Следующий шаг',
      description: 'Сформулировать действие на завтра',
      kind: 'next-step',
    },
    {
      section: 'Дополнительно',
      title: 'Личная карта',
      description: 'Увидеть повторяющийся паттерн',
      kind: 'focus',
      premium: true,
    },
  ],
}

function AccentToggle({ accent, onChange }) {
  return (
    <div className="mx-layered-catalog__accent" role="group" aria-label="Цвет акцента">
      <span>Акцент</span>
      {['gold', 'azure'].map(value => (
        <button
          type="button"
          key={value}
          aria-pressed={accent === value}
          data-accent={value}
          onClick={() => onChange(value)}
        >
          {value === 'gold' ? 'Gold' : 'Azure'}
        </button>
      ))}
    </div>
  )
}

function HeroBanner({ accent, onOpenCheckin }) {
  return (
    <article className="mx-layered-catalog__hero" data-accent={accent}>
      <div className="mx-layered-catalog__hero-art" aria-hidden="true">
        <SemanticGlyph kind="focus" animated={false} highlighted={false} />
      </div>
      <div className="mx-layered-catalog__hero-copy">
        <span>{TEMPORARY_CATALOG_DATA.hero.date}</span>
        <h3>{TEMPORARY_CATALOG_DATA.hero.title}</h3>
        <p>{TEMPORARY_CATALOG_DATA.hero.description}</p>
        <small className="mx-layered-catalog__hero-meta">{TEMPORARY_CATALOG_DATA.hero.meta}</small>
        <button
          type="button"
          className="mx-layered-catalog__pill mx-layered-catalog__hero-cta"
          onClick={onOpenCheckin}
        >
          Попробовать <span aria-hidden="true">→</span>
        </button>
      </div>
    </article>
  )
}

function RecommendedRail({ accent }) {
  return (
    <section
      className="mx-layered-catalog__section mx-layered-catalog__rail-section"
      aria-label="Новое и рекомендованное"
    >
      <div className="mx-layered-catalog__rail" data-accent={accent}>
        {CURRENT_PRACTICES.slice(0, 5).map((practice, index) => (
          <button className="mx-layered-catalog__rail-card" type="button" key={practice.title}>
            <span className="mx-layered-catalog__avatar" aria-hidden="true">
              <SemanticGlyph
                kind={UI_EXP_003_RAIL_GLYPHS[practice.kind] || practice.kind}
                animated={false}
                highlighted={false}
              />
            </span>
            <span className="mx-layered-catalog__rail-badge">
              {index === 0 && <Lock size={10} />}
              {index === 0 ? 'FEATURED' : 'РЕКОМЕНДОВАНО'}
            </span>
            <span className="mx-layered-catalog__rail-category">
              {index < 3 ? 'Практики' : 'Психологические практики'}
            </span>
            <strong>{practice.title}</strong>
            <small>{practice.subtitle}</small>
          </button>
        ))}
      </div>
    </section>
  )
}

function WeeklyTheme({ themeIndex, setThemeIndex, accent }) {
  const theme = TEMPORARY_CATALOG_DATA.themes[themeIndex]
  const nextTheme = () => setThemeIndex((themeIndex + 1) % TEMPORARY_CATALOG_DATA.themes.length)
  const previousTheme =
    TEMPORARY_CATALOG_DATA.themes[
      (themeIndex - 1 + TEMPORARY_CATALOG_DATA.themes.length) % TEMPORARY_CATALOG_DATA.themes.length
    ]
  const followingTheme =
    TEMPORARY_CATALOG_DATA.themes[(themeIndex + 1) % TEMPORARY_CATALOG_DATA.themes.length]

  return (
    <section className="mx-layered-catalog__section" aria-labelledby="theme-title">
      <div className="mx-layered-catalog__section-head">
        <div>
          <span>Тема недели</span>
          <h3 id="theme-title">Один вопрос</h3>
        </div>
        <small>
          {themeIndex + 1} / {TEMPORARY_CATALOG_DATA.themes.length}
        </small>
      </div>
      <div className="mx-layered-catalog__theme-peek">
        {[previousTheme, followingTheme].map((peekTheme, index) => (
          <div
            className={`mx-layered-catalog__theme-side mx-layered-catalog__theme-side--${index ? 'next' : 'previous'}`}
            key={peekTheme.number}
            aria-hidden="true"
          >
            <span>{peekTheme.number}</span>
            <strong>{peekTheme.title}</strong>
          </div>
        ))}
        <button
          className="mx-layered-catalog__theme"
          type="button"
          data-accent={accent}
          onClick={nextTheme}
        >
          <span className="mx-layered-catalog__theme-art" aria-hidden="true">
            <SemanticGlyph kind={theme.kind} animated={false} highlighted={false} />
          </span>
          <span className="mx-layered-catalog__theme-copy">
            <small>{theme.number}</small>
            <strong>{theme.title}</strong>
            <span>{theme.question}</span>
          </span>
          <span className="mx-layered-catalog__dots">
            <i data-active="true" />
            <i />
            <i />
          </span>
        </button>
      </div>
    </section>
  )
}

function Collections({ onOpen }) {
  return (
    <section className="mx-layered-catalog__section" aria-labelledby="collections-title">
      <div className="mx-layered-catalog__section-head">
        <div>
          <span>Собрано для тебя</span>
          <h3 id="collections-title">Коллекции</h3>
        </div>
      </div>
      <div className="mx-layered-catalog__collections">
        {TEMPORARY_CATALOG_DATA.collections.map(collection => (
          <button
            className="mx-layered-catalog__collection"
            type="button"
            key={collection.title}
            onClick={() => onOpen(collection)}
          >
            <span className="mx-layered-catalog__collection-art" aria-hidden="true">
              <SemanticGlyph kind={collection.kind} animated={false} highlighted={false} />
            </span>
            <strong>{collection.title}</strong>
            {collection.description && <small>{collection.description}</small>}
            <ChevronRight
              className="mx-layered-catalog__collection-chevron"
              size={17}
              aria-hidden="true"
            />
          </button>
        ))}
      </div>
    </section>
  )
}

function CategoryScreen({ category, onBack }) {
  const grouped = TEMPORARY_CATEGORY_ITEMS[category.title].reduce((result, item) => {
    result[item.section] ||= []
    result[item.section].push(item)
    return result
  }, {})
  const recommendedPractice = TEMPORARY_CATEGORY_ITEMS[category.title][0]

  return (
    <section className="mx-layered-category" aria-labelledby="layered-category-title">
      <header className="mx-layered-category__header">
        <button type="button" aria-label="Назад к коллекциям" onClick={onBack}>
          <ArrowLeft size={19} />
        </button>
        <div className="mx-layered-category__heading">
          <h3 id="layered-category-title">{category.title.toLowerCase()}.</h3>
          <p>{category.description || 'Практики, чтобы спокойно вернуть внимание к себе'}</p>
        </div>
        <span aria-hidden="true" />
      </header>
      <section
        className="mx-layered-category__recommended"
        aria-labelledby="recommended-practice-title"
      >
        <span className="mx-layered-category__recommended-art" aria-hidden="true">
          <SemanticGlyph kind={recommendedPractice.kind} animated highlighted={false} />
        </span>
        <strong id="recommended-practice-title">{recommendedPractice.title}</strong>
        <p>{recommendedPractice.description}</p>
        <button className="mx-layered-category__start" type="button">
          {recommendedPractice.premium && <Lock size={14} aria-hidden="true" />}
          Начать
        </button>
      </section>
      <div className="mx-layered-category__body">
        {Object.entries(grouped).map(([section, items]) => (
          <section key={section} className="mx-layered-category__section">
            <span className="mx-layered-category__label">{section}</span>
            <div className="mx-layered-category__grid">
              {items.map(item => (
                <button className="mx-layered-category__card" type="button" key={item.title}>
                  {item.premium && <span className="mx-layered-category__premium">PREMIUM</span>}
                  <span className="mx-layered-category__art" aria-hidden="true">
                    <span className="mx-layered-category__art-glyph">
                      {/* TODO: черновая иллюстрация для превью, финальную нарисует владелец продукта. */}
                      <SemanticGlyph kind={item.kind} animated={false} highlighted={false} />
                    </span>
                    <span className="mx-layered-category__art-base" />
                  </span>
                  <strong>{item.title}</strong>
                  {item.description && <small>{item.description}</small>}
                  {item.premium && (
                    <Lock className="mx-layered-category__lock" size={15} aria-label="Premium" />
                  )}
                </button>
              ))}
            </div>
          </section>
        ))}
      </div>
    </section>
  )
}

function EmotionSheet({ open, onOpen, onClose, accent }) {
  if (!open) {
    return (
      <button
        className="mx-layered-catalog__sheet-peek"
        type="button"
        data-accent={accent}
        onClick={onOpen}
      >
        <span>
          <small>Чек-ин эмоций</small>
          <strong>Как ты сейчас?</strong>
        </span>
        <ArrowRight size={17} aria-hidden="true" />
      </button>
    )
  }
  return (
    <div className="mx-layered-catalog__sheet-layer">
      <button
        className="mx-layered-catalog__sheet-backdrop"
        type="button"
        aria-label="Закрыть чек-ин"
        onClick={onClose}
      />
      <section
        className="mx-layered-catalog__sheet"
        data-accent={accent}
        role="dialog"
        aria-modal="true"
        aria-labelledby="emotion-title"
      >
        <button
          className="mx-layered-catalog__sheet-close"
          type="button"
          aria-label="Закрыть"
          onClick={onClose}
        >
          <X size={18} />
        </button>
        <span
          className="mx-layered-catalog__sheet-figure mx-layered-catalog__sheet-figure--one"
          aria-hidden="true"
        />
        <span
          className="mx-layered-catalog__sheet-figure mx-layered-catalog__sheet-figure--two"
          aria-hidden="true"
        />
        <span>Чек-ин эмоций</span>
        <h3 id="emotion-title">Как ты сейчас?</h3>
        <p>Назови состояние без необходимости что-либо исправлять.</p>
        <button type="button" className="mx-layered-catalog__pill" onClick={onClose}>
          Отметить состояние <ArrowRight size={15} />
        </button>
      </section>
    </div>
  )
}

export default function LayeredPracticeCatalogExperiment({ mode = 'after' }) {
  const [accent, setAccent] = useState('gold')
  const [themeIndex, setThemeIndex] = useState(0)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [selectedCollection, setSelectedCollection] = useState(null)

  return (
    <ExperimentShell
      number="26"
      eyebrow="UI-EXP-003 · каталожный паттерн"
      title="Ярусный каталог"
      purpose="Сравнение текущего вертикального каталога Практик с многоярусной композицией: промо, рельс, тематический фокус, коллекции и контекстный чек-ин."
      mode={mode}
    >
      <div className="mx-layered-catalog" data-accent={accent}>
        <AccentToggle accent={accent} onChange={setAccent} />
        <HeroBanner accent={accent} onOpenCheckin={() => setSheetOpen(true)} />
        <RecommendedRail accent={accent} />
        <WeeklyTheme themeIndex={themeIndex} setThemeIndex={setThemeIndex} accent={accent} />
        {selectedCollection ? (
          <CategoryScreen
            category={selectedCollection}
            onBack={() => setSelectedCollection(null)}
          />
        ) : (
          <Collections onOpen={setSelectedCollection} />
        )}
        <button
          type="button"
          className="mx-layered-catalog__checkin-trigger"
          onClick={() => setSheetOpen(true)}
        >
          Открыть чек-ин эмоций <ArrowRight size={15} />
        </button>
        <EmotionSheet
          open={sheetOpen}
          onOpen={() => setSheetOpen(true)}
          onClose={() => setSheetOpen(false)}
          accent={accent}
        />
      </div>
    </ExperimentShell>
  )
}
