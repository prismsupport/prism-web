import StatCard, { StatCardGrid } from '@/components/ui/StatCard'

export default function ServiceAreaStatCards({
  showArchived,
  areaCount,
  substationCount,
  feederCount,
  areaOfficeCount,
  unassignedCount,
}) {
  return (
    <StatCardGrid columns={5}>
      <StatCard
        compact
        label={showArchived ? 'Archived Areas' : 'Total Areas'}
        value={areaCount}
        color="text-blue-700"
      />
      <StatCard compact label="Substations" value={substationCount} />
      <StatCard compact label="Feeders" value={feederCount} />
      <StatCard compact label="Area Offices" value={areaOfficeCount} />
      <StatCard
        compact
        label="Unassigned Office"
        value={unassignedCount}
        color={unassignedCount > 0 ? 'text-amber-600' : 'text-gray-900'}
      />
    </StatCardGrid>
  )
}