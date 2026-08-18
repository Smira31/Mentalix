import { useEffect, useMemo, useState } from 'react'
import { platform } from '../platform'
import ArticleCover from '../components/ArticleCover'
import BackButton from '../components/BackButton'
import { Search, ExternalLink, ArrowRight } from 'lucide-react'
import { fetchArticles, peekArticles } from '../lib/libraryDataCache'
import EmptyState from '../components/EmptyState'

// Радиусы: rounded-3xl (24) — карточка, rounded-full — поиск и метки.

function formatDate(iso) {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  return d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' })
}

/*
 * Карточка статьи — широкая, во всю ширину экрана. Раньше
 * обложка была узкой полосой в 86 пикселей и работала как
 * цветная засечка сбоку; теперь это блок, который видно, а
 * текст занимает остальное. Строка «Читать статью» внизу —
 * потому что вся карточка нажимается, но об этом надо сказать
 * словами, иначе непонятно, где кончается список и начинается
 * действие.
 */
function ArticleCard({ article, onOpen }) {
  return (
    <button
      onClick={() => {
        platform.haptic('light')
        onOpen(article)
      }}
      className="w-full rounded-3xl bg-emerald mb-3 text-left border border-cream/10 p-4 transition-transform active:scale-[0.99]"
    >
      <div className="flex items-start gap-4">
        <ArticleCover article={article} className="w-[112px] h-[132px] shrink-0" />

        <div className="flex-1 min-w-0 py-0.5">
          {article.tag && (
            <span className="inline-block text-[10px] text-gold border border-gold/25 rounded-full px-2.5 py-0.5 mb-2 whitespace-nowrap">
              {article.tag}
            </span>
          )}

          <div className="font-display text-[17px] text-cream leading-tight">{article.title}</div>

          <p className="text-[13px] text-muted leading-snug mt-2 line-clamp-3">{article.excerpt}</p>
        </div>
      </div>

      <div className="flex items-center gap-2 mt-4 pt-3.5 border-t border-cream/8">
        <span className="text-[13px] text-gold">Читать статью</span>
        <ArrowRight size={14} className="text-gold shrink-0" strokeWidth={2} />

        <span className="text-[11px] text-faint ml-auto whitespace-nowrap">
          {article.minutes} мин · {formatDate(article.date)}
        </span>
      </div>
    </button>
  )
}

function Reader({ article, onBack }) {
  const paragraphs = String(article.body || '')
    .split(/\n\s*\n/)
    .filter(Boolean)

  return (
    <div className="w-full max-w-md px-5 animate-fade-in">
      <div className="mt-4 mb-5">
        <BackButton onClick={onBack} />
      </div>

      {/* тот же мотив, что и в списке, — статья узнаётся при открытии */}
      <ArticleCover article={article} variant="banner" className="mb-5" />

      <h1 className="font-display text-[26px] text-cream leading-tight">{article.title}</h1>

      <div className="flex items-center gap-2 mt-3 mb-6">
        <span className="text-[11px] text-gold">{article.minutes} мин чтения</span>
        <span className="text-[11px] text-faint">·</span>
        <span className="text-[11px] text-faint">{formatDate(article.date)}</span>
      </div>

      <div className="space-y-4">
        {paragraphs.map((p, i) => (
          <p key={i} className="text-[15px] text-cream leading-relaxed">
            {p}
          </p>
        ))}
      </div>

      {article.source && (
        <a
          href={article.source}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 mt-8 rounded-3xl bg-emerald/60 px-4 py-3.5"
        >
          <ExternalLink size={16} className="text-gold shrink-0" />
          <span className="text-[13px] text-muted">Первоисточник</span>
        </a>
      )}
    </div>
  )
}

export default function Articles() {
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(null)
  const [articles, setArticles] = useState(() => peekArticles() ?? [])
  const [loading, setLoading] = useState(() => peekArticles() === null)

  useEffect(() => {
    fetchArticles()
      .then(setArticles)
      .catch(e => {
        console.error(e)
        setArticles([])
      })
      .finally(() => setLoading(false))
  }, [])

  const list = useMemo(() => {
    const sorted = [...articles].sort((a, b) => String(b.date).localeCompare(String(a.date)))
    const q = query.trim().toLowerCase()
    if (!q) return sorted
    return sorted.filter(a => `${a.title} ${a.excerpt} ${a.tag || ''}`.toLowerCase().includes(q))
  }, [articles, query])

  if (open) return <Reader article={open} onBack={() => setOpen(null)} />

  if (loading) {
    return <p className="text-muted text-sm px-6 pt-8">Загрузка...</p>
  }

  return (
    <div className="animate-fade-in">
      <div className="relative mb-4">
        <Search size={16} className="text-faint absolute left-4 top-1/2 -translate-y-1/2" />
        <input
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Поиск статей"
          className="w-full bg-emerald/60 rounded-full pl-11 pr-4 py-3 text-[16px] text-cream placeholder-muted outline-none border border-transparent focus:border-gold/40 transition-colors"
        />
      </div>

      {list.length === 0 ? (
        articles.length === 0 ? (
          <EmptyState>
            <p className="text-muted text-sm">Статей пока нет — первая появится здесь</p>
          </EmptyState>
        ) : (
          <p className="text-faint text-sm text-center py-10">Ничего не найдено</p>
        )
      ) : (
        <div className="mx-stagger">
          {list.map(a => (
            <ArticleCard key={a.id} article={a} onOpen={setOpen} />
          ))}
        </div>
      )}
    </div>
  )
}
