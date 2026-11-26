// Loads everything the Users page shows. Returns plain data, no React state.
export async function loadUsersData(supabase) {
  let error = ''

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const currentUserId = user.id

  const { data: myRow, error: myRowError } = await supabase
    .from('users')
    .select('cooperative_id')
    .eq('id', user.id)
    .single()

  if (myRowError || !myRow) {
    return { failed: true, currentUserId, error: 'Unable to load your cooperative.' }
  }

  const cooperativeId = myRow.cooperative_id

  const { data: coop } = await supabase
    .from('cooperative_settings')
    .select('area_offices')
    .eq('cooperative_id', cooperativeId)
    .single()

  const areaOffices = coop?.area_offices || []

  // ---- Lineman accounts ----
  const { data: linemanUsers, error: linemanError } = await supabase
    .from('users')
    .select('*')
    .eq('cooperative_id', cooperativeId)
    .eq('user_type', 'lineman')
    .order('first_name', { ascending: true })

  if (linemanError) error = linemanError.message

  const linemanIds = (linemanUsers || []).map((u) => u.id)
  let linemanDetails = []
  if (linemanIds.length > 0) {
    const { data } = await supabase
      .from('lineman')
      .select('*')
      .in('profile_id', linemanIds)
    linemanDetails = data || []
  }

  const linemen = (linemanUsers || []).map((u) => ({
    ...u,
    ...linemanDetails.find((l) => l.profile_id === u.id),
  }))

  // ---- Consumer accounts ----
  const { data: consumerUsers, error: consumerUsersError } = await supabase
    .from('users')
    .select('*')
    .eq('cooperative_id', cooperativeId)
    .eq('user_type', 'consumer')
    .order('first_name', { ascending: true })

  if (consumerUsersError) error = consumerUsersError.message

  const consumerIds = (consumerUsers || []).map((u) => u.id)
  let consumerDetails = []
  if (consumerIds.length > 0) {
    const { data } = await supabase
      .from('consumer')
      .select('*')
      .in('profile_id', consumerIds)
    consumerDetails = data || []
  }

  // Approved account numbers for this cooperative's consumers (primary first)
  const { data: linkData } = await supabase
    .from('consumer_bill_links')
    .select('consumer_id, account_number, is_primary')
    .eq('cooperative_id', cooperativeId)
    .eq('status', 'approved')
  const accountLinks = linkData || []

  const consumers = (consumerUsers || []).map((u) => ({
    ...u,
    ...consumerDetails.find((c) => c.profile_id === u.id),
    accounts: accountLinks
      .filter((a) => a.consumer_id === u.id)
      .sort((a, b) => Number(b.is_primary) - Number(a.is_primary))
      .map((a) => a.account_number),
  }))

  // ---- Supervisor accounts ----
  const { data: supervisorUsers, error: supervisorError } = await supabase
    .from('users')
    .select('*')
    .eq('cooperative_id', cooperativeId)
    .eq('user_type', 'supervisor')
    .order('first_name', { ascending: true })

  if (supervisorError) error = supervisorError.message

  const supervisorIds = (supervisorUsers || []).map((u) => u.id)
  let supervisorDetails = []
  if (supervisorIds.length > 0) {
    const { data } = await supabase
      .from('supervisor')
      .select('*')
      .in('profile_id', supervisorIds)
    supervisorDetails = data || []
  }

  const supervisors = (supervisorUsers || [])
    .map((u) => ({
      ...u,
      ...supervisorDetails.find((s) => s.profile_id === u.id),
    }))
    .sort((a, b) => (a.is_owner === b.is_owner ? 0 : a.is_owner ? -1 : 1))

  return {
    failed: false,
    currentUserId,
    cooperativeId,
    areaOffices,
    linemen,
    consumers,
    supervisors,
    error,
  }
}

// { [lineman_id]: { ...duty fields, location_updated_at } }
export async function loadDutyStatus(supabase) {
  const [dutyRes, seenRes] = await Promise.all([
    supabase.rpc('get_lineman_duty_status'),
    supabase.from('lineman').select('profile_id, location_updated_at'),
  ])

  const map = {}
  ;(dutyRes.data || []).forEach((d) => {
    map[d.lineman_id] = { ...d }
  })
  ;(seenRes.data || []).forEach((s) => {
    if (map[s.profile_id]) map[s.profile_id].location_updated_at = s.location_updated_at
  })
  return map
}