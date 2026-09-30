import { ArrowRight } from 'lucide-react'

import SemanticGlyph, { semanticKindForArticle } from '../../components/SemanticGlyph'
import NestedScreenHeader from '../../components/NestedScreenHeader'
import ArticleCover from '../../components/ArticleCover'
import { ARTICLES } from '../../data/articles'
import { platform } from '../../platform'
import '../Library.css'

// The demo composition is now the production Library composition as well.
// Article content still comes from the live/cache-backed ARTICLES collection below.
export const LIBRARY_V2_ENABLED = true

export function LibraryV2FeaturedBanner({ title, description, art, action, onOpen, neutral = false }) {
  return (
    <article className={`mx-library-v2__featured-banner ${neutral ? 'is-neutral' : ''}`}>
      <div className="mx-library-v2__featured-art" aria-hidden="true">
        {art}
      </div>
      <div className="mx-library-v2__featured-copy">
        <h3>{title}</h3>
        <p>{description}</p>
        <button type="button" className="mx-library-v2__pill" onClick={() => onOpen()}>
          {action} <ArrowRight size={15} />
        </button>
      </div>
    </article>
  )
}

export const LIBRARY_V2_PROGRAMS = [
  ['Границы без лишнего напряжения', 'journal', 'Сказать «нет» без чувства вины'],
  ['Неделя внимательного решения', 'purpose', 'Семь дней, чтобы разложить выбор по полочкам'],
  ['Неделя внутреннего порядка', 'focus', 'Навести ясность в делах без спешки'],
]

export function LibraryV2ArticleLanding({ onOpen }) {
  const article = ARTICLES[0]
  return (
    <section className="mx-library-v2__section-block" aria-labelledby="library-v2-articles-title">
      <h2 className="mx-type-section" id="library-v2-articles-title">
        Статьи
      </h2>
      <LibraryV2FeaturedBanner
        title={article.title}
        description={article.excerpt}
        action="Читать"
        onOpen={onOpen}
        neutral
        art={<ArticleCover article={article} className="h-full w-full" />}
      />
    </section>
  )
}

export function LibraryV2ProgramLanding({ onOpen }) {
  return (
    <section className="mx-library-v2__section-block" aria-labelledby="library-v2-programs-title">
      <h2 className="mx-type-section" id="library-v2-programs-title">
        Программы
      </h2>
      <LibraryV2FeaturedBanner
        title="Найди свою программу"
        description="Пошаговые практики на несколько дней или недель — выбери то, что откликается сейчас."
        action="Смотреть"
        onOpen={onOpen}
        neutral
        art={<SemanticGlyph kind="focus" animated={false} />}
      />
    </section>
  )
}

export function LibraryV2JournalLanding({ onOpen }) {
  return (
    <section className="mx-library-v2__section-block" aria-labelledby="library-v2-journals-title">
      <h2 className="mx-type-section" id="library-v2-journals-title">
        Направленные записи
      </h2>
      <LibraryV2FeaturedBanner
        title="Новая запись"
        description="Короткие письменные практики, которые помогают прояснить мысли."
        action="Начать"
        onOpen={onOpen}
        neutral
        art={<SemanticGlyph kind="journal" animated={false} />}
      />
      <div className="mx-library-programs__guided-list" aria-label="Другие направленные записи">
        <button type="button" className="mx-library-programs__guided-list-row" onClick={onOpen}>
          <span>
            <strong>Новая запись</strong>
            <small>4 вопроса · 5–7 минут</small>
          </span>
          <span aria-hidden="true">→</span>
        </button>
        <button type="button" className="mx-library-programs__guided-list-row" onClick={onOpen}>
          <span>
            <strong>Вернуться к записи</strong>
            <small>Сохранённые ответы и следующий шаг</small>
          </span>
          <span aria-hidden="true">→</span>
        </button>
      </div>
    </section>
  )
}

export function LibraryV2ProgramDetail({ title, onBack }) {
  return (
    <div className="mx-library-v2__program-detail animate-fade-in">
      <NestedScreenHeader title={title.toLowerCase() + '.'} onBack={onBack} registerSystemBack={false} />
      <div className="mx-library-v2__program-detail-art" aria-hidden="true">
        <SemanticGlyph kind="focus" animated={false} />
      </div>
      <p>Выстроить устойчивый ритм и доводить важное до конца без давления на себя.</p>
      <strong>Скоро</strong>
    </div>
  )
}

