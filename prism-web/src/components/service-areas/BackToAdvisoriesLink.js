import { useRouter } from 'next/navigation'

export default function BackToAdvisoriesLink({ withMarginBottom = false }) {
  const router = useRouter()

  return (
    <button
      onClick={() => router.push('/supervisor/advisories')}
      className={`text-sm text-blue-700 font-medium${withMarginBottom ? ' mb-4' : ''}`}
    >
      ← Back to Advisories
    </button>
  )
}