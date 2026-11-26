// Case-insensitive search across any number of values
export function makeMatcher(searchText) {
  const term = searchText.trim().toLowerCase()
  return (...values) =>
    !term ||
    values
      .filter(Boolean)
      .join(' ')
      .toLowerCase()
      .includes(term)
}

function byFirstName(order) {
  return (a, b) =>
    order === 'Name (A-Z)'
      ? a.first_name.localeCompare(b.first_name)
      : b.first_name.localeCompare(a.first_name)
}

export function filterLinemen(linemen, { areaFilter, shiftFilter, sortOrder, searchText }) {
  const matches = makeMatcher(searchText)
  return linemen
    .filter((l) => areaFilter === 'All Area Offices' || l.assigned_area_office === areaFilter)
    .filter((l) => {
      if (shiftFilter === 'All Shifts') return true
      const shiftName = shiftFilter === 'Morning Duty' ? 'morning' : 'night'
      return (l.schedule || []).some((shift) =>
        shift.name?.toLowerCase().includes(shiftName)
      )
    })
    .filter((l) =>
      matches(
        l.first_name,
        l.last_name,
        `${l.first_name} ${l.last_name}`,
        l.email,
        l.phone_number,
        l.company_id_number,
        l.assigned_area_office
      )
    )
    .sort(byFirstName(sortOrder))
}

export function municipalityOptionsOf(consumers) {
  return [...new Set(consumers.map((c) => c.municipality).filter(Boolean))].sort()
}

export function barangayOptionsOf(consumers) {
  return [...new Set(consumers.map((c) => c.barangay).filter(Boolean))].sort()
}

export function filterConsumers(
  consumers,
  { municipalityFilter, barangayFilter, sortOrder, searchText }
) {
  const matches = makeMatcher(searchText)
  return consumers
    .filter(
      (c) =>
        municipalityFilter === 'All Municipalities' || c.municipality === municipalityFilter
    )
    .filter((c) => barangayFilter === 'All Barangays' || c.barangay === barangayFilter)
    .filter((c) =>
      matches(
        `${c.first_name} ${c.last_name}`,
        c.email,
        c.phone_number,
        (c.accounts || []).join(' '),
        c.zone,
        c.barangay,
        c.municipality
      )
    )
    .sort(byFirstName(sortOrder))
}

export function filterSupervisors(supervisors, { accessFilter, sortOrder, searchText }) {
  const matches = makeMatcher(searchText)
  return supervisors
    .filter((s) => {
      if (accessFilter === 'All Access') return true
      if (accessFilter === 'owner') return s.is_owner
      if (accessFilter === 'no_access') {
        return !s.is_owner && (!s.feature_access || s.feature_access.length === 0)
      }
      return !s.is_owner && s.feature_access?.includes(accessFilter)
    })
    .filter((s) => matches(`${s.first_name} ${s.last_name}`, s.email, s.phone_number))
    .sort(byFirstName(sortOrder))
}