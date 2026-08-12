import { Snowflake } from 'lucide-react'

/*
 * СТРИК
 *
 * Раньше это был эмодзи с цифрой: 🔥 12. Цветная картинка из
 * системного шрифта — единственное место в карточке, которое не
 * подчиняется ни одному нашему токену, и рядом с золотой линией
 * она выглядит наклейкой.
 *
 * Здесь та же цифра сказана языком мотивов: семь коротких засечек
 * — неделя, закрашено столько, сколько дней держится серия (не
 * больше семи), рядом словами сколько всего. Заморозки — отдельным
 * тихим значком, они не часть серии, а страховка.
 */

function plural(n) {
  const last = n % 10
  const teen = n % 100 >= 11 && n % 100 <= 14

  if (!teen && last === 1) return 'день'
  if (!teen && last >= 2 && last <= 4) return 'дня'

  return 'дней'
}

const ROMAN_VALUES = [
  [1000, 'M'], [900, 'CM'], [500, 'D'], [400, 'CD'],
  [100, 'C'], [90, 'XC'], [50, 'L'], [40, 'XL'],
  [10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I'],
]

function toRoman(n) {
  let remainder = n
  let result = ''

  for (const [value, symbol] of ROMAN_VALUES) {
    while (remainder >= value) {
      result += symbol
      remainder -= value
    }
  }

  return result
}

export default function StreakBar({
  streak = 0,
  freezes = 0,
  tone = 'gold',
  bump = false,
}) {
  const filled = Math.min(Math.max(streak, 0), 7)

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
        {streak > 0 ? `${toRoman(streak)} ${plural(streak)} подряд` : 'первый день'}
      </span>

      {freezes > 0 && (
        <span className="flex items-center gap-0.5 text-[11px] text-muted shrink-0">
          <Snowflake size={11} strokeWidth={2} />
          {freezes}
        </span>
      )}
    </span>
  )
}
