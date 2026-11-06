import Badge from '@/components/ui/Badge'
import { PROOF_LOCATION, proofLocationState } from '@/lib/proofLocation'

// Read-only indicator. value: true | false | null | undefined
export default function ProofLocationBadge({ value, className = '' }) {
  const state = PROOF_LOCATION[proofLocationState(value)]
  return (
    <Badge tone={state.tone} className={`inline-block ${className}`}>
      {state.label}
    </Badge>
  )
}