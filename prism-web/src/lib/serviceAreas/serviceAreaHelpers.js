// Pure helpers for the Service Areas page.

const sortedUnique = (list) => Array.from(new Set(list.filter(Boolean))).sort()

// Filter options built from the areas currently on screen
export function buildServiceAreaOptions(areas) {
  return {
    substations: sortedUnique(areas.map((a) => a.substation)),
    feeders: sortedUnique(areas.map((a) => a.feeder)),
    provinces: sortedUnique(areas.map((a) => a.province)),
    municipalities: sortedUnique(areas.map((a) => a.municipality)),
  }
}

// f = { areaOffice, substation, feeder, province, municipality } (each 'All …' or a value)
// term = search text
export function filterServiceAreas(areas, f, searchText) {
  const term = searchText.trim().toLowerCase()
  return areas.filter((a) => {
    const areaOfficeMatch = f.areaOffice === 'All Area Offices' || a.area_office === f.areaOffice
    const substationMatch = f.substation === 'All Substations' || a.substation === f.substation
    const feederMatch = f.feeder === 'All Feeders' || a.feeder === f.feeder
    const provinceMatch = f.province === 'All Provinces' || a.province === f.province
    const municipalityMatch =
      f.municipality === 'All Municipalities' || a.municipality === f.municipality
    const searchMatch =
      !term ||
      a.barangay?.toLowerCase().includes(term) ||
      a.municipality?.toLowerCase().includes(term) ||
      a.substation?.toLowerCase().includes(term) ||
      a.feeder?.toLowerCase().includes(term) ||
      a.area_office?.toLowerCase().includes(term)
    return (
      areaOfficeMatch &&
      substationMatch &&
      feederMatch &&
      provinceMatch &&
      municipalityMatch &&
      searchMatch
    )
  })
}