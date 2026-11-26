import Card from '@/components/ui/Card'
import { FEATURE_LABELS } from '@/lib/dashboard/constants'

export default function AccessCard({ isOwner, featureAccess }) {
  if (isOwner) return null
  const missing = Object.keys(FEATURE_LABELS).filter((k) => !featureAccess.includes(k))
  return (
    <Card className="mb-6">
      <h2 className="text-sm font-bold text-gray-900 mb-1">Your Access</h2>
      <p className="text-xs text-gray-400 mb-4">
        The cooperative owner assigns what each supervisor can use.
      </p>
      <div className="flex flex-wrap gap-2">
        {featureAccess.map((f) => (
          <span key={f} className="rounded-full bg-green-50 px-3 py-1 text-xs font-semibold text-green-700">
            ✓ {FEATURE_LABELS[f] || f}
          </span>
        ))}
        {missing.map((f) => (
          <span key={f} className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-400">
            🔒 {FEATURE_LABELS[f]}
          </span>
        ))}
      </div>
      {missing.length > 0 && (
        <p className="mt-4 text-xs text-gray-500">
          Need more access? Ask your cooperative owner to update your account in Users.
        </p>
      )}
    </Card>
  )
}