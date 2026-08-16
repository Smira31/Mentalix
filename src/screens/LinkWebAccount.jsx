import { Globe } from 'lucide-react'
import { platform } from '../platform'
import BackButton from '../components/BackButton'

const BOT_LINK_DEEPLINK = 'https://t.me/Mentalix_club_bot?start=link_web'

export default function LinkWebAccount({ onBack }) {
  function openBot() {
    platform.haptic('light')
    if (window.Telegram?.WebApp?.openTelegramLink) {
      window.Telegram.WebApp.openTelegramLink(BOT_LINK_DEEPLINK)
    } else {
      window.open(BOT_LINK_DEEPLINK, '_blank')
    }
  }

  return (
    <div className="w-full max-w-md px-4 pt-2 pb-28 flex flex-col items-center">
      <div className="w-full grid grid-cols-[1fr_auto_1fr] items-center min-h-[42px] mb-6">
        <div className="justify-self-start">
          <BackButton onClick={onBack} />
        </div>
        <h1 className="font-display text-xl text-cream">Связать с сайтом</h1>
        <span aria-hidden="true" />
      </div>

      <div className="w-16 h-16 rounded-full bg-mint/20 flex items-center justify-center mb-4">
        <Globe size={26} className="text-mint" />
      </div>

      <p className="text-sm text-muted text-center mb-8 px-4 leading-relaxed">
        Код теперь приходит только в личку от бота — так его нельзя перехватить.
        Открой чат с ботом, там появится код. Затем открой mentalix.vercel.app в
        браузере, войди по email и введи этот код, когда попросят.
      </p>

      <button
        onClick={openBot}
        className="w-full py-3.5 rounded-2xl bg-gold text-emerald-deep text-sm font-medium active:scale-95 transition-transform"
      >
        Получить код у бота
      </button>
    </div>
  )
}
