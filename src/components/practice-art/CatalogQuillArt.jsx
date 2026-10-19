// Перо «Дневника»: чистый векторный силуэт (кривые Безье, без трассировки).
// Лопасть с зазубринами, стержень — вырез (evenodd), очин — отдельная фигура.
// viewBox — по видимым границам пера, центрирование — xMidYMid meet.
// fill rgb(var(--c-text)) — как у значков «Аскез»/«Ритуалов».

const VANE =
  'M 86 6 C 70 8, 52 18, 42 32 L 46 32.6 ' +
  'C 39.5 40, 35 47, 32.2 55 L 36 55.2 ' +
  'C 33 61, 31 66, 30 71 C 38 72, 47 69, 55 63 L 51.8 61.4 ' +
  'C 62 54, 70 45, 75 36 L 71.2 35.4 C 80 26, 86 16, 86 6 Z ' +
  'M 32.6 69.6 C 48 52, 66 31, 80.5 12.5 C 66.5 31.5, 49.5 53.5, 35.4 71 Z'

const QUILL = 'M 30.8 69.4 L 34.2 71.6 L 15.9 94 C 15 95, 13.6 94.2, 14.3 93.1 Z'

export function CatalogQuillArt({ className }) {
  return (
    <svg
      className={className || 'mx-catalog-quill-art'}
      viewBox="10 4 80 92"
      preserveAspectRatio="xMidYMid meet"
      aria-hidden="true"
      focusable="false"
    >
      <path d={VANE} fill="rgb(var(--c-text))" fillRule="evenodd" />
      <path d={QUILL} fill="rgb(var(--c-text))" />
    </svg>
  )
}

export default CatalogQuillArt
