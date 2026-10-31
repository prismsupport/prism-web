export default function InlineLoading({ text = 'Loading…', className = '' }) {
  return <p className={`text-sm text-gray-500 ${className}`}>{text}</p>
}
