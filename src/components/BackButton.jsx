import { ChevronLeft } from 'lucide-react'
import { platform, platformName } from '../platform'
import { useBackButton } from '../platform/telegram.hooks'

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
 *
 * Раньше решение принималось по Boolean(window.Telegram?.WebApp
 * ?.BackButton) — но этот объект существует всегда: его создаёт
 * сам @twa-dev/sdk (node_modules/@twa-dev/sdk/dist/telegram-web-
 * apps.js), даже вне Telegram, просто у него нет версии клиента
 * (`versionAtLeast('6.1')`), поэтому show()/onClick() внутри
 * молча предупреждают в консоль и ничего не делают. Проверка
 * всегда была true — кнопка не рисовалась нигде в вебе. Решение
 * должно опираться на platformName (реальный признак запуска
 * внутри Telegram, `telegram.adapter.js`), как и остальной
 * платформенный слой.
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

  if (platformName === 'telegram') return null

  return (
    <button
      type="button"
      aria-label={label}
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
        className="text-muted"
      />

      <span className="text-[13px] font-semibold text-muted">
        {label}
      </span>
    </button>
  )
}
