import { useState } from 'react'
import { ArrowRight, ChevronRight, Lock, X } from 'lucide-react'

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
    { title: 'На одну минуту', description: 'Дыхание и короткая пауза', kind: 'breath' },
    { title: 'Когда трудно начать', description: 'Первый шаг и фокус', kind: 'next-step' },
    { title: 'Вечерняя тишина', description: '', kind: 'meditation' },
    { title: 'Собрать день', description: '', kind: 'journal' },
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
    <section className="mx-layered-catalog__section" aria-labelledby="recommended-title">
      <div className="mx-layered-catalog__section-head">
        <div>
          <span>Для тебя</span>
          <h3 id="recommended-title">Новое и рекомендованное</h3>
        </div>
        <small>свайп</small>
      </div>
      <div className="mx-layered-catalog__rail" data-accent={accent}>
        {CURRENT_PRACTICES.slice(0, 5).map((practice, index) => (
          <button className="mx-layered-catalog__rail-card" type="button" key={practice.title}>
            <span className="mx-layered-catalog__avatar" aria-hidden="true">
              <SemanticGlyph kind={practice.kind} animated={false} highlighted={false} />
            </span>
            {index === 0 && (
              <span className="mx-layered-catalog__featured">
                <Lock size={10} /> FEATURED
              </span>
            )}
            <strong>{practice.title}</strong>
            <small>{index % 2 ? '5 минут' : '1–3 минуты'}</small>
          </button>
        ))}
      </div>
      <div className="mx-layered-catalog__dots" aria-label="Страница 1 из 3">
        <span data-active="true" />
        <span />
        <span />
      </div>
    </section>
  )
}

function WeeklyTheme({ themeIndex, setThemeIndex, accent }) {
  const theme = TEMPORARY_CATALOG_DATA.themes[themeIndex]
  const nextTheme = () => setThemeIndex((themeIndex + 1) % TEMPORARY_CATALOG_DATA.themes.length)

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
    </section>
  )
}

function Collections() {
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
          <button className="mx-layered-catalog__collection" type="button" key={collection.title}>
            {collection.description && (
              <span className="mx-layered-catalog__collection-art" aria-hidden="true">
                <SemanticGlyph kind={collection.kind} animated={false} highlighted={false} />
              </span>
            )}
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
        <Collections />
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
