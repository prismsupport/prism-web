const knownStyles = {
  billing: 'bg-amber-50 text-amber-700',
  technical: 'bg-blue-50 text-blue-700',
  outages: 'bg-purple-50 text-purple-700',
}

const fallbackPalette = [
  'bg-emerald-50 text-emerald-700',
  'bg-pink-50 text-pink-700',
  'bg-indigo-50 text-indigo-700',
  'bg-teal-50 text-teal-700',
  'bg-orange-50 text-orange-700',
  'bg-cyan-50 text-cyan-700',
]

export function getCategoryColor(category) {
  if (knownStyles[category]) return knownStyles[category]
  let hash = 0
  for (let i = 0; i < category.length; i++) {
    hash = category.charCodeAt(i) + ((hash << 5) - hash)
  }
  return fallbackPalette[Math.abs(hash) % fallbackPalette.length]
}