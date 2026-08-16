/*
 * P05 — canonical EmptyState (UI_UX_AUDIT_2026-07-30.md).
 *
 * Минималистичная карточка-оболочка без текста и CTA — только
 * визуальный паттерн пустоты. Заголовок, описание и кнопка
 * действия остаются на усмотрение экрана и передаются как
 * children, а не жёстко прошиты в этом компоненте.
 *
 * По умолчанию визуал — пунктирный круг (нейтральная «пустота»
 * без темы). Экран с собственной содержательной иллюстрацией
 * (например SemanticGlyph) передаёт её через `glyph` вместо
 * дефолтного круга, чтобы не показывать два визуала разом.
 */
export default function EmptyState({ glyph, children, className = '' }) {
  return (
    <div
      className={`rounded-3xl bg-emerald p-8 text-center ${className}`}
    >
      {glyph ?? (
        <div className="w-16 h-16 rounded-full border border-dashed border-cream/15 mx-auto mb-4" />
      )}

      {children}
    </div>
  )
}
