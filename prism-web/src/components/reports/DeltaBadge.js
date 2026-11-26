export default function DeltaBadge({ delta, good }) {
  if (!delta || delta.pct == null) return null
  const up = delta.pct > 0
  const flat = delta.pct === 0
  let tone = 'text-gray-500'
  if (!flat && good) tone = (good === 'up') === up ? 'text-green-600' : 'text-red-600'
  return (
    <span className={`font-semibold ${tone}`}>
      {flat ? '0%' : `${up ? '+' : ''}${delta.pct}%`} vs previous
    </span>
  )
}

export function withDelta(text, delta, good) {
  if (!delta || delta.pct == null) return text
  return (
    <>
      {text ? <>{text} · </> : null}
      <DeltaBadge delta={delta} good={good} />
    </>
  )
}