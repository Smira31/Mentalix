import ConfirmDialog from './ConfirmDialog'

export default function DeleteConfirmationDialog({ itemType, itemName, onConfirm, onCancel }) {
  const label = itemName ? `«${itemName}»` : itemType

  return (
    <ConfirmDialog
      titleId="delete-confirmation-title"
      title={`Удалить ${label}?`}
      description="Это действие нельзя отменить."
      confirmLabel="Удалить"
      closeLabel="Закрыть подтверждение удаления"
      onConfirm={onConfirm}
      onCancel={onCancel}
    />
  )
}
