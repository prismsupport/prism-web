'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import ReportMap from '@/components/ui/ReportMap'
import LinemanRecommendationPanel from '@/components/ui/LinemanRecommendationPanel'
import QAReviewSection from '@/components/ui/QAReviewSection'

function labelize(value) {
  return value
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
}

const statusColor = {
  pending: 'text-red-600',
  dispatched: 'text-amber-600',
  in_progress: 'text-amber-600',
  qa_review: 'text-blue-600',
  resolved: 'text-green-600',
  cancelled: 'text-gray-400',
}

export default function MasterTicketDetailPage() {
  const { id } = useParams()
  const router = useRouter()

  const [master, setMaster] = useState(null)
  const [members, setMembers] = useState([])
  const [assignment, setAssignment] = useState(null)
  const [assignedLinemanName, setAssignedLinemanName] = useState('')
  const [cooperativeId, setCooperativeId] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [showAssignPanel, setShowAssignPanel] = useState(false)
  const [linemen, setLinemen] = useState([])
  const [linemenLoading, setLinemenLoading] = useState(false)
  const [linemenError, setLinemenError] = useState('')
  const [assigning, setAssigning] = useState(false)

  useEffect(() => {
    loadMaster()
  }, [id])

  async function loadMaster() {
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

    setCooperativeId(myRow?.cooperative_id)

    const { data: masterData, error: masterError } = await supabase
      .from('master_tickets')
      .select('*')
      .eq('master_id', id)
      .single()

    if (masterError) {
      setError(masterError.message)
      setLoading(false)
      return
    }

    const { data: geo } = await supabase
      .rpc('get_master_ticket_with_location', { p_master_id: id })
      .single()

    setMaster({ ...masterData, _lat: geo?.lat, _lng: geo?.lng })

    const { data: memberReportIds } = await supabase
      .from('reports')
      .select('report_id')
      .eq('master_id', id)

    const ids = (memberReportIds || []).map((r) => r.report_id)
    let memberReports = []
    if (ids.length > 0) {
      const { data } = await supabase.rpc('get_reports_with_location', {
        p_report_ids: ids,
      })
      memberReports = data || []
    }

    const consumerIds = (memberReports || []).map((r) => r.consumer_id)
    let consumerNames = []
    if (consumerIds.length > 0) {
      const { data } = await supabase
        .from('users')
        .select('id, first_name, last_name')
        .in('id', consumerIds)
      consumerNames = data || []
    }

    setMembers(
      (memberReports || []).map((r) => ({
        ...r,
        reporterName: consumerNames.find((c) => c.id === r.consumer_id),
      }))
    )

    const { data: assignmentData } = await supabase
      .from('job_assignments')
      .select('*')
      .eq('master_id', id)
      .order('assigned_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    setAssignment(assignmentData)

    if (assignmentData) {
      const { data: lineman } = await supabase
        .from('users')
        .select('first_name, last_name')
        .eq('id', assignmentData.lineman_id)
        .single()
      if (lineman) {
        setAssignedLinemanName(`${lineman.first_name} ${lineman.last_name}`)
      }
    }

    setLoading(false)
  }

  async function handleOpenAssignPanel() {
    setShowAssignPanel(true)
    setLinemenLoading(true)
    setLinemenError('')
    const supabase = createClient()
    const { data, error: rpcError } = await supabase.rpc(
      'get_lineman_recommendations_by_location',
      { p_lat: master._lat, p_lng: master._lng, p_cooperative_id: cooperativeId }
    )
    if (rpcError) setLinemenError(rpcError.message)
    setLinemen(data || [])
    setLinemenLoading(false)
  }

  async function handlePriorityChange(newPriority) {
    const supabase = createClient()
    await supabase
      .from('master_tickets')
      .update({ priority: newPriority })
      .eq('master_id', id)
    setMaster((prev) => ({ ...prev, priority: newPriority }))
  }

  async function handleAssignLineman(linemanId) {
    setAssigning(true)
    setLinemenError('')
    const supabase = createClient()

    const { error: assignError } = await supabase.from('job_assignments').insert({
      master_id: id,
      lineman_id: linemanId,
      status: 'assigned',
      assigned_at: new Date().toISOString(),
    })

    if (assignError) {
      setLinemenError(assignError.message)
      setAssigning(false)
      return
    }

    const { error: masterError } = await supabase
      .from('master_tickets')
      .update({ status: 'dispatched' })
      .eq('master_id', id)

    if (masterError) {
      setLinemenError(masterError.message)
      setAssigning(false)
      return
    }

    router.push('/supervisor/dispatch')
  }

  if (loading) return <p className="text-sm text-gray-500">Loading…</p>

  if (error || !master) {
    return (
      <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
        {error || 'Master ticket not found.'}
      </p>
    )
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-8rem)]">
      <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 overflow-hidden relative">
        <div className="absolute top-4 left-4 z-[1000] bg-amber-100 text-amber-800 text-xs font-bold px-3 py-1.5 rounded-lg">
          ● ACTIVE INCIDENT
        </div>
        <ReportMap
          markers={members.map((m) => ({
            lat: m.lat,
            lng: m.lng,
            label: `${m.reporterName?.first_name || ''} ${m.reporterName?.last_name || ''} — ${m.ticket_number}`,
          }))}
        />
      </div>

      {showAssignPanel ? (
        <LinemanRecommendationPanel
          linemen={linemen}
          loading={linemenLoading}
          error={linemenError}
          priority={master.priority}
          onPriorityChange={handlePriorityChange}
          onAssign={handleAssignLineman}
          onBack={() => setShowAssignPanel(false)}
          assigning={assigning}
        />
      ) : (
        <div className="overflow-y-auto space-y-6">
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h1 className="text-lg font-bold text-gray-900 mb-1">
              Ticket: {master.master_ticket}
            </h1>

            <div className="grid grid-cols-2 gap-3 mt-4">
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs font-bold text-gray-500 uppercase mb-1">
                  Current Status
                </p>
                <p
                  className={`text-sm font-bold ${
                    statusColor[assignment ? assignment.status : master.status]
                  }`}
                >
                  ● {labelize(assignment ? assignment.status : master.status)}
                </p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs font-bold text-gray-500 uppercase mb-1">
                  Priority
                </p>
                <p className="text-sm font-bold text-red-600">
                  {master.priority ? labelize(master.priority) : 'None'}
                </p>
              </div>
            </div>

            <div className="mt-4 text-sm">
              <p className="text-xs text-gray-400">Location</p>
              <p className="text-gray-900 font-medium">
                {master.barangay}, {master.municipality}
              </p>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-bold text-gray-900">Affected Consumers</h2>
              <span className="bg-blue-50 text-blue-700 text-xs font-bold px-2 py-1 rounded">
                TOTAL: {members.length}
              </span>
            </div>
            <div className="space-y-2">
              {members.map((m) => (
                <div
                  key={m.report_id}
                  className="flex items-center justify-between border border-gray-200 rounded-lg p-3"
                >
                  <div>
                    <p className="text-sm font-semibold text-gray-900">
                      {m.reporterName?.first_name} {m.reporterName?.last_name}
                    </p>
                    <p className="text-xs text-gray-400">
                      Zone {m.zone || '—'}, {m.barangay}, {m.municipality}
                    </p>
                  </div>
                  <span className="text-xs font-medium text-blue-700">
                    {m.ticket_number}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {assignment && assignment.status === 'fixed' && (
            <QAReviewSection assignment={assignment} onReviewed={loadMaster} />
          )}

          {assignment ? (
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="text-sm font-bold text-gray-900 mb-3">
                Assigned Lineman
              </h2>
              <div className="flex items-center justify-between border-2 border-blue-600 rounded-lg p-3">
                <p className="text-sm font-semibold text-gray-900">
                  {assignedLinemanName || 'Assigned'}
                </p>
                <span className="text-xs text-gray-400">
                  Assigned:{' '}
                  {new Date(assignment.assigned_at).toLocaleTimeString('en-PH', {
                    hour: 'numeric',
                    minute: '2-digit',
                  })}
                </span>
              </div>
            </div>
          ) : (
            <button
              onClick={handleOpenAssignPanel}
              className="w-full bg-blue-700 hover:bg-blue-800 text-white font-semibold text-sm py-3 rounded-lg transition-colors"
            >
              Assign Lineman
            </button>
          )}
        </div>
      )}
    </div>
  )
}