import Button from '@/components/ui/Button'

export default function ReasonBox({
  label = 'REASON FOR REJECTION',
  value,
  onChange,
  rows = 3,
  placeholder,
  confirmLabel,
  cancelLabel = 'Cancel',
  onConfirm,
  onCancel,
  loading = false,
  focusRing = '',
  className = '',
}) {
  return (
    <div className={className}>
      <label className="block text-xs font-bold tracking-wide text-gray-600 mb-1.5">{label}</label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={rows}
        placeholder={placeholder}
        className={`w-full px-3.5 py-2.5 rounded-lg border border-gray-200 bg-gray-50 text-sm placeholder-gray-400 mb-3 ${focusRing}`}
      />
      <div className="flex gap-3">
        <Button variant="danger" size="split" onClick={onConfirm} disabled={loading}>
          {confirmLabel}
        </Button>
        <Button variant="soft" size="split" dim={false} onClick={onCancel} disabled={loading}>
          {cancelLabel}
        </Button>
      </div>
    </div>
  )
}
