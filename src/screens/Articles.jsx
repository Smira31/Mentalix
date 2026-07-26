import { useMemo, useState } from 'react'
import { platform } from '../platform'
import { Search, ChevronLeft, ChevronRight, ExternalLink } from 'lucide-react'
import { ARTICLES } from '../data/articles'

// Радиусы: rounded-3xl (24) — карточка, rounded-full — поиск и метки.

function formatDate(iso) {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  return d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' })
}

function ArticleCard({ article, onOpen }) {
  return (
    <button
      onClick={() => { platform.haptic('light'); onOpen(article) }}
      className="w-full rounded-3xl bg-emerald p-4 mb-3 text-left border-0 transition-transform active:scale-[0.99]"
    >
      <div className="font-display text-[17px] text-cream leading-tight">{article.title}</div>
      <p className="text-[13px] text-cream/45 leading-snug mt-2 line-clamp-2">{article.excerpt}</p>

      <div className="flex items-center gap-2 mt-3 pt-3 border-t border-cream/8">
        <span className="text-[11px] text-gold">{article.minutes} мин чтения</span>
        <span className="text-[11px] text-cream/25">·</span>
        <span className="text-[11px] text-cream/35">{formatDate(article.date)}</span>
        {article.tag && (
          <span className="text-[10px] text-cream/40 bg-cream/5 rounded-full px-2 py-0.5 ml-auto">
            {article.tag}
          </span>
        )}
        <ChevronRight size={16} className={`text-cream/25 shrink-0 ${article.tag ? '' : 'ml-auto'}`} />
      </div>
    </button>
  )
}

function Reader({ article, onBack }) {
  const paragraphs = String(article.body || '').split(/\n\s*\n/).filter(Boolean)

  return (
    <div className="w-full max-w-md px-5 pb-40 animate-fade-in">
      <button
        onClick={() => { platform.haptic('light'); onBack() }}
        aria-label="Назад"
        className="w-10 h-10 rounded-full bg-emerald flex items-center justify-center mt-4 mb-5 border-0 active:scale-95 transition-transform"
      >
        <ChevronLeft size={20} className="text-cream/60" />
      </button>

      <h1 className="font-display text-[26px] text-cream leading-tight">{article.title}</h1>

      <div className="flex items-center gap-2 mt-3 mb-6">
        <span className="text-[11px] text-gold">{article.minutes} мин чтения</span>
        <span className="text-[11px] text-cream/25">·</span>
        <span className="text-[11px] text-cream/35">{formatDate(article.date)}</span>
      </div>

      <div className="space-y-4">
        {paragraphs.map((p, i) => (
          <p key={i} className="text-[15px] text-cream/75 leading-relaxed">{p}</p>
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
          <span className="text-[13px] text-cream/60">Первоисточник</span>
        </a>
      )}
    </div>
  )
}

export default function Articles() {
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(null)

  const list = useMemo(() => {
    const sorted = [...ARTICLES].sort((a, b) => String(b.date).localeCompare(String(a.date)))
    const q = query.trim().toLowerCase()
    if (!q) return sorted
    return sorted.filter((a) =>
      `${a.title} ${a.excerpt} ${a.tag || ''}`.toLowerCase().includes(q)
    )
  }, [query])

  if (open) return <Reader article={open} onBack={() => setOpen(null)} />

  return (
    <div className="animate-fade-in">
      <div className="relative mb-4">
        <Search size={16} className="text-cream/30 absolute left-4 top-1/2 -translate-y-1/2" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Поиск статей"
          className="w-full bg-emerald/60 rounded-full pl-11 pr-4 py-3 text-sm text-cream placeholder-cream/30 outline-none border border-transparent focus:border-gold/40 transition-colors"
        />
      </div>

      {list.length === 0 ? (
        <p className="text-cream/35 text-sm text-center py-10">
          {ARTICLES.length === 0
            ? 'Статей пока нет — первая появится здесь'
            : 'Ничего не найдено'}
        </p>
      ) : (
        <div className="mx-stagger">
          {list.map((a) => (
            <ArticleCard key={a.id} article={a} onOpen={setOpen} />
          ))}
        </div>
      )}
    </div>
  )
}
