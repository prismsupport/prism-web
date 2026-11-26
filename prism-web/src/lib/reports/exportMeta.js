import { RANGES } from '@/lib/reports/constants'

export function buildPeriodLabel({ rangeKey, customFrom, customTo, from, to }) {
  let periodLabel = 'All time'
  if (rangeKey === 'custom') {
    periodLabel = `${customFrom || 'Start'} to ${customTo || 'today'}`
  } else if (from) {
    periodLabel = `${RANGES.find((r) => r.key === rangeKey)?.label} (${from} to ${to})`
  }
  return periodLabel
}

// logo: { dataUrl, width, height } or null
export function buildExportMeta({
  coopName,
  logo,
  supervisorName,
  isOwner,
  statusLabel,
  periodLabel,
  filters,
}) {
  return {
    cooperativeName: coopName,
    logo,
    preparedBy: { name: supervisorName, role: isOwner ? 'Cooperative Owner' : 'Supervisor' },
    statusLabel,
    periodLabel,
    generatedAt: new Date().toLocaleString('en-PH', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    }),
    filters: filters.map((f) => ({
      label: f.label,
      value: f.options.find((o) => o.value === f.value)?.label ?? f.value,
    })),
  }
}