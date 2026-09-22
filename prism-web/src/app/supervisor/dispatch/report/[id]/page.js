'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import ReportMap from '@/components/ui/ReportMap'
import Modal from '@/components/ui/Modal'
import LinemanRecommendationPanel from '@/components/ui/LinemanRecommendationPanel'

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

export default function ReportReviewPage() {
  const { id } = useParams()
  const router = useRouter()

  const [report, setReport] = useState(null)
  const [reporterName, setReporterName] = useState('')
  const [assignment, setAssignment] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [showAssignPanel, setShowAssignPanel] = useState(false)
  const [linemen, setLinemen] = useState([])
  const [linemenLoading, setLinemenLoading] = useState(false)
  const [linemenError, setLinemenError] = useState('')
  const [assigning, setAssigning] = useState(false)

  const [showDeclineBox, setShowDeclineBox] = useState(false)
  const [declineReason, setDeclineReason] = useState('')
  const [actionLoading, setActionLoading] = useState(false)

  useEffect(() => {
    loadReport()
  }, [id])

  async function loadReport() {
    setLoading(true)
    setError('')
    const supabase = createClient()

    const { data: reportData, error: reportError } = await supabase
      .rpc('get_report_with_location', { p_report_id: id })
      .single()

    if (reportError) {
      setError(reportError.message)
      setLoading(false)
      return
    }

    setReport(reportData)

    const { data: consumer } = await supabase
      .from('users')
      .select('first_name, last_name')
      .eq('id', reportData.consumer_id)
      .single()

    if (consumer) {
      setReporterName(`${consumer.first_name} ${consumer.last_name}`)
    }

    const { data: assignmentData } = await supabase
      .from('job_assignments')
      .select('*')
      .eq('report_id', id)
      .order('assigned_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    setAssignment(assignmentData)
    setLoading(false)
  }

    async function handleOpenAssignPanel() {
    setShowAssignPanel(true)
    setLinemenLoading(true)
    setLinemenError('')
    const supabase = createClient()
    const { data, error: rpcError } = await supabase.rpc('get_lineman_recommendations', {
      p_report_id: id,
    })
    if (rpcError) setLinemenError(rpcError.message)
    setLinemen(data || [])
    setLinemenLoading(false)
  }

  async function handlePriorityChange(newPriority) {
    const supabase = createClient()
    await supabase.from('reports').update({ priority: newPriority }).eq('report_id', id)
    setReport((prev) => ({ ...prev, priority: newPriority }))
  }

  async function handleAssignLineman(linemanId) {
    setAssigning(true)
    setLinemenError('')
    const supabase = createClient()

    const { error: assignError } = await supabase.from('job_assignments').insert({
      report_id: id,
      lineman_id: linemanId,
      status: 'assigned',
      assigned_at: new Date().toISOString(),
    })

    if (assignError) {
      setLinemenError(assignError.message)
      setAssigning(false)
      return
    }

    const { error: reportError } = await supabase
      .from('reports')
      .update({ status: 'dispatched' })
      .eq('report_id', id)

    if (reportError) {
      setLinemenError(reportError.message)
      setAssigning(false)
      return
    }

    router.push('/supervisor/dispatch')
  }

  async function handleConfirmDecline() {
    if (!declineReason.trim()) {
      setError('Please provide a reason before declining.')
      return
    }
    setActionLoading(true)
    setError('')
    const supabase = createClient()

    const { error: updateError } = await supabase
      .from('reports')
      .update({ status: 'cancelled', decline_reason: declineReason.trim() })
      .eq('report_id', id)

    if (updateError) {
      setError(updateError.message)
      setActionLoading(false)
      return
    }

    router.push('/supervisor/dispatch')
  }

  if (loading) return <p className="text-sm text-gray-500">Loading…</p>

    if (!report) {
    return (
      <p className="text-sm text-red-600">
        {error || 'Report not found.'}
      </p>
    )
  }

  const isPending = report.status === 'pending' && !assignment

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-8rem)]">
      <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 overflow-hidden">
        <ReportMap
          lat={report.lat}
          lng={report.lng}
          label={report.nearest_landmark || report.barangay}
        />
      </div>

      {/* Details panel */}
      {showAssignPanel ? (
        <LinemanRecommendationPanel
          linemen={linemen}
          loading={linemenLoading}
          error={linemenError}
          priority={report.priority}
          onPriorityChange={handlePriorityChange}
          onAssign={handleAssignLineman}
          onBack={() => setShowAssignPanel(false)}
          assigning={assigning}
        />
      ) : (
      <div className="overflow-y-auto space-y-6">
        <p className="text-sm text-gray-500">No assignments available.</p>
      </div>
      )}
    </div>
  )
}