import { ChevronLeft } from 'lucide-react'
import { platform } from '../platform'
import { useBackButton } from '../platform/telegram.hooks'
import { isTelegramBackMode } from '../lib/backButtonMode'
import { isDemoEmulationActive } from '../lib/demoChrome'

/** One navigation action: native Telegram control or the 43×43 web control. */
export default function ScreenBack({
  onBack,
  className = '',
  testId = 'back-button',
  registerSystemBack = true,
}) {
  useBackButton(() => {
    platform.haptic('light')
    onBack?.()
  }, registerSystemBack)

  /*
   * В Telegram и при эмуляции Telegram в demo-рамке круглая «назад»
   * не показывается: навигация идёт через системную кнопку / пилюлю.
   * Вне Telegram и без эмуляции — обычный веб-контроль. Как и
   * useFullscreenSurface, читаем атрибут demo-рамки во время рендера.
   */
  if (
    isDemoEmulationActive() ||
    isTelegramBackMode(typeof window === 'undefined' ? null : window.Telegram?.WebApp)
  ) {
    return null
  }

  return (
    <button
      type="button"
      data-testid={testId}
      aria-label="Назад"
      className={`mx-nested-screen-back ${className}`}
      onClick={() => {
        platform.haptic('light')
        onBack?.()
      }}
    >
      <ChevronLeft size={20} aria-hidden="true" />
    </button>
  )
}
