const VARIANTS = {
  // Rounded filled tabs (FAQ)
  pill: {
    list: 'flex gap-2',
    tab: 'px-4 py-2 rounded-lg text-sm font-semibold transition-colors',
    active: 'bg-blue-700 text-white',
    idle: 'text-gray-600 hover:bg-gray-100',
  },
  // Underlined tabs (Users, Profile)
  underline: {
    list: 'flex gap-6 border-b border-gray-200 mb-6',
    tab: 'pb-3 text-sm font-semibold border-b-2 -mb-px transition-colors',
    active: 'border-blue-700 text-blue-700',
    idle: 'border-transparent text-gray-500 hover:text-gray-700',
  },
}

// tabs: [{ key, label }]  (label can be a node, e.g. text + count badge)
export default function Tabs({ tabs, value, onChange, variant = 'pill', className }) {
  const v = VARIANTS[variant]
  return (
    <div className={className ?? v.list}>
      {tabs.map((t) => (
        <button
          key={t.key}
          onClick={() => onChange(t.key)}
          className={`${v.tab} ${value === t.key ? v.active : v.idle}`}
        >
          {t.label}
        </button>
      ))}
    </div>
  )
}
