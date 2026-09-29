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
  // Замок справа: корпус x 280–388, y 122 → ниже нижнего края (обрезан);
  // дужка x 306–387, верх y 67, линия 5 pt, левый конец не доходит до корпуса.
  // viewBox = локальные координаты замка (108×200), позиционирование в CSS.
  return (
    <svg
      className="mx-profile-banner__art mx-profile-banner__art--lock"
      viewBox="0 0 108 200"
      aria-hidden="true"
      focusable="false"
    >
      {/* Дужка открыта: правое плечо уходит в корпус, левое приподнято. */}
      <path
        d="M 107 55 V 25 C 107 10 90 0 66.5 0 C 43 0 26 10 26 25 V 38"
        fill="none"
        stroke="#3a3a3a"
        strokeWidth="5"
        strokeLinecap="round"
      />
      {/* Корпус — плоская заливка, уходит за нижний край (обрезан). */}
      <rect x="0" y="55" width="108" height="145" rx="14" fill="#444444" />
      {/* Скважина: тёмный круг + черта. */}
      <circle cx="54" cy="75" r="8" fill="#141414" />
      <rect x="51" y="79" width="6" height="20" rx="3" fill="#141414" />
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
  // Перо маленькое, только в зоне x 290–408, y 0–80. Лист ≈ 70×34 pt,
  // верх обрезан краем, кончик в (293, 42), наклон вверх-вправо.
  // viewBox = локальные координаты зоны (118×80), позиционирование в CSS.
  return (
    <svg
      className="mx-profile-banner__art mx-profile-banner__art--feather"
      viewBox="0 0 118 80"
      aria-hidden="true"
      focusable="false"
    >
      {/* Лист пера — светло-серая заливка, верх обрезан краем карточки. */}
      <path d="M 3 42 C 18 30 45 15 70 2 C 58 22 33 36 3 42 Z" fill="#D0D0D0" />
      {/* Тёмные прожилки. */}
      <path d="M 4 41 L 69 3" stroke="#141414" strokeWidth="2" fill="none" />
      <path
        d="M 25 32 L 18 24 M 40 24 L 33 16 M 55 16 L 48 8"
        stroke="#141414"
        strokeWidth="2"
        strokeLinecap="round"
      />
      {/* От кончика — линия 2 pt #D0D0D0: вправо на y ≈ 56, петля около
          x 70–83 / y 37–67, затем вниз-вправо за край на y ≈ 77. */}
      <path
        d="M 3 42 Q 28 54 55 56 C 64 57 68 40 73 48 C 78 56 76 66 74 62 C 80 70 95 74 118 77"
        fill="none"
        stroke="#D0D0D0"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  )
}
