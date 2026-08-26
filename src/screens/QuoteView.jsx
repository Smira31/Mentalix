import { useEffect, useMemo, useState, useRef } from 'react'
import { createPortal } from 'react-dom'
import { platform } from '../platform'
import { api } from '../lib/api'
import { MotifArt } from '../components/Motif'
import BackButton from '../components/BackButton'
import {
  useFullscreenSurface,
  FULLSCREEN_SHELL_CLASS,
  FULLSCREEN_HEADER_SLOT_CLASS,
  FULLSCREEN_SCROLL_CLASS,
} from '../lib/fullscreenSurface'
import { ChevronLeft, ChevronRight, Share2 } from 'lucide-react'

/*
 * Полноэкранные цитаты: свайп вверх-вниз, стрелки, «поделиться».
 *
 * Экран живёт по общему fullscreen-контракту — портал в body и
 * высота из visualViewport. Своё `position: fixed` здесь не
 * работало: Today рендерит этот экран внутри контейнера App, у
 * которого от анимации остался transform, и «во весь экран»
 * означало «во весь контейнер».
 *
 * Своей кнопки закрытия больше нет: её роль исполняет системная
 * «Назад» Telegram, как и на всех остальных экранах.
 */

export default function QuoteView({ user, todayQuote, onClose }) {
  const { style: surfaceStyle } = useFullscreenSurface()

  const todayEntry = useMemo(() => {
    if (typeof todayQuote === 'string') return { id: 'today', text: todayQuote }
    return todayQuote ? { id: 'today', ...todayQuote } : null
  }, [todayQuote])

  const [quotes, setQuotes] = useState(todayEntry ? [todayEntry] : [])
  const [idx, setIdx] = useState(0)
  const touchY = useRef(null)

  useEffect(() => {
    if (!user) return
    api.quotes
      .list(user.id)
      .then(list => {
        const rest = (list || []).filter(q => q.text !== todayEntry?.text)
        setQuotes(todayEntry ? [todayEntry, ...rest] : rest)
      })
      .catch(console.error)
  }, [user, todayEntry])

  function go(delta) {
    if (quotes.length === 0) return
    platform.haptic('light')
    setIdx(i => (i + delta + quotes.length) % quotes.length)
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
      } catch {
        // Telegram-ссылка недоступна вне Telegram-клиента — падаем на navigator.share ниже
      }
    }
    if (navigator.share) {
      navigator.share({ text }).catch(() => {})
    } else {
      navigator.clipboard?.writeText(text)
    }
  }

  // свайп вверх/вниз — следующая/предыдущая
  function onTouchStart(e) {
    touchY.current = e.touches[0].clientY
  }
  function onTouchEnd(e) {
    if (touchY.current === null) return
    const dy = e.changedTouches[0].clientY - touchY.current
    if (dy < -50) go(1)
    else if (dy > 50) go(-1)
    touchY.current = null
  }

  const current = quotes[idx]

  return createPortal(
    <div
      className={FULLSCREEN_SHELL_CLASS}
      style={surfaceStyle}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      <div className={`${FULLSCREEN_HEADER_SLOT_CLASS} flex items-center gap-3 px-5`}>
        <BackButton onClick={onClose} />

        <span className="text-[12px] text-faint font-semibold ml-auto">
          {quotes.length > 0 ? `${idx + 1} / ${quotes.length}` : ''}
        </span>
      </div>

      <div
        key={idx}
        className={`${FULLSCREEN_SCROLL_CLASS} items-center justify-center px-8 text-center animate-fade-in`}
      >
        {current ? (
          <>
            <span className="font-display text-[40px] text-gold leading-none mb-6">«</span>
            <p className="font-display text-[24px] text-cream leading-snug max-w-md">
              {current.text}
            </p>
            {(current.attribution || current.tag) && (
              <span className="text-[12px] font-semibold text-faint mt-5">
                {current.attribution || current.tag}
              </span>
            )}

            {current.prompt && (
              <div className="w-full max-w-sm mt-8 text-left rounded-3xl bg-emerald px-5 py-4">
                <span className="block text-[11px] uppercase tracking-[0.14em] text-gold font-semibold mb-2">
                  вопрос к себе
                </span>
                <p className="text-[14px] text-cream leading-relaxed">{current.prompt}</p>
                <p className="text-[13px] text-muted leading-relaxed mt-3">
                  <strong className="text-cream">Шаг:</strong> {current.action}
                </p>
                <p className="text-[13px] text-muted leading-relaxed mt-2">
                  <strong className="text-cream">Дальше:</strong> {current.nextStep}
                </p>
              </div>
            )}
          </>
        ) : (
          <>
            <MotifArt name="shozhdenie" size={130} className="mx-auto mb-6" />
            <p className="text-[15px] text-muted leading-relaxed">
              Здесь будут твои цитаты.
              <br />
              Добавляй мысли, которые держат, — в настройках считки дня.
            </p>
          </>
        )}
      </div>

      <div className="flex items-center justify-center gap-4 shrink-0 pt-4 pb-7">
        <button
          onClick={() => go(-1)}
          aria-label="Предыдущая"
          className="w-12 h-12 rounded-full bg-emerald flex items-center justify-center active:scale-95 transition-transform border-0"
        >
          <ChevronLeft size={20} className="text-muted" />
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
          <ChevronRight size={20} className="text-muted" />
        </button>
      </div>
    </div>,
    document.body
  )
}
