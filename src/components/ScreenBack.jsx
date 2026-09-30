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
   * В настоящем Telegram круглая «назад» не показывается: навигация идёт
   * через системную кнопку. В demo-рамке с эмуляцией Telegram видимой
   * остаётся только пилюля «‹ Назад»; сама кнопка остаётся в DOM
   * (невидимая, вне потока) — тот же обработчик, тот же testid,
   * доступна автотестам и вспомогательным технологиям.
   */
  if (isTelegramBackMode(typeof window === 'undefined' ? null : window.Telegram?.WebApp)) {
    return null
  }

  const demoHidden = isDemoEmulationActive()

  return (
    <button
      type="button"
      data-testid={testId}
      aria-label="Назад"
      className={`mx-nested-screen-back ${demoHidden ? 'mx-nested-screen-back--demo-hidden' : ''} ${className}`}
      onClick={() => {
        platform.haptic('light')
        onBack?.()
      }}
    >
      <ChevronLeft size={20} aria-hidden="true" />
    </button>
  )
}
