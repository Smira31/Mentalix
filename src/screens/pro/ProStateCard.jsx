import Card from '../../components/ui/Card'
import PillButton from '../../components/ui/PillButton'

/*
 * Карточка отдельного состояния API Pro (PRO-002b/c): выключенная функция,
 * отсутствие Pro, недостаток данных, неожиданный статус. Русский понятный
 * текст и явный следующий шаг — без «сырых» кодов ошибок.
 */
export default function ProStateCard({
  title,
  text,
  actionLabel,
  onAction,
  actionTestId,
  testId = 'pro-state-card',
}) {
  return (
    <Card className="mt-4 p-4" testId={testId}>
      {title && <p className="mx-pro-size-note font-semibold text-cream">{title}</p>}
      <p className="mx-pro-size-note mt-1 leading-relaxed text-cream">{text}</p>
      {actionLabel && onAction && (
        <PillButton
          variant="dark"
          testId={actionTestId}
          onClick={onAction}
          className="mt-3 w-full"
        >
          {actionLabel}
        </PillButton>
      )}
    </Card>
  )
}
