import Modal from '@/components/ui/Modal'
import Button from '@/components/ui/Button'

export default function ConfirmDialog({
  title,
  children,
  confirmLabel = 'Delete',
  cancelLabel = 'Cancel',
  tone = 'danger',
  loading = false,
  onConfirm,
  onClose,
}) {
  return (
    <Modal title={title} onClose={onClose}>
      <p className="text-sm text-gray-700 mb-6">{children}</p>
      <div className="flex justify-end gap-3">
        <Button variant="outline" onClick={onClose} disabled={loading}>
          {cancelLabel}
        </Button>
        <Button variant={tone} onClick={onConfirm} disabled={loading}>
          {confirmLabel}
        </Button>
      </div>
    </Modal>
  )
}
