/*
 * <CapsLabel> — надпись CAPS над заголовком/секцией.
 * Manrope 11px / 700, letter-spacing 0.2em, uppercase.
 */
export default function CapsLabel({ children, className = '' }) {
  return (
    <span className={`font-label mx-caps-label ${className}`}>{children}</span>
  )
}
