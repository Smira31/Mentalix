import ScreenBack from './ScreenBack'

/**
 * Единая шапка вложенного экрана — Stoic-образец (G5, G6).
 *
 Сверху слева круглая кнопка «Назад» 43×43, ниже — крупный жирный
 строчный заголовок с точкой. Никаких текстовых «‹ Назад».
 *
 * registerSystemBack: по умолчанию регистрирует обработчик в стеке
 * useBackButton (Telegram BackButton + edge-swipe). Если родитель
 * уже управляет стеком (например Library), передай registerSystemBack={false}.
 */
export default function NestedScreenHeader({
  title,
  onBack,
  registerSystemBack = true,
  testId = 'back-button',
}) {
  return (
    <div className="mx-nested-screen-header">
      <ScreenBack onBack={onBack} testId={testId} registerSystemBack={registerSystemBack} />
      <h1 className="font-display mx-type-page text-cream lowercase">{title}</h1>
    </div>
  )
}

/**
 * Круглая кнопка «Назад» 43×43 без заголовка — для экранов,
 * где заголовок уже есть (например, заголовок шага сессии),
 * а нужна только круглая кнопка вместо текстовой «‹ Назад».
 */
export function RoundBackButton({
  onClick,
  testId = 'back-button',
  registerSystemBack = false,
  className = '',
}) {
  return (
    <ScreenBack
      onBack={onClick}
      testId={testId}
      registerSystemBack={registerSystemBack}
      className={className}
    />
  )
}
