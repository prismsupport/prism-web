'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import BackToDispatchLink from '@/components/dispatch/BackToDispatchLink'

const MAX_DISTANCE_METERS = 500

function distanceMeters(lat1, lng1, lat2, lng2) {
  const R = 6371000
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLng = ((lng2 - lng1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

function generateMasterTicketNumber() {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, '')
  const random = Math.random().toString(16).slice(2, 8).toUpperCase()
  return `MT-${date}-${random}`
}

export default function CreateMasterTicketPage() {
  const router = useRouter()

  const [cooperativeId, setCooperativeId] = useState(null)
  const [reports, setReports] = useState([])
  const [selectedIds, setSelectedIds] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [creating, setCreating] = useState(false)

  useEffect(() => {
    loadReports()
  }, [])

  async function loadReports() {
    setLoading(true)
    setError('')
    const supabase = createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    const { data: myRow } = await supabase
      .from('users')
      .select('cooperative_id')
      .eq('id', user.id)
      .single()

    if (!myRow) {
      setError('Unable to load your cooperative.')
      setLoading(false)
      return
    }

    setCooperativeId(myRow.cooperative_id)

    const { data: reportData, error: reportError } = await supabase
      .from('reports')
      .select('*')
      .eq('cooperative_id', myRow.cooperative_id)
      .is('master_id', null)
      .not('status', 'in', '(resolved,cancelled)')
      .order('created_at', { ascending: false })

    if (reportError) {
      setError(reportError.message)
      setLoading(false)
      return
    }

    const reportIds = (reportData || []).map((r) => r.report_id)
    let withLocation = []
    if (reportIds.length > 0) {
      const { data } = await supabase.rpc('get_reports_with_location', {
        p_report_ids: reportIds,
      })
      withLocation = data || []
    }

    setReports(withLocation)
    setLoading(false)
  }

  const anchor = selectedIds.length > 0
    ? reports.find((r) => r.report_id === selectedIds[0])
    : null

  function isWithinRange(report) {
    if (!anchor) return true
    return distanceMeters(anchor.lat, anchor.lng, report.lat, report.lng) <= MAX_DISTANCE_METERS
  }

  function toggleReport(report) {
    setSelectedIds((prev) => {
      if (prev.includes(report.report_id)) {
        const updated = prev.filter((id) => id !== report.report_id)
        return updated
      }
      if (!isWithinRange(report)) return prev
      return [...prev, report.report_id]
    })
  }

  async function handleCreate() {
    if (selectedIds.length < 2) return

    setCreating(true)
    setError('')
    const supabase = createClient()

    const selectedReports = reports.filter((r) => selectedIds.includes(r.report_id))
    const base = selectedReports[0]

    const { data: newMaster, error: masterError } = await supabase
      .from('master_tickets')
      .insert({
        master_ticket: generateMasterTicketNumber(),
        cooperative_id: cooperativeId,
        barangay: base.barangay,
        municipality: base.municipality,
        location: `POINT(${base.lng} ${base.lat})`,
        priority: base.priority,
        report_count: selectedIds.length,
        status: 'pending',
      })
      .select()
      .single()

    if (masterError) {
      setError(masterError.message)
      setCreating(false)
      return
    }

    const { error: linkError } = await supabase
      .from('reports')
      .update({ master_id: newMaster.master_id })
      .in('report_id', selectedIds)

    if (linkError) {
      setError(linkError.message)
      setCreating(false)
      return
    }

    router.push(`/supervisor/dispatch/master/${newMaster.master_id}`)
  }

  return (
    <div>
      <BackToDispatchLink withMarginBottom />

      <h1 className="text-2xl font-bold text-gray-900">Create Master Ticket</h1>
      <p className="text-sm text-gray-500 mt-1 mb-6">
        Select two or more reports to merge. Only reports within {MAX_DISTANCE_METERS}m
        of your first selection can be combined together.
      </p>

      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2 mb-4">
          {error}
        </p>
      )}

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden mb-6">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200 text-left text-xs text-gray-500 uppercase tracking-wide">
              <th className="px-5 py-3 font-semibold w-12"></th>
              <th className="px-5 py-3 font-semibold">Ticket ID</th>
              <th className="px-5 py-3 font-semibold">Location</th>
              <th className="px-5 py-3 font-semibold">Reported</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={4} className="px-5 py-8 text-center text-gray-500">
                  Loading…
                </td>
              </tr>
            )}
            {!loading && reports.length === 0 && (
              <tr>
                <td colSpan={4} className="px-5 py-8 text-center text-gray-500">
                  No standalone reports available to merge.
                </td>
              </tr>
            )}
            {!loading &&
              reports.map((r) => {
                const isSelected = selectedIds.includes(r.report_id)
                const withinRange = isWithinRange(r)
                const isDisabled = !isSelected && !withinRange

                return (
                  <tr
                    key={r.report_id}
                    className={`border-b border-gray-100 last:border-0 ${
                      isDisabled ? 'opacity-40' : ''
                    }`}
                  >
                    <td className="px-5 py-4">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        disabled={isDisabled}
                        onChange={() => toggleReport(r)}
                        className="w-4 h-4"
                      />
                    </td>
                    <td className="px-5 py-4 font-semibold text-gray-900">
                      {r.ticket_number}
                    </td>
                    <td className="px-5 py-4">
                      <p className="text-gray-900">
                        {r.nearest_landmark || `${r.barangay}, ${r.municipality}`}
                      </p>
                      <p className="text-xs text-gray-400">
                        {r.barangay}, {r.municipality}
                      </p>
                    </td>
                    <td className="px-5 py-4 text-gray-600">
                      {new Date(r.created_at).toLocaleString('en-PH', {
                        month: 'short',
                        day: 'numeric',
                        hour: 'numeric',
                        minute: '2-digit',
                      })}
                    </td>
                  </tr>
                )
              })}
          </tbody>
        </table>
      </div>

      <button
        onClick={handleCreate}
        disabled={selectedIds.length < 2 || creating}
        className="bg-blue-700 hover:bg-blue-800 disabled:opacity-50 text-white font-semibold text-sm px-6 py-3 rounded-lg transition-colors"
      >
        {creating
          ? 'Creating…'
          : `Create Master Ticket (${selectedIds.length} selected)`}
      </button>
    </div>
  )
}