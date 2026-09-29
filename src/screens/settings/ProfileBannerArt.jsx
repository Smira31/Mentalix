// src/screens/settings/ProfileBannerArt.jsx
//
// Рисунки трёх баннеров профиля — свои SVG в стиле Stoic (решение владельца,
// PR #929): без демонов-персонажей, простые формы из токенов карточек.
// Размеры заданы в CSS (ProfileBanners.css), здесь только форма:
//   • PotentialLockArt — открытый навесной замок;
//   • SupportGiftArt — лента-«коробка» с бантом;
//   • ProfileFeatherArt — перо с петлёй.
// aria-hidden: рядом есть текст, рисунок декоративный.

export function PotentialLockArt() {
  return (
    <svg
      className="mx-profile-banner__art mx-profile-banner__art--lock"
      viewBox="0 0 110 150"
      aria-hidden="true"
      focusable="false"
    >
      {/* Дужка открыта: правое плечо уходит в корпус, левое приподнято. */}
      <path
        d="M 76 82 V 46 C 76 28 64 18 50 18 C 36 18 25 28 25 40 V 48"
        fill="none"
        stroke="#444444"
        strokeWidth="5"
        strokeLinecap="round"
      />
      {/* Корпус — плоская заливка. */}
      <rect x="15" y="78" width="80" height="62" rx="14" fill="#444444" />
      {/* Скважина: тёмный круг + черта. */}
      <circle cx="55" cy="102" r="8" fill="#141414" />
      <rect x="52" y="106" width="6" height="20" rx="3" fill="#141414" />
    </svg>
  )
}

export function SupportGiftArt() {
  return (
    <svg
      className="mx-profile-banner__art mx-profile-banner__art--gift"
      viewBox="0 0 89 117"
      aria-hidden="true"
      focusable="false"
    >
      {/* Вертикальная и горизонтальная ленты через всю полосу. */}
      <line x1="44.5" y1="0" x2="44.5" y2="117" stroke="#FFFFFF" strokeWidth="2" />
      <line x1="0" y1="58.5" x2="89" y2="58.5" stroke="#FFFFFF" strokeWidth="2" />
      {/* Бант на пересечении: две петли. */}
      <path d="M 44.5 58 C 38 48 24 50 27 58 C 29 64 40 62 44.5 58 Z" fill="#FFFFFF" />
      <path d="M 44.5 58 C 51 48 65 50 62 58 C 60 64 49 62 44.5 58 Z" fill="#FFFFFF" />
      {/* …и два хвоста. */}
      <path d="M 42 60 L 34 74" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" />
      <path d="M 47 60 L 55 74" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}

export function ProfileFeatherArt() {
  return (
    <svg
      className="mx-profile-banner__art mx-profile-banner__art--feather"
      viewBox="0 0 230 150"
      aria-hidden="true"
      focusable="false"
    >
      {/* Лист пера — светло-серая заливка. */}
      <path d="M 30 128 C 62 96 122 52 172 22 C 152 76 92 116 30 128 Z" fill="#D0D0D0" />
      {/* Тёмные прожилки. */}
      <path d="M 32 126 L 168 24" stroke="#141414" strokeWidth="2" fill="none" />
      <path
        d="M 62 100 L 44 84 M 96 74 L 78 58 M 130 49 L 112 34"
        stroke="#141414"
        strokeWidth="2"
        strokeLinecap="round"
      />
      {/* От кончика — линия с одной петлёй, уходит за правый край. */}
      <path
        d="M 30 128 C 22 136 16 146 24 149 C 30 151 34 144 28 139 C 22 134 60 122 120 108 C 160 98 195 90 225 80"
        fill="none"
        stroke="#D0D0D0"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  )
}
