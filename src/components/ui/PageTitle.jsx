/*
 * <PageTitle> — крупный заголовок экрана.
 * 28px / 700, строчные буквы с точкой на конце.
 * Используется в шапке вложенных экранов после кнопки «Назад».
 */
export default function PageTitle({ children, className = '' }) {
  return (
    <h1
      className={`font-display mx-type-page text-cream lowercase mx-page-title ${className}`}
    >
      {children}
    </h1>
  )
}
