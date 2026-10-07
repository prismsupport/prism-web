'use client'

import { getMatchTier, buildBreakdownFactors } from '@/lib/scoring/masterTicketScoringConfig'

export default function SuggestionConfidenceBanner({ title, confidence, subtitlePrefix, description, theme = 'purple', breakdown }) {
  const styles = {
    purple: { text: 'text-purple-700', bg: 'bg-purple-50' },
    blue: { text: 'text-blue-700', bg: 'bg-blue-50' },
  }[theme]

  const tier = getMatchTier(confidence)
  const factors = buildBreakdownFactors(breakdown)

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-1">
        <h1 className="text-lg font-bold text-gray-900">{title}</h1>
        <span className={`text-xs font-bold px-2 py-1 rounded uppercase ${tier.badgeClass}`}>
          {tier.label}
        </span>
      </div>
      <p className="text-sm text-gray-500 mb-3">
        {subtitlePrefix}Confidence: <span className="font-semibold text-green-600">{confidence}%</span>
      </p>
      {description && (
        <p className={`text-sm ${styles.text} ${styles.bg} rounded-lg px-3 py-2 mb-3`}>
          {description}
        </p>
      )}
      {factors.length > 0 && (
        <div className="space-y-1.5 border-t border-gray-100 pt-3">
          <p className="text-xs font-bold text-gray-400 uppercase mb-1">Match Breakdown</p>
          {factors.map((f, i) => (
            <div key={i} className="flex items-center gap-2 text-sm">
              <span className={f.passed ? 'text-green-600' : 'text-gray-300'}>
                {f.passed ? '✓' : '✗'}
              </span>
              <span className={f.passed ? 'text-gray-700' : 'text-gray-400'}>{f.label}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}