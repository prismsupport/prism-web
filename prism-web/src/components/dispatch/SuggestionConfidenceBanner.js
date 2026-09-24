export default function SuggestionConfidenceBanner({ title, confidence, subtitlePrefix, description, theme = 'purple' }) {
  const styles = {
    purple: { text: 'text-purple-700', bg: 'bg-purple-50' },
    blue: { text: 'text-blue-700', bg: 'bg-blue-50' },
  }[theme]

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <h1 className="text-lg font-bold text-gray-900 mb-1">{title}</h1>
      <p className="text-sm text-gray-500 mb-3">
        {subtitlePrefix}Confidence: <span className="font-semibold text-green-600">{confidence}%</span>
      </p>
      <p className={`text-sm ${styles.text} ${styles.bg} rounded-lg px-3 py-2`}>
        {description}
      </p>
    </div>
  )
}