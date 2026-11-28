// Options for the location filters, from the cooperative's Service Areas.
export async function loadFilterOptions(supabase, coopId) {
  const { data } = await supabase
    .from('service_areas')
    .select('barangay, municipality, feeder, area_office')
    .eq('cooperative_id', coopId)
    .is('archived_at', null)

  const rows = data || []
  const unique = (list) => Array.from(new Set(list.filter(Boolean))).sort()

  const barangayMap = new Map()
  rows.forEach((a) => {
    if (a.barangay && a.municipality) {
      barangayMap.set(`${a.barangay}|${a.municipality}`, `${a.barangay} (${a.municipality})`)
    }
  })

  return {
    municipalities: unique(rows.map((a) => a.municipality)),
    barangays: Array.from(barangayMap.entries())
      .map(([value, label]) => ({ value, label }))
      .sort((a, b) => a.label.localeCompare(b.label)),
    feeders: unique(rows.map((a) => a.feeder)),
    areaOffices: unique(rows.map((a) => a.area_office)),
  }
}