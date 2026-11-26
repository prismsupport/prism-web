'use client'

import { useEffect, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { getMyCooperativeId } from '@/lib/supabase/getCooperativeId'
import { loadReportData, loadFilterOptions } from '@/lib/reports/loadReportData'
import { resolvePeriod, dateRangeError } from '@/lib/reports/helpers'
import { toast } from '@/lib/toast'

// query = { rangeKey, customFrom, customTo, municipality, barangay, feeder,
//           areaOffice, category, priority, status, compare }
export function useReportsData(query) {
  const {
    rangeKey,
    customFrom,
    customTo,
    municipality,
    barangay,
    feeder,
    areaOffice,
    category,
    priority,
    status,
    compare,
  } = query

  const [coopId, setCoopId] = useState(null)
  const [options, setOptions] = useState(null)
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [supervisorName, setSupervisorName] = useState('')
  const latestLoad = useRef(0)

  // The dates actually used for loading
  const { from, to } = resolvePeriod(rangeKey, customFrom, customTo)
  const dateError = dateRangeError(from, to)

  // One-time setup: cooperative and filter options
  useEffect(() => {
    async function init() {
      const supabase = createClient()
      const id = await getMyCooperativeId(supabase)
      if (!id) {
        toast.error('Unable to load your cooperative.')
        setLoading(false)
        return
      }
      setCoopId(id)
      setOptions(await loadFilterOptions(supabase, id))
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (user) {
        const { data: me } = await supabase
          .from('users')
          .select('first_name, last_name')
          .eq('id', user.id)
          .maybeSingle()
        if (me) setSupervisorName(`${me.first_name} ${me.last_name}`)
      }
    }
    init()
  }, [])

  // Reload whenever a filter changes
  useEffect(() => {
    if (!coopId || dateError) return
    const loadId = ++latestLoad.current
    setRefreshing(true)

    loadReportData(createClient(), coopId, {
      from,
      to,
      municipality,
      barangay,
      feeder,
      areaOffice,
      category,
      priority,
      status,
      compare: compare && rangeKey !== 'all',
    })
      .then((result) => {
        if (loadId !== latestLoad.current) return
        setData(result)
      })
      .catch((err) => {
        if (loadId !== latestLoad.current) return
        toast.error(err?.message || 'Unable to load the report.')
      })
      .finally(() => {
        if (loadId !== latestLoad.current) return
        setLoading(false)
        setRefreshing(false)
      })
  }, [coopId, rangeKey, customFrom, customTo, municipality, barangay, feeder, areaOffice, category, priority, status, compare])

  return { options, supervisorName, data, loading, refreshing, from, to, dateError }
}