import Screen from '../components/Screen'
import { ArrowRight } from 'lucide-react'
import { useBackButton } from '../platform/telegram.hooks'
import { libraryTopic } from '../data/libraryTopics'

export default function LibraryArticleReader({ article, next, onBack, onJournal, onNext }) {
  useBackButton(onBack)
  const paragraphs = String(article.body || '')
    .split(/\n\s*\n/)
    .filter(Boolean)
  return (
    <Screen showHeader={false} telegramChrome className="mx-library-reader-surface">
      <article
        className="mx-library-reader"
        data-testid="article-reader"
        data-article-id={article.id}
      >
        <header>
          <p className="mx-library-caps">{libraryTopic(article.tag || article.category).title}</p>
          <h1 className="mx-type-page" data-testid="article-title">
            {article.title}
          </h1>
          <p className="mx-type-meta text-muted">{article.minutes} мин чтения</p>
        </header>
        <div className="mx-library-reader-text">
          {paragraphs.map((text, index) => (
            <p key={index} className="mx-type-control">
              {text}
            </p>
          ))}
        </div>
        {article.source && (
          <a
            className="mx-library-source mx-type-body text-muted"
            href={article.source}
            target="_blank"
            rel="noopener noreferrer"
          >
            Первоисточник <ArrowRight size={14} />
          </a>
        )}
        <section className="mx-library-reflection" data-testid="article-reflection">
          <h2 className="mx-type-section">А у тебя как?</h2>
          <p className="mx-type-control">{article.question}</p>
          <button
            type="button"
            className="mx-library-action mx-type-control"
            data-testid="article-journal"
            onClick={onJournal}
          >
            Записать в журнал
          </button>
        </section>
        {next && (
          <button
            type="button"
            className="mx-library-next mx-type-control"
            data-testid="article-next"
            onClick={onNext}
          >
            Следующая статья <ArrowRight size={16} /> <span className="mx-type-body text-muted">{next.title}</span>
          </button>
        )}
      </article>
    </Screen>
  )
}
