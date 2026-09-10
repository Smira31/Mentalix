import { Snowflake } from 'lucide-react'
import { tierForStreak } from '../lib/series'

function plural(n) {
  const mod10 = n % 10
  const mod100 = n % 100
  if (mod10 === 1 && mod100 !== 11) return 'день'
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return 'дня'
  return 'дней'
}

export default function StreakBar({
  streak = 0,
  freezes = 0,
  tone = 'gold',
  bump = false,
}) {
  const filled = Math.min(Math.max(0, streak), 7)
  const tier = tierForStreak(streak)

  const mark = tone === 'mint' ? 'bg-mint' : 'bg-gold'
  const label = tone === 'mint' ? 'text-cream' : 'text-gold'

  return (
    <span className="flex items-center gap-2.5 min-w-0">
      <span
        className={`flex items-end gap-[3px] shrink-0 ${bump ? 'animate-streak-bounce' : ''}`}
        aria-hidden="true"
      >
        {[0, 1, 2, 3, 4, 5, 6].map((day) => (
          <span
            key={day}
            className={`w-[2px] rounded-full transition-all duration-200 ${
              day < filled ? `h-[12px] ${mark}` : 'h-[7px] bg-cream/15'
            }`}
          />
        ))}
      </span>

      <span className={`text-[11px] tracking-wide truncate ${label}`}>
        {streak > 0 ? tier || `${streak} ${plural(streak)} подряд` : 'первый день'}
      </span>

      {freezes > 0 && (
        <span className="flex items-center gap-0.5 text-[11px] text-muted shrink-0">
          <Snowflake size={11} strokeWidth={2} aria-hidden="true" />
          {freezes}
        </span>
      )}
    </span>
  )
}
