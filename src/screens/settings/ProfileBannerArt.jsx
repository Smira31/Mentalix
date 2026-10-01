// src/screens/settings/ProfileBannerArt.jsx
//
// Рисунки трёх баннеров профиля — свои SVG в стиле Stoic (решение владельца,
// PR #929): без демонов-персонажей, простые формы из токенов карточек.
// Координаты в pt от верхнего левого угла карточки (440 pt), на 393 —
// привязка к правому краю, те же отступы.
//   • PotentialLockArt — открытый навесной замок (справа, обрезан снизу);
//   • SupportGiftArt — лента-«коробка» с бантом;
//   • ProfileFeatherArt — перо с петлёй (справа сверху, обрезано сверху).
// aria-hidden: рядом есть текст, рисунок декоративный.

export function PotentialLockArt() {
  // Замок справа внизу, обрезан нижним краем карточки.
  // viewBox в абсолютных координатах карточки (440 pt), 128×172 pt.
  return (
    <svg
      className="mx-profile-banner__art mx-profile-banner__art--lock"
      viewBox="280 55 128 172"
      width="128"
      height="172"
      aria-hidden="true"
      focusable="false"
    >
      <path
        d="M306 108 L312 86 C318 66 340 60 356 63 C373 67 385 80 384 100 L379 146"
        fill="none"
        stroke="#3a3a3a"
        strokeWidth="5"
        strokeLinecap="round"
      />
      <g transform="translate(330 178) rotate(14) translate(-50 -45)">
        <path d="M0 0 H100 V45 A50 50 0 0 1 0 45 Z" fill="#444" />
        <circle cx="50" cy="42" r="8" fill="#161616" />
        <line
          x1="50"
          y1="46"
          x2="50"
          y2="64"
          stroke="#161616"
          strokeWidth="5"
          strokeLinecap="round"
        />
      </g>
    </svg>
  )
}

export function SupportGiftArt() {
  // Полоса 89 pt: горизонтальная линия на y 45, вертикальная — по центру
  // через всю высоту. Две петли общей шириной 49 pt, высотой 20 pt над
  // пересечением; два хвоста вниз-в-стороны, разлёт 38 pt. Линии белые 2 pt.
  return (
    <svg
      className="mx-profile-banner__art mx-profile-banner__art--gift"
      viewBox="0 0 89 117"
      aria-hidden="true"
      focusable="false"
    >
      {/* Вертикальная и горизонтальная ленты. */}
      <line x1="44.5" y1="0" x2="44.5" y2="117" stroke="#FFFFFF" strokeWidth="2" />
      <line x1="0" y1="45" x2="89" y2="45" stroke="#FFFFFF" strokeWidth="2" />
      {/* Бант на пересечении: две петли (общая ширина 49, высота 20). */}
      <path d="M 44.5 45 C 40 25 20 25 20 35 C 20 43 34 45 44.5 45 Z" fill="#FFFFFF" />
      <path d="M 44.5 45 C 49 25 69 25 69 35 C 69 43 55 45 44.5 45 Z" fill="#FFFFFF" />
      {/* Два хвоста вниз-в-стороны (разлёт 38 pt). */}
      <path d="M 42 47 L 25 63" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" />
      <path d="M 47 47 L 64 63" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}

export function ProfileFeatherArt() {
  // Перо — автономный SVG (viewBox 0-based), видно целиком, без обрезки.
  // Позиционирование и наклон задаются в CSS (.mx-profile-banner__feather).
  // Координаты перенесены из абсолютных карточки (440 pt) в 0-based:
  // x' = x − 293, y' = y + 4 (минимум y был −4).
  return (
    <svg
      className="mx-profile-banner__art mx-profile-banner__art--feather"
      viewBox="0 0 118 84"
      aria-hidden="true"
      focusable="false"
    >
      <path
        d="M0 46 C19 58 47 62 65 54 C79 48 85 34 79 28 C71 22 62 34 65 48 C69 66 92 79 117 82"
        fill="none"
        stroke="#D0D0D0"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path d="M0 46 C7 24 29 8 57 0 L81 0 C83 12 74 24 58 32 C38 42 18 46 0 46 Z" fill="#D0D0D0" />
      <path
        d="M4 44 C23 34 43 22 69 6"
        fill="none"
        stroke="#202020"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path
        d="M26 33 L22 23 M41 25 L38 15 M56 16 L54 7"
        fill="none"
        stroke="#202020"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  )
}
