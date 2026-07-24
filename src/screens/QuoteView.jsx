import { useEffect, useRef, useState } from 'react'
import { platform } from '../platform'
import { api } from '../lib/api'
import { X, ChevronLeft, ChevronRight, Share2 } from 'lucide-react'

// ── Полноэкранные цитаты, как quotes. у stoic.: свайп/стрелки, поделиться ──

export default function QuoteView({ user, todayQuote, onClose }) {
  const [quotes, setQuotes] = useState(todayQuote ? [{ id: 'today', text: todayQuote }] : [])
  const [idx, setIdx] = useState(0)
  const touchY = useRef(null)

  useEffect(() => {
    if (!user) return
    api.quotes
      .list(user.id)
      .then((list) => {
        const rest = (list || []).filter((q) => q.text !== todayQuote)
        setQuotes(todayQuote ? [{ id: 'today', text: todayQuote }, ...rest] : rest)
      })
      .catch(console.error)
  }, [user, todayQuote])

  function go(delta) {
    if (quotes.length === 0) return
    platform.haptic('light')
    setIdx((i) => (i + delta + quotes.length) % quotes.length)
  }

  function share() {
    platform.haptic('light')
    const text = `«${quotes[idx].text}»\n\n— из моего Mentalix`
    if (platform.name === 'telegram') {
      try {
        // шеринг в чаты Telegram
        window.Telegram?.WebApp?.openTelegramLink?.(
          `https://t.me/share/url?url=${encodeURIComponent('https://t.me/Mentalix_club_bot/app')}&text=${encodeURIComponent(text)}`
        )
        return
      } catch {}
    }
    if (navigator.share) {
      navigator.share({ text }).catch(() => {})
    } else {
      navigator.clipboard?.writeText(text)
    }
  }

  // свайп вверх/вниз — следующая/предыдущая
  function onTouchStart(e) { touchY.current = e.touches[0].clientY }
  function onTouchEnd(e) {
    if (touchY.current === null) return
    const dy = e.changedTouches[0].clientY - touchY.current
    if (dy < -50) go(1)
    else if (dy > 50) go(-1)
    touchY.current = null
  }

  const current = quotes[idx]

  return (
    <div
      className="fixed inset-0 z-[60] bg-emerald-deep flex flex-col animate-fade-in"
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      <div className="flex items-center justify-between px-5 pt-5">
        <span className="text-[12px] text-cream/35 font-semibold">
          {quotes.length > 0 ? `${idx + 1} / ${quotes.length}` : ''}
        </span>
        <button
          onClick={() => { platform.haptic('light'); onClose() }}
          aria-label="Закрыть"
          className="w-10 h-10 rounded-full bg-emerald flex items-center justify-center active:scale-95 transition-transform border-0"
        >
          <X size={18} className="text-cream/60" />
        </button>
      </div>

      <div key={idx} className="flex-1 flex flex-col items-center justify-center px-8 text-center animate-fade-in">
        {current ? (
          <>
            <span className="font-display text-[40px] text-gold leading-none mb-6">«</span>
            <p className="font-display text-[24px] text-cream leading-snug max-w-md">{current.text}</p>
            {current.tag && (
              <span className="text-[12px] font-semibold text-cream/35 mt-5">{current.tag}</span>
            )}
          </>
        ) : (
          <p className="text-[15px] text-cream/45 leading-relaxed">
            Здесь будут твои цитаты.
            <br />Добавляй мысли, которые держат, — в настройках считки дня.
          </p>
        )}
      </div>

      <div className="flex items-center justify-center gap-4 pb-[calc(env(safe-area-inset-bottom)+28px)]">
        <button
          onClick={() => go(-1)}
          aria-label="Предыдущая"
          className="w-12 h-12 rounded-full bg-emerald flex items-center justify-center active:scale-95 transition-transform border-0"
        >
          <ChevronLeft size={20} className="text-cream/60" />
        </button>
        <button
          onClick={share}
          className="cta-pill text-[15px] px-8 py-3.5 flex items-center gap-2"
        >
          <Share2 size={16} /> Поделиться
        </button>
        <button
          onClick={() => go(1)}
          aria-label="Следующая"
          className="w-12 h-12 rounded-full bg-emerald flex items-center justify-center active:scale-95 transition-transform border-0"
        >
          <ChevronRight size={20} className="text-cream/60" />
        </button>
      </div>
    </div>
  )
}
