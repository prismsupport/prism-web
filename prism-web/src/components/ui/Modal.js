import ModalBackdrop from '@/components/ui/ModalBackdrop'

const sizes = {
  md: 'max-w-lg',
  xl: 'max-w-3xl',
  xxl: 'max-w-5xl',
}

export default function Modal({ title, onClose, children, size = 'md' }) {
  return (
    <ModalBackdrop>
      <div className={`bg-white rounded-2xl shadow-lg w-full ${sizes[size]} max-h-[90vh] overflow-y-auto`}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-900">{title}</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-xl leading-none"
          >
            ×
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </ModalBackdrop>
  )
}
