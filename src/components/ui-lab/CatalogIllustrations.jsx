// TODO: черновая иллюстрация для превью, финальную нарисует владелец продукта — не менять сюжет при следующих правках без запроса.
export function RailIllustration({ variant }) {
  if (variant === 'lilu') {
    return (
      <svg width="24" height="24" viewBox="0 0 40 40" aria-hidden="true">
        <path d="M20 6 L28 16 L20 34 L12 16 Z" fill="#E6E6E6" opacity="0.85" />
        <path d="M12 16 L28 16" stroke="#0d0d0d" strokeWidth="1" />
        <circle cx="26" cy="12" r="2" fill="#EDBD60" />
      </svg>
    )
  }

  return (
    <svg width="24" height="24" viewBox="0 0 40 40" aria-hidden="true">
      <path
        d="M8 16 C12 12 16 12 20 16 C24 20 28 20 32 16"
        stroke="#E6E6E6"
        strokeWidth="1.5"
        fill="none"
        opacity="0.8"
        strokeLinecap="round"
      />
      <path
        d="M8 24 C12 20 16 20 20 24 C24 28 28 28 32 24"
        stroke="#E6E6E6"
        strokeWidth="1.5"
        fill="none"
        opacity="0.5"
        strokeLinecap="round"
      />
      <circle cx="30" cy="14" r="2" fill="#EDBD60" />
    </svg>
  )
}

// TODO: черновая иллюстрация для превью, финальную нарисует владелец продукта — не менять сюжет при следующих правках без запроса.
export function CollectionIllustration({ variant }) {
  if (variant === 'boundaries') {
    return (
      <svg width="80" height="80" viewBox="0 0 100 100" aria-hidden="true">
        <rect
          x="26"
          y="20"
          width="48"
          height="60"
          rx="2"
          fill="none"
          stroke="#E6E6E6"
          strokeWidth="2"
          opacity="0.85"
        />
        <line x1="50" y1="20" x2="50" y2="80" stroke="#E6E6E6" strokeWidth="1.5" opacity="0.5" />
        <circle cx="50" cy="50" r="3" fill="#EDBD60" />
      </svg>
    )
  }

  if (variant === 'rituals') {
    return (
      <svg width="80" height="80" viewBox="0 0 100 100" aria-hidden="true">
        <circle
          cx="50"
          cy="50"
          r="30"
          fill="none"
          stroke="#E6E6E6"
          strokeWidth="1.5"
          opacity="0.5"
        />
        <circle
          cx="50"
          cy="50"
          r="19"
          fill="none"
          stroke="#E6E6E6"
          strokeWidth="1.5"
          opacity="0.7"
        />
        <circle cx="50" cy="50" r="8" fill="#E6E6E6" opacity="0.85" />
        <circle cx="50" cy="50" r="2.5" fill="#EDBD60" />
      </svg>
    )
  }

  if (variant === 'guilt-free') {
    return (
      <svg width="80" height="80" viewBox="0 0 100 100" aria-hidden="true">
        <path
          d="M30 78 C30 60 36 40 46 26 C50 20 58 16 66 18"
          fill="none"
          stroke="#E6E6E6"
          strokeWidth="1.5"
          opacity="0.7"
          strokeLinecap="round"
        />
        <path
          d="M44 30 C50 26 58 26 64 20"
          fill="none"
          stroke="#E6E6E6"
          strokeWidth="1.5"
          opacity="0.5"
          strokeLinecap="round"
        />
        <circle cx="66" cy="18" r="3" fill="#EDBD60" />
      </svg>
    )
  }

  if (variant === 'finish') {
    return (
      <svg width="80" height="80" viewBox="0 0 100 100" aria-hidden="true">
        <path
          d="M25 60 A25 25 0 1 1 65 76"
          fill="none"
          stroke="#E6E6E6"
          strokeWidth="2"
          opacity="0.75"
          strokeLinecap="round"
        />
        <circle cx="65" cy="76" r="4" fill="#EDBD60" />
      </svg>
    )
  }

  return (
    <svg width="80" height="80" viewBox="0 0 100 100" aria-hidden="true">
      <circle cx="30" cy="70" r="3" fill="#E6E6E6" opacity="0.6" />
      <path
        d="M30 70 C42 66 50 54 58 34"
        fill="none"
        stroke="#E6E6E6"
        strokeWidth="1.5"
        opacity="0.6"
        strokeLinecap="round"
        strokeDasharray="1 7"
      />
      <circle cx="58" cy="34" r="3.5" fill="#EDBD60" />
    </svg>
  )
}

export const COLLECTION_ILLUSTRATIONS = [
  'boundaries',
  'rituals',
  'guilt-free',
  'finish',
  'first-step',
]
