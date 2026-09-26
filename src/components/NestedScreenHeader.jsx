import { ChevronLeft } from 'lucide-react'
import { platform } from '../platform'
import { useBackButton } from '../platform/telegram.hooks'

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
  useBackButton(
    () => {
      platform.haptic('light')
      onBack?.()
    },
    registerSystemBack
  )

  return (
    <div className="mx-nested-screen-header">
      <button
        type="button"
        data-testid={testId}
        aria-label="Назад"
        onClick={() => {
          platform.haptic('light')
          onBack?.()
        }}
        className="mx-nested-screen-back"
      >
        <ChevronLeft size={20} aria-hidden="true" />
      </button>
      <h1 className="font-display mx-type-page text-cream lowercase">{title}</h1>
    </div>
  )
}

/**
 * Круглая кнопка «Назад» 43×43 без заголовка — для экранов,
 * где заголовок уже есть (например, заголовок шага сессии),
 * а нужна только круглая кнопка вместо текстовой «‹ Назад».
 */
export function RoundBackButton({ onBack, testId = 'back-button', label = 'Назад' }) {
  return (
    <button
      type="button"
      data-testid={testId}
      aria-label={label}
      onClick={() => {
        platform.haptic('light')
        onBack?.()
      }}
      className="mx-nested-screen-back"
    >
      <ChevronLeft size={20} aria-hidden="true" />
    </button>
  )
}
