export default function ModalBackdrop({ className = '', children, ...props }) {
  return (
    <div
      className={`fixed inset-0 bg-black/40 flex items-center justify-center z-[9999] p-4 ${className}`}
      {...props}
    >
      {children}
    </div>
  )
}
