'use client'

import { useCallback, useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { loadUsersData, loadDutyStatus } from '@/lib/users/loaders'

// Owns the Users page data. reload() is the old loadEverything().
export function useUsersData() {
  const [cooperativeId, setCooperativeId] = useState(null)
  const [currentUserId, setCurrentUserId] = useState(null)
  const [areaOffices, setAreaOffices] = useState([])
  const [linemen, setLinemen] = useState([])
  const [consumers, setConsumers] = useState([])
  const [supervisors, setSupervisors] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const reload = useCallback(async () => {
    setLoading(true)
    setError('')

    const result = await loadUsersData(createClient())

    setCurrentUserId(result.currentUserId)

    if (result.failed) {
      setError(result.error)
      setLoading(false)
      return
    }

    setCooperativeId(result.cooperativeId)
    setAreaOffices(result.areaOffices)
    if (result.error) setError(result.error)
    setLinemen(result.linemen)
    setConsumers(result.consumers)
    setSupervisors(result.supervisors)
    setLoading(false)
  }, [])

  useEffect(() => {
    reload()
  }, [reload])

  return {
    cooperativeId,
    currentUserId,
    areaOffices,
    setAreaOffices,
    linemen,
    consumers,
    supervisors,
    loading,
    error,
    reload,
  }
}

// Live duty badges: loads when active becomes true, then refreshes every minute.
export function useLinemanDutyStatus(active) {
  const [dutyById, setDutyById] = useState({})

  useEffect(() => {
    if (!active) return

    async function refresh() {
      setDutyById(await loadDutyStatus(createClient()))
    }

    refresh()
    const timer = setInterval(refresh, 60000)
    return () => clearInterval(timer)
  }, [active])

  return dutyById
}