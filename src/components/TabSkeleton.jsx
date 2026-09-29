/*
 * Монохромный скелетон-заглушка для вкладок — показывается в Suspense
 * пока грузится чанк экрана. Повторяет общую структуру типичной вкладки:
 * заголовок, карточка-герой, строки-пиллы. Без акцентных цветов — только
 * cream-полупрозрачность на тёмном фоне, как в HistorySkeleton.
 */
function TabSkeleton() {
  return (
    <div
      className="w-full max-w-md px-[var(--mx-screen-x)] pt-6 space-y-5"
      role="status"
      aria-label="Загрузка вкладки"
    >
      {/* Заголовок */}
      <div className="h-6 w-40 rounded-full bg-cream/10 animate-pulse" />

      {/* Карточка-герой */}
      <div className="w-full rounded-3xl bg-emerald p-5 space-y-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-cream/10 animate-pulse" />
          <div className="space-y-2 flex-1">
            <div className="h-3.5 w-3/4 rounded-full bg-cream/10 animate-pulse" />
            <div className="h-3 w-1/2 rounded-full bg-cream/10 animate-pulse" />
          </div>
        </div>
        <div className="h-3.5 w-full rounded-full bg-cream/10 animate-pulse" />
        <div className="h-3.5 w-4/5 rounded-full bg-cream/10 animate-pulse" />
      </div>

      {/* Пиллы */}
      <div className="flex gap-2">
        <div className="h-8 w-24 rounded-full bg-cream/10 animate-pulse" />
        <div className="h-8 w-20 rounded-full bg-cream/10 animate-pulse" />
        <div className="h-8 w-16 rounded-full bg-cream/10 animate-pulse" />
      </div>

      {/* Карточки поменьше */}
      <div className="space-y-3">
        <div className="w-full rounded-3xl bg-emerald p-4 space-y-3">
          <div className="h-4 w-28 rounded-full bg-cream/10 animate-pulse" />
          <div className="h-3.5 w-full rounded-full bg-cream/10 animate-pulse" />
          <div className="h-3.5 w-2/3 rounded-full bg-cream/10 animate-pulse" />
        </div>
        <div className="w-full rounded-3xl bg-emerald p-4 space-y-3">
          <div className="h-4 w-32 rounded-full bg-cream/10 animate-pulse" />
          <div className="h-3.5 w-full rounded-full bg-cream/10 animate-pulse" />
          <div className="h-3.5 w-3/5 rounded-full bg-cream/10 animate-pulse" />
        </div>
      </div>
    </div>
  )
}

export default TabSkeleton
