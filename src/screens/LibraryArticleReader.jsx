import { useEffect, useState } from 'react'
import Screen from '../components/Screen'
import { ArrowRight } from 'lucide-react'
import { useBackButton } from '../platform/telegram.hooks'
import { libraryTopic } from '../data/libraryTopics'
import { fetchArticleById } from '../lib/libraryDataCache'

/*
 * Читалка статьи. Список Библиотеки приходит без body — текст статьи
 * догружается по id (GET /api/content/library/{id}), кешируется на сессию.
 * Пока грузится — спокойный скелет; ошибка сети — короткий текст и «Повторить».
 */
export default function LibraryArticleReader({ article, next, onBack, onJournal, onNext }) {
  useBackButton(onBack)
  const [full, setFull] = useState(article?.body ? article : null)
  const [loading, setLoading] = useState(() => !article?.body)
  const [error, setError] = useState(false)
  const [retryCount, setRetryCount] = useState(0)

  useEffect(() => {
    if (article?.body) {
      setFull(article)
      setLoading(false)
      setError(false)
      return undefined
    }
    let alive = true
    setLoading(true)
    setError(false)
    fetchArticleById(article.id)
      .then(data => {
        if (alive) setFull(data)
      })
      .catch(() => {
        if (alive) setError(true)
      })
      .finally(() => {
        if (alive) setLoading(false)
      })
    return () => {
      alive = false
    }
  }, [article, retryCount])

  const current = full || article
  const paragraphs = String(current?.body || '')
    .split(/\n\s*\n/)
    .filter(Boolean)

  return (
    <Screen showHeader={false} telegramChrome className="mx-library-reader-surface">
      <article
        className="mx-library-reader"
        data-testid="article-reader"
        data-article-id={article.id}
      >
        <header className="mx-protected-text">
          <p className="mx-library-caps">{libraryTopic(article.tag || article.category).title}</p>
          <h1 className="mx-type-page" data-testid="article-title">
            {article.title}
          </h1>
          <p className="mx-type-meta text-muted">{article.minutes} мин чтения</p>
        </header>
        {loading && (
          <div className="mx-library-reader-text" data-testid="article-loading">
            {[0, 1, 2, 3].map(i => (
              <span key={i} className="mx-hj-skeleton mx-hj-skeleton--text" />
            ))}
          </div>
        )}

        {error && (
          <div className="mx-library-reader-error" role="alert" data-testid="article-error">
            <p className="mx-type-control">Не удалось загрузить. Проверь интернет</p>
            <button
              type="button"
              className="mx-library-action mx-type-control"
              data-testid="article-retry"
              onClick={() => setRetryCount(c => c + 1)}
            >
              Повторить
            </button>
          </div>
        )}

        {!loading && !error && (
          <>
            <div className="mx-library-reader-text mx-protected-text">
              {paragraphs.map((text, index) => (
                <p key={index} className="mx-type-control">
                  {text}
                </p>
              ))}
            </div>
            {current.source && (
              <a
                className="mx-library-source mx-type-body text-muted"
                href={current.source}
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
                Следующая статья <ArrowRight size={16} />{' '}
                <span className="mx-type-body text-muted">{next.title}</span>
              </button>
            )}
          </>
        )}
      </article>
    </Screen>
  )
}
