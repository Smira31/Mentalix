/*
 * Скелетон ленты «История» — держит форму экрана, пока грузится
 * объединённая лента (checkin + activity + journal). Повторяет
 * структуру карточки дня: строка даты + карточка с пилюлей
 * настроения и строками текста, чтобы не было прыжка вёрстки.
 */
function DayCardSkeleton() {
  return (
    <div data-testid="history-skeleton-day" aria-hidden="true">
      <div className="h-4 w-16 rounded-full bg-cream/10 animate-pulse mb-2 px-1" />
      <div className="w-full rounded-3xl bg-emerald p-5 space-y-3">
        <div className="flex items-center gap-2">
          <div className="h-6 w-20 rounded-full bg-gold/15 animate-pulse" />
          <div className="h-6 w-16 rounded-full bg-cream/10 animate-pulse" />
        </div>
        <div className="h-3.5 w-full rounded-full bg-cream/10 animate-pulse" />
        <div className="h-3.5 w-4/5 rounded-full bg-cream/10 animate-pulse" />
        <div className="h-3.5 w-3/5 rounded-full bg-cream/10 animate-pulse" />
      </div>
    </div>
  )
}

export default function HistorySkeleton({ days = 3 }) {
  return (
    <div
      className="space-y-5 mt-1"
      data-testid="history-skeleton"
      role="status"
      aria-label="Загрузка истории"
    >
      <h1 className="font-display mx-type-page text-cream lowercase">история.</h1>
      <div className="space-y-5">
        {Array.from({ length: days }, (_, index) => (
          <DayCardSkeleton key={index} />
        ))}
      </div>
    </div>
  )
}
