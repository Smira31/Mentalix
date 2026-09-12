function hasTelegramContext() {
  return typeof window !== 'undefined' && Boolean(window.Telegram?.WebApp?.initData)
}

export default function WebAuthScreen() {
  const directWebVisit = !hasTelegramContext()

  return (
    <main
      className="w-full max-w-md px-5 flex flex-col items-center pt-16 pb-10"
      aria-labelledby="web-auth-title"
    >
      <div
        className="w-14 h-14 rounded-full border border-gold flex items-center justify-center mb-6"
        aria-hidden="true"
      >
        <span className="font-display text-[18px] text-gold">M</span>
      </div>

      {directWebVisit ? (
        <section
          className="w-full rounded-2xl border border-gold/30 bg-gold/[0.06] px-4 py-4 mb-6"
          aria-labelledby="telegram-guidance-title"
        >
          <h1
            id="telegram-guidance-title"
            className="font-display text-[22px] text-cream mb-2 text-center"
          >
            Вход через браузер скоро появится
          </h1>
          <p className="text-[13px] text-muted text-center leading-relaxed">
            Сейчас вход в Mentalix доступен только через Telegram Mini App. Открой приложение в
            Telegram — там уже доступен твой Telegram-контекст.
          </p>
        </section>
      ) : (
        <h1 id="web-auth-title" className="font-display text-[22px] text-cream mb-2 text-center">
          Вход в Mentalix скоро появится
        </h1>
      )}
    </main>
  )
}
