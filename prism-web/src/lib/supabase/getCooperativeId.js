export async function getMyCooperativeId(supabase) {
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null

  const { data } = await supabase
    .from('users')
    .select('cooperative_id')
    .eq('id', user.id)
    .single()

  return data?.cooperative_id ?? null
}
