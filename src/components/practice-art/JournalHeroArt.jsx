// src/components/practice-art/JournalHeroArt.jsx
//
// Иллюстрация для карточки «Журнал» на экране «Шаги» — блокнот с пером.
// Сплошная обложка #EDEDED, тонкие прорези (evenodd) для линий, сплошное перо.
// viewBox 0 0 200 240.

export function JournalHeroArt() {
  return (
    <svg
      className="mx-steps-journal__art-img"
      viewBox="0 0 200 240"
      preserveAspectRatio="xMidYMid meet"
      aria-hidden="true"
      focusable="false"
    >
      {/* Обложка блокнота + прорези для линий (evenodd) */}
      <path
        fill="#EDEDED"
        fillRule="evenodd"
        d="M48 28 H152 Q160 28 160 36 V204 Q160 212 152 212 H48 Q40 212 40 204 V36 Q40 28 48 28 Z
           M58 40 H63 V200 H58 Z
           M74 62 H140 V67 H74 Z
           M74 82 H140 V87 H74 Z
           M74 102 H130 V107 H74 Z
           M74 122 H140 V127 H74 Z
           M74 142 H125 V147 H74 Z
           M74 162 H135 V167 H74 Z
           M74 182 H115 V187 H74 Z"
      />
      {/* Перо (сплошное) */}
      <path
        fill="#EDEDED"
        d="M152 18 C172 24 182 48 176 72 C170 92 155 108 142 120 L137 128 Q135 138 132 144 Q129 148 125 145 Q122 142 125 138 L130 130 L135 122 C148 108 158 88 152 68 C146 48 136 36 124 30 C134 22 144 18 152 18 Z"
      />
    </svg>
  )
}

export default JournalHeroArt
