import BookLogo from './BookLogo'

/**
 * Экран ошибки восстановления сессии для standalone Safari / web.
 * Показывается, когда бэкенд недоступен (Render спит, нет сети, таймаут).
 * Не используется в Telegram Mini App — там requestAuth не бросает.
 */
export default function SessionRestoreError({ onRetry }) {
  return (
    <div
      className="
        min-h-screen
        bg-emerald-deep
        text-cream
        flex
        flex-col
        items-center
        justify-center
        font-body
        px-6
        text-center
      "
    >
      <BookLogo size={132} className="text-gold" />

      <p
        className="
          text-[15px]
          text-muted
          mt-7
          max-w-xs
          leading-relaxed
        "
      >
        Не удалось связаться с сервером.
        <br />
        Проверь подключение и попробуй снова.
      </p>

      <button
        type="button"
        data-testid="session-retry-button"
        onClick={onRetry}
        className="
          mt-8
          px-8
          py-3
          rounded-full
          bg-gold
          text-emerald-deep
          font-semibold
          text-[15px]
          active:opacity-80
          transition-opacity
        "
      >
        Повторить
      </button>
    </div>
  )
}
