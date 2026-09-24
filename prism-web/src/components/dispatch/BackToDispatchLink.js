import { useRouter } from 'next/navigation'

export default function BackToDispatchLink({ withMarginBottom = false }) {
  const router = useRouter()

  return (
    <button
      onClick={() => router.push('/supervisor/dispatch')}
      className={`text-sm text-blue-700 font-medium${withMarginBottom ? ' mb-4' : ''}`}
    >
      ← Back to Dispatch
    </button>
  )
}