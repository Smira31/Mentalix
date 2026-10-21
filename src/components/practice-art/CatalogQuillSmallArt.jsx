import { CatalogQuillArt } from './CatalogQuillArt'

// Перо — единый плоский силуэт без мелких круглых деталей,
// отдельная упрощённая трассировка для малых размеров не требуется:
// используем ту же геометрию, что и в большом значке.

export function CatalogQuillSmallArt({ className }) {
  return <CatalogQuillArt className={className || 'mx-catalog-quill-small-art'} />
}

export default CatalogQuillSmallArt
