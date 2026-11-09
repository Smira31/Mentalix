import { createPortal } from 'react-dom'

/*
 * Подтверждение действия в окне профиля (DESIGN_SYSTEM.md §5.4).
 *
 * Общая рамка для «Удалить …?» и «Выйти из аккаунта?»: классы и цвета —
 * существующие, новых стилей окно не заводит. Прежний вид «Удалить …?»
 * сохранён в DeleteConfirmationDialog.
 */
export default function ConfirmDialog({
  title,
  titleId = 'confirm-dialog-title',
  description,
  confirmLabel,
  cancelLabel = 'Отмена',
  closeLabel = 'Закрыть подтверждение',
  testId,
  onConfirm,
  onCancel,
}) {
  return createPortal(
    <div className="fixed inset-0 z-[110] flex items-end justify-center bg-black/70 p-5 sm:items-center">
      <button
        type="button"
        aria-label={closeLabel}
        onClick={onCancel}
        className="absolute inset-0 h-full w-full border-0 bg-transparent"
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        data-testid={testId}
        className="relative z-10 w-full max-w-sm rounded-[28px] border border-cream/10 bg-emerald p-5 shadow-2xl animate-fade-in"
      >
        <h2 id={titleId} className="font-display text-[20px] font-semibold text-cream">
          {title}
        </h2>
        {description && (
          <p className="mt-3 text-[13px] leading-relaxed text-muted">{description}</p>
        )}

        <div className="mt-5 flex gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="practice-scene__choice min-h-11 flex-1 rounded-full border border-cream/15 bg-cream/5 px-4 py-3 text-[13px] font-semibold text-muted"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="practice-scene__choice min-h-11 flex-1 rounded-full border-0 bg-cream px-4 py-3 text-[13px] font-semibold text-emerald-deep"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}
