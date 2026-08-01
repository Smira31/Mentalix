import { ChevronLeft } from 'lucide-react'
import { platform } from '../platform'
import { useBackButton } from '../lib/telegram'

/*
 * КНОПКА «НАЗАД»
 *
 * Внутри Telegram собственной кнопки нет вообще: экран включает
 * системную, и она заменяет «Закрыть» в шапке. Так работает вся
 * платформа, и человеку не приходится выбирать между двумя
 * кнопками, стоящими рядом и делающими разное.
 *
 * Вне Telegram — например, в браузере при отладке — системной
 * кнопки не существует, и тогда рисуется своя. Поэтому экраны
 * продолжают вставлять этот компонент как обычно и ни о чём не
 * думают: он сам решает, показаться или промолчать.
 */
export default function BackButton({
  onClick,
  label = 'Назад',
  className = '',
}) {
  useBackButton(() => {
    platform.haptic('light')
    onClick?.()
  })

  const systemAvailable =
    typeof window !== 'undefined'
    && Boolean(
      window.Telegram?.WebApp?.BackButton,
    )

  if (systemAvailable) return null

  return (
    <button
      type="button"
      onClick={() => {
        platform.haptic('light')
        onClick?.()
      }}
      className={[
        'flex items-center gap-2 rounded-full border border-cream/15 bg-emerald',
        'pl-2.5 pr-4 py-2 active:scale-95 transition-transform shrink-0',
        className,
      ].join(' ')}
    >
      <ChevronLeft
        size={17}
        className="text-cream/70"
      />

      <span className="text-[13px] font-semibold text-cream/70">
        {label}
      </span>
    </button>
  )
}
