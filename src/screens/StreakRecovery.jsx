import { createPortal } from 'react-dom'
import { Flame, X } from 'lucide-react'
import {
  FULLSCREEN_HEADER_SLOT_CLASS,
  FULLSCREEN_SCROLL_CLASS,
  FULLSCREEN_SHELL_CLASS,
  getFullscreenPortalTarget,
  useFullscreenSurface,
} from '../lib/fullscreenSurface'

export function streakDaysLabel(count) {
  const n = Math.abs(Number(count))
  const word = n % 10 === 1 && n % 100 !== 11
    ? 'день'
    : n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 12 || n % 100 > 14)
      ? 'дня'
      : 'дней'
  return `${count} ${word}`
}

export function yesterdayLabel(date) {
  const [year, month, day] = date.split('-').map(Number)
  return `Вчера, ${new Date(year, month - 1, day).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })}`
}

export default function StreakRecovery({ recovery, stage = 'offer', onDismiss, onStart, onClose }) {
  const { style } = useFullscreenSurface()
  const saved = stage === 'saved'
  const expired = stage === 'expired'

  return createPortal(
    <div className={FULLSCREEN_SHELL_CLASS} style={style} data-testid="streak-recovery-surface">
      <header className={`${FULLSCREEN_HEADER_SLOT_CLASS} flex items-center justify-end px-[var(--mx-screen-x)]`}>
        <button
          type="button"
          onClick={saved || expired ? onClose : onDismiss}
          data-testid="streak-recovery-close"
          aria-label="Закрыть"
          className="flex h-11 w-11 items-center justify-center rounded-full text-cream"
        >
          <X size={22} aria-hidden="true" />
        </button>
      </header>
      <div className={FULLSCREEN_SCROLL_CLASS}>
        <div className="m-auto flex min-h-full w-full max-w-md flex-col items-center px-[var(--mx-screen-x)] py-6 text-center">
          <div className="flex flex-1 flex-col items-center justify-center">
            <span className="mb-7 flex h-20 w-20 items-center justify-center rounded-full border border-[rgb(var(--c-border))] text-gold">
              <Flame size={36} strokeWidth={1.7} aria-hidden="true" />
            </span>
            {!saved && !expired && (
              <p className="mb-4 text-[12px] font-bold uppercase tracking-widest text-muted">
                ВЕРНИ СЕРИЮ: {streakDaysLabel(recovery.streak_before).toUpperCase()}
              </p>
            )}
            <h1 className="font-display text-[30px] font-bold leading-tight text-cream" data-testid="streak-recovery-title">
              {saved
                ? `Серия спасена: ${streakDaysLabel(recovery.streak_before + 1)}`
                : expired
                  ? 'Вчерашний день уже нельзя вернуть'
                  : 'Серия прервалась… но её можно вернуть!'}
            </h1>
            {!saved && !expired && (
              <p className="mt-5 max-w-xs text-[15px] leading-relaxed text-muted">
                Заполни вчерашний вечерний разбор — и серия продолжится сама.
              </p>
            )}
          </div>
          <div className="w-full pb-5">
            <button
              type="button"
              data-testid={saved || expired ? 'streak-recovery-finish' : 'streak-recovery-start'}
              onClick={saved || expired ? onClose : onStart}
              className="cta-pill mx-type-control min-h-12 w-full rounded-full"
            >
              {saved || expired ? 'Вернуться в Сегодня' : 'Вернуть серию'}
            </button>
            {!saved && !expired && (
              <button
                type="button"
                data-testid="streak-recovery-dismiss"
                onClick={onDismiss}
                className="mt-4 min-h-11 w-full text-[14px] font-semibold text-muted"
              >
                Мне не важны серии
              </button>
            )}
          </div>
        </div>
      </div>
    </div>,
    getFullscreenPortalTarget()
  )
}
