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

export default function ReportReviewPage() {
  const { id } = useParams()
  const router = useRouter()

  const [report, setReport] = useState(null)
  const [reporterName, setReporterName] = useState('')
  const [assignment, setAssignment] = useState(null)
  const [photoSignedUrl, setPhotoSignedUrl] = useState(null)
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

    if (reportData.photo_url) {
      const { data: signed } = await supabase.storage
        .from('report-photos')
        .createSignedUrl(reportData.photo_url, 3600)
      if (signed) setPhotoSignedUrl(signed.signedUrl)
    }

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
    return <p className="text-sm text-red-600">{error || 'Report not found.'}</p>
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
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h1 className="text-lg font-bold text-gray-900">Report Details</h1>
                <p className="text-xs text-gray-500 mt-0.5">
                  Ticket: {report.ticket_number}
                </p>
                <p className="text-xs text-gray-500">
                  Report from{' '}
                  <span className="text-blue-700 font-medium">{reporterName}</span>
                </p>
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-3 mb-4">
              <p className="text-xs font-bold text-gray-500 uppercase mb-1">
                Current Ticket Status
              </p>
              <p className={`text-sm font-bold ${statusColor[report.status]}`}>
                ● {labelize(assignment ? assignment.status : report.status)}
              </p>
            </div>

            <div className="space-y-3 text-sm">
              <div>
                <p className="text-xs text-gray-400">Time Reported</p>
                <p className="text-gray-900">
                  {new Date(report.created_at).toLocaleString('en-PH', {
                    month: 'long', day: 'numeric', hour: 'numeric', minute: '2-digit',
                  })}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-400">Location</p>
                <p className="text-gray-900 font-medium">
                  {report.nearest_landmark || `${report.barangay}, ${report.municipality}`}
                </p>
                <p className="text-gray-500 text-xs">
                  Zone {report.zone || '—'}, {report.barangay}, {report.municipality}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-400">Description</p>
                <p className="text-gray-700 bg-gray-50 rounded-lg p-3 mt-1">
                  "{report.report_details}"
                </p>
              </div>
              {report.other_homes_affected && (
                <p className="text-xs text-amber-600 font-medium">
                  ⚠ Consumer indicated nearby households are also affected
                </p>
              )}
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-sm font-bold text-gray-900 mb-3">Photo Evidence</h2>
            {photoSignedUrl ? (
              <img
                src={photoSignedUrl}
                alt="Report evidence"
                className="w-full rounded-lg border border-gray-200"
              />
            ) : (
              <p className="text-sm text-gray-400 italic">No photo submitted.</p>
            )}
          </div>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          {isPending && !showDeclineBox && (
            <div className="space-y-3">
              <button
                onClick={handleOpenAssignPanel}
                className="w-full bg-blue-700 hover:bg-blue-800 text-white font-semibold text-sm py-3 rounded-lg transition-colors"
              >
                Assign Lineman
              </button>
              <button
                onClick={() => setShowDeclineBox(true)}
                className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold text-sm py-3 rounded-lg transition-colors"
              >
                Decline Report
              </button>
            </div>
          )}

          {isPending && showDeclineBox && (
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <label className="block text-xs font-bold tracking-wide text-gray-600 mb-1.5">
                REASON FOR DECLINING
              </label>
              <textarea
                value={declineReason}
                onChange={(e) => setDeclineReason(e.target.value)}
                rows={3}
                placeholder="Explain why this report is being declined…"
                className="w-full px-3.5 py-2.5 rounded-lg border border-gray-200 bg-gray-50 text-sm placeholder-gray-400 mb-3"
              />
              <div className="flex gap-3">
                <button
                  onClick={handleConfirmDecline}
                  disabled={actionLoading}
                  className="flex-1 bg-red-600 hover:bg-red-700 disabled:opacity-60 text-white font-semibold text-sm py-2.5 rounded-lg"
                >
                  {actionLoading ? 'Submitting…' : 'Confirm Decline'}
                </button>
                <button
                  onClick={() => setShowDeclineBox(false)}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold text-sm py-2.5 rounded-lg"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {assignment && assignment.status === 'fixed' && (
            <QAReviewSection assignment={assignment} onReviewed={loadReport} />
          )}

          {assignment && (
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="text-sm font-bold text-gray-900 mb-2">Assigned Lineman</h2>
              <p className="text-sm text-gray-700">
                Status:{' '}
                <span className="font-medium">{labelize(assignment.status)}</span>
              </p>
              <p className="text-xs text-gray-400 mt-1">
                Assigned:{' '}
                {new Date(assignment.assigned_at).toLocaleString('en-PH', {
                  month: 'long', day: 'numeric', hour: 'numeric', minute: '2-digit',
                })}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}