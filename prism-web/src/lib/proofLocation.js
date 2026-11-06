// reports.proof_location_consistent is a nullable boolean written by the mobile app.
//   true  = evidence captured near the report location
//   false = evidence captured away from the report location
//   null  = not checked or could not be determined (gallery media, denied
//           permission, inaccurate GPS, timeout). null is NEVER treated as false.
// The web only reads it. It never rejects a report because of it.

export const PROOF_LOCATION = {
  consistent: { label: 'Location Consistent', tone: 'green' },
  inconsistent: { label: 'Location Inconsistent', tone: 'amber' },
  unchecked: { label: 'Not Checked', tone: 'gray' },
}

export function proofLocationState(value) {
  if (value === true) return 'consistent'
  if (value === false) return 'inconsistent'
  return 'unchecked'
}