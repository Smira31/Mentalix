import { ArrowRight } from 'lucide-react'
import SemanticGlyph from '../components/SemanticGlyph'
import ArticleCover from '../components/ArticleCover'
import NestedScreenHeader from '../components/NestedScreenHeader'

export const LIBRARY_PROGRAMS_ENABLED = false

function LibraryV2FeaturedBanner({ title, description, art, action, onOpen, neutral = false }) {
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

const LIBRARY_V2_PROGRAMS = [
  ['Границы без лишнего напряжения', 'journal', 'Сказать «нет» без чувства вины'],
  ['Неделя внимательного решения', 'purpose', 'Семь дней, чтобы разложить выбор по полочкам'],
  ['Неделя внутреннего порядка', 'focus', 'Навести ясность в делах без спешки'],
]

function LibraryV2ProgramLanding({ onOpen }) {
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

function LibraryV2ProgramDetail({ title, onBack }) {
  return (
    <div className="mx-library-v2__program-detail animate-fade-in">
      <NestedScreenHeader
        title={title.toLowerCase() + '.'}
        onBack={onBack}
        registerSystemBack={false}
      />
      <div className="mx-library-v2__program-detail-art" aria-hidden="true">
        <SemanticGlyph kind="focus" animated={false} />
      </div>
      <p>Выстроить устойчивый ритм и доводить важное до конца без давления на себя.</p>
      <strong>Скоро</strong>
    </div>
  )
}

function LibraryV2CatalogCard({ title, description, kind, article, onOpen }) {
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

function LibraryV2ProgramsCatalog({ onBack, onOpen }) {
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

export { LibraryV2ProgramLanding, LibraryV2ProgramsCatalog, LibraryV2ProgramDetail }
