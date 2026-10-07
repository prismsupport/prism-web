// Mirrors the formula defined in src/lib/scoring/masterTicketScoring.sql.
// This file does NOT perform scoring (that happens in Postgres, where
// PostGIS distance calculations actually live) — it's the single place
// the UI pulls tier labels, colors, and thresholds from, so badges stay
// consistent with the database everywhere they appear.

export const MATCH_SCORE_WEIGHTS = {
  feeder: 30,
  proximity: 25,
  nearby: 20,
  time: 15,
  verification: 10,
}

export const MATCH_TIERS = [
  { min: 80, key: 'highly_likely', label: 'Highly Likely Duplicate', badgeClass: 'bg-green-50 text-green-700' },
  { min: 50, key: 'possible', label: 'Possible Duplicate', badgeClass: 'bg-amber-50 text-amber-700' },
  { min: 0, key: 'no_suggestion', label: 'No Suggestion', badgeClass: 'bg-gray-100 text-gray-500' },
]

export function getMatchTier(score) {
  return MATCH_TIERS.find((t) => score >= t.min) || MATCH_TIERS[MATCH_TIERS.length - 1]
}

// Turns a raw get_match_breakdown()/get_match_breakdown_against_master() row
// into a simple list the UI can render as checkmarks/crosses.
export function buildBreakdownFactors(b) {
  if (!b) return []
  return [
    {
      label:
        b.feeder_match === true
          ? `Same Feeder (${b.feeder_a})`
          : b.feeder_match === false
          ? `Different Feeder (${b.feeder_a} vs ${b.feeder_b})`
          : 'Feeder Unknown — not in Service Areas',
      passed: b.feeder_match === true,
    },
    {
      label: `Within ${Math.round(b.distance_meters)}m`,
      passed: b.proximity_score > 0,
    },
    {
      label: `${b.nearby_count} nearby report${b.nearby_count === 1 ? '' : 's'}`,
      passed: b.nearby_score > 0,
    },
    {
      label: `Filed ${Math.round(b.minutes_apart)} minutes apart`,
      passed: b.time_score > 0,
    },
    {
      label: b.verification_flag
        ? 'Consumer confirmed nearby homes affected'
        : 'Consumer verification not indicated',
      passed: !!b.verification_flag,
    },
  ]
}

// Combines several per-member breakdowns (each member vs the cluster anchor)
// into one representative breakdown, for showing at the top of a cluster
// review page where there isn't a single pairwise comparison.
export function aggregateBreakdowns(breakdownList) {
  const valid = breakdownList.filter(Boolean)
  if (valid.length === 0) return null

  const feederMatches = valid.map((b) => b.feeder_match)
  const feederMatch = feederMatches.some((f) => f === false)
    ? false
    : feederMatches.every((f) => f === true)
    ? true
    : null

  const avg = (key) => valid.reduce((sum, b) => sum + (b[key] || 0), 0) / valid.length

  return {
    feeder_match: feederMatch,
    feeder_a: valid[0].feeder_a,
    feeder_b: feederMatch === false ? 'varies' : valid[0].feeder_b,
    distance_meters: avg('distance_meters'),
    proximity_score: avg('proximity_score'),
    nearby_count: valid[0].nearby_count,
    nearby_score: valid[0].nearby_score,
    minutes_apart: avg('minutes_apart'),
    time_score: avg('time_score'),
    verification_flag: valid.some((b) => b.verification_flag),
    verification_score: avg('verification_score'),
  }
}