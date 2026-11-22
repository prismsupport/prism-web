// Pin colours for the maps. The colour follows the position of a priority in the
// cooperative's own list, the same idea as the priority pills.
//   highest = red, lowest = blue, none = gray, levels in between = in-between colours.

export const PIN_COLORS = {
  highest: '#DC2626',
  high: '#F87171',
  mid: '#F59E0B',
  lowest: '#2563EB',
  none: '#9CA3AF',
}

// levels = [{ key, label, rank }] from useStatusLabels().priorityLevels
export function pinColor(priorityKey, levels) {
  if (!priorityKey || !levels || levels.length === 0) return PIN_COLORS.none
  const level = levels.find((l) => l.key === priorityKey)
  if (!level) return PIN_COLORS.none
  if (levels.length === 1) return PIN_COLORS.lowest

  const position = (level.rank - 1) / (levels.length - 1)
  if (position >= 1) return PIN_COLORS.highest
  if (position >= 0.6) return PIN_COLORS.high
  if (position >= 0.3) return PIN_COLORS.mid
  return PIN_COLORS.lowest
}