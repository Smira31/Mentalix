import { createPortal } from 'react-dom'

export default function DeleteConfirmationDialog({ itemType, onConfirm, onCancel }) {
  return createPortal(
    <div className="fixed inset-0 z-[110] flex items-end justify-center bg-black/70 p-5 sm:items-center">
      <button
        type="button"
        aria-label="Закрыть подтверждение удаления"
        onClick={onCancel}
        className="absolute inset-0 h-full w-full border-0 bg-transparent"
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="delete-confirmation-title"
        className="relative z-10 w-full max-w-sm rounded-[28px] border border-cream/10 bg-emerald p-5 shadow-2xl animate-fade-in"
      >
        <h2 id="delete-confirmation-title" className="font-display text-[20px] font-semibold text-cream">
          Удалить {itemType}?
        </h2>
        <p className="mt-3 text-[13px] leading-relaxed text-muted">
          Запись будет удалена без возможности восстановления.
        </p>

        <div className="mt-5 flex gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="practice-scene__choice min-h-11 flex-1 rounded-full border border-cream/15 bg-cream/5 px-4 py-3 text-[13px] font-semibold text-muted"
          >
            Отменить
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="practice-scene__choice min-h-11 flex-1 rounded-full border-0 bg-cream px-4 py-3 text-[13px] font-semibold text-emerald-deep"
          >
            Удалить
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}