export function LibraryV2CatalogCard({ title, description, kind, article, onOpen }) {
  return (
    <button type="button" className="mx-library-v2__catalog-card" onClick={onOpen}>
      <span className="mx-library-v2__catalog-card-art" aria-hidden="true">
        {article ? (
          <ArticleCover article={article} className="h-full w-full" />
        ) : (
          <SemanticGlyph kind={kind} animated={false} />
        )}
      </span>
      <strong>{title}</strong>
      <small>{description}</small>
    </button>
  )
}

export function LibraryV2ProgramsCatalog({ onBack, onOpen }) {
  return (
    <div className="mx-library-v2__catalog animate-fade-in">
      <NestedScreenHeader title="программы." onBack={onBack} registerSystemBack={false} />
      <div className="mx-library-v2__catalog-grid" aria-label="Каталог программ">
        {LIBRARY_V2_PROGRAMS.map(([title, kind, description]) => (
          <LibraryV2CatalogCard
            key={title}
            title={title}
            description={description}
            kind={kind}
            onOpen={() => onOpen(title)}
          />
        ))}
      </div>
    </div>
  )
}

export function LibraryV2ArticlesCatalog({ onBack, onOpen }) {
  return (
    <div className="mx-library-v2__catalog animate-fade-in">
      <NestedScreenHeader title="статьи." onBack={onBack} registerSystemBack={false} />
      <div className="mx-library-v2__catalog-grid" aria-label="Каталог статей">
        {ARTICLES.map(article => (
          <LibraryV2CatalogCard
            key={article.id}
            title={article.title}
            description={article.excerpt}
            article={article}
            onOpen={() => onOpen(article.id)}
          />
        ))}
      </div>
    </div>
  )
}

export function LibraryV2ArticleReader({ article, onBack }) {
  const paragraphs = String(article.body || '')
    .split(/\n\s*\n/)
    .filter(Boolean)
  return (
    <div className="mx-library-v2__reader animate-fade-in">
      <NestedScreenHeader title="статья." onBack={onBack} registerSystemBack={false} />
      <ArticleCover article={article} variant="banner" className="mb-5" />
      <h1>{article.title}</h1>
      <div className="mx-library-v2__reader-meta">
        <span>{article.minutes} мин чтения</span>
        <span>·</span>
        <span>{article.tag}</span>
      </div>
      <div className="mx-library-v2__reader-body">
        {paragraphs.map((paragraph, index) => (
          <p key={index}>{paragraph}</p>
        ))}
      </div>
      {article.source && (
        <a
          href={article.source}
          target="_blank"
          rel="noopener noreferrer"
          className="mx-library-v2__reader-source"
        >
          Первоисточник <ArrowRight size={14} />
        </a>
      )}
    </div>
  )
}

export function LibraryV2Articles({ article, onBack, onOpen }) {
  if (article) return <LibraryV2ArticleReader article={article} onBack={onBack} />
  return <LibraryV2ArticlesCatalog onBack={onBack} onOpen={onOpen} />
}

export function CollectionCard({ title, description, kind, soon = false, onClick }) {
  return (
    <button
      type="button"
      className="mx-library-catalog__collection"
      disabled={soon}
      aria-label={soon ? `${title}, скоро` : `Открыть ${title}`}
      onClick={() => {
        if (soon) return
        platform.haptic('light')
        onClick?.()
      }}
    >
      {soon && <span className="mx-library-catalog__soon">СКОРО</span>}
      <strong>{title}</strong>
      <small>{description}</small>
      <span className="mx-library-catalog__collection-art" aria-hidden="true">
        <SemanticGlyph kind={kind} animated={false} />
      </span>
      {!soon && <ArrowRight className="mx-library-catalog__collection-arrow" size={17} />}
    </button>
  )
}

export function LibraryV2HeroJourneyLanding({ onOpen }) {
  return (
    <section
      className="mx-library-v2__section-block"
      aria-labelledby="library-v2-hero-journey-title"
    >
      <h2 className="mx-type-section" id="library-v2-hero-journey-title">
        Путь героя
      </h2>
      <LibraryV2FeaturedBanner
        title="Карта испытаний"
        description="16 испытаний современного человека — короткий опрос и персональная карта. Не тест, а ориентир."
        action="Пройти"
        onOpen={onOpen}
        art={<SemanticGlyph kind="path-corridor" animated={false} />}
      />
    </section>
  )
}
