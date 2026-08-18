'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import StatusBadge from '@/components/StatusBadge'
import Card from '@/components/ui/Card'

export default function CooperativeDetailPage() {
  const { id } = useParams()
  const router = useRouter()

  const [coop, setCoop] = useState(null)
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [actionLoading, setActionLoading] = useState(false)

  const [showRejectBox, setShowRejectBox] = useState(false)
  const [rejectReason, setRejectReason] = useState('')
  const [showDeactivateConfirm, setShowDeactivateConfirm] = useState(false)

  useEffect(() => {
    fetchCoopAndLogs()
  }, [id])

  async function fetchCoopAndLogs() {
    setLoading(true)
    const supabase = createClient()

    const { data: coopData, error: coopError } = await supabase
      .from('cooperatives')
      .select('*')
      .eq('id', id)
      .single()

    if (coopError) {
      setError(coopError.message)
      setLoading(false)
      return
    }

    const { data: logData, error: logError } = await supabase
      .from('cooperative_status_logs')
      .select('*')
      .eq('cooperative_id', id)
      .order('changed_at', { ascending: false })

    if (logError) {
      setError(logError.message)
    }

    setCoop(coopData)
    setLogs(logData || [])
    setLoading(false)
  }

  async function logStatusChange(previousStatus, newStatus) {
    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    await supabase.from('cooperative_status_logs').insert({
      cooperative_id: id,
      previous_status: previousStatus,
      new_status: newStatus,
      changed_by: user?.id ?? null,
    })
  }

  async function handleApprove() {
    setActionLoading(true)
    setError('')
    const supabase = createClient()
    const previousStatus = coop.status

    const { error: coopError } = await supabase
      .from('cooperatives')
      .update({ status: 'Active' })
      .eq('id', id)

    if (coopError) {
      setError(coopError.message)
      setActionLoading(false)
      return
    }

    const { error: userError } = await supabase
      .from('users')
      .update({ is_active: true })
      .eq('cooperative_id', id)
      .eq('user_type', 'supervisor')

    if (userError) {
      setError(userError.message)
      setActionLoading(false)
      return
    }

    await logStatusChange(previousStatus, 'Active')
    router.push('/superadmin/cooperatives')
  }

  async function handleConfirmReject() {
    if (!rejectReason.trim()) {
      setError('Please provide a rejection reason before submitting.')
      return
    }

    setActionLoading(true)
    setError('')
    const supabase = createClient()
    const previousStatus = coop.status

    const { error: coopError } = await supabase
      .from('cooperatives')
      .update({ status: 'Rejected', rejection_reason: rejectReason.trim() })
      .eq('id', id)

    if (coopError) {
      setError(coopError.message)
      setActionLoading(false)
      return
    }

    await logStatusChange(previousStatus, 'Rejected')
    router.push('/superadmin/cooperatives')
  }

  async function handleDeactivate() {
    setActionLoading(true)
    setError('')
    const supabase = createClient()
    const previousStatus = coop.status

    const { error: coopError } = await supabase
      .from('cooperatives')
      .update({ status: 'Deactivated' })
      .eq('id', id)

    if (coopError) {
      setError(coopError.message)
      setActionLoading(false)
      return
    }

    const { error: userError } = await supabase
      .from('users')
      .update({ is_active: false })
      .eq('cooperative_id', id)

    if (userError) {
      setError(userError.message)
      setActionLoading(false)
      return
    }

    await logStatusChange(previousStatus, 'Deactivated')
    router.push('/superadmin/cooperatives')
  }

  async function handleReactivate() {
    setActionLoading(true)
    setError('')
    const supabase = createClient()
    const previousStatus = coop.status

    const { error: coopError } = await supabase
      .from('cooperatives')
      .update({ status: 'Active' })
      .eq('id', id)

    if (coopError) {
      setError(coopError.message)
      setActionLoading(false)
      return
    }

    const { error: userError } = await supabase
      .from('users')
      .update({ is_active: true })
      .eq('cooperative_id', id)

    if (userError) {
      setError(userError.message)
      setActionLoading(false)
      return
    }

    await logStatusChange(previousStatus, 'Active')
    router.push('/superadmin/cooperatives')
  }

  if (loading) return <p className="text-sm text-gray-500">Loading…</p>

  if (!coop) {
    return (
      <p className="text-sm text-red-600">
        Cooperative not found. It may have been removed.
      </p>
    )
  }

  const isPending = coop.status === 'Pending Approval'
  const isActive = coop.status === 'Active'
  const isDeactivated = coop.status === 'Deactivated'

  return (
    <div className="max-w-8xl">
      <button
        onClick={() => router.push('/superadmin/cooperatives')}
        className="text-sm text-blue-700 font-medium mb-4 cursor-pointer"
      >
        ← Back to All Cooperatives
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* Left: details + actions */}
        <Card>
          <div className="flex items-start justify-between mb-4">
            <h1 className="text-xl font-bold text-gray-900">
              {coop.cooperative_name}
            </h1>
            <StatusBadge status={coop.status} />
          </div>

          <dl className="space-y-3 text-sm">
            <div>
              <dt className="text-gray-400">Office Address</dt>
              <dd className="text-gray-900">
                {coop.office_address}, {coop.municipality}, {coop.province}
              </dd>
            </div>
            <div>
              <dt className="text-gray-400">Contact Number</dt>
              <dd className="text-gray-900">{coop.contact_number}</dd>
            </div>
            <div>
              <dt className="text-gray-400">Official Email</dt>
              <dd className="text-gray-900">{coop.official_email}</dd>
            </div>
            <div>
              <dt className="text-gray-400">Submission Date</dt>
              <dd className="text-gray-900">
                {new Date(coop.created_at).toLocaleDateString('en-PH', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </dd>
            </div>
            {coop.status === 'Rejected' && coop.rejection_reason && (
              <div>
                <dt className="text-gray-400">Rejection Reason</dt>
                <dd className="text-red-600">{coop.rejection_reason}</dd>
              </div>
            )}
          </dl>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2 mt-4">
              {error}
            </p>
          )}

          {isPending && !showRejectBox && (
            <div className="flex gap-3 mt-6">
              <button
                onClick={handleApprove}
                disabled={actionLoading}
                className="flex-1 bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white font-semibold text-sm py-2.5 rounded-lg transition-colors cursor-pointer"
              >
                {actionLoading ? 'Processing…' : 'Approve'}
              </button>
              <button
                onClick={() => setShowRejectBox(true)}
                disabled={actionLoading}
                className="flex-1 bg-red-50 hover:bg-red-100 text-red-700 font-semibold text-sm py-2.5 rounded-lg transition-colors border border-red-200 cursor-pointer"
              >
                Reject
              </button>
            </div>
          )}

          {isPending && showRejectBox && (
            <div className="mt-6">
              <label className="block text-xs font-bold tracking-wide text-gray-600 mb-1.5">
                REJECTION REASON
              </label>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                rows={3}
                placeholder="Explain why this registration is being rejected…"
                className="w-full px-3.5 py-2.5 rounded-lg border border-gray-200 bg-gray-50 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
              />
              <div className="flex gap-3 mt-3">
                <button
                  onClick={handleConfirmReject}
                  disabled={actionLoading}
                  className="flex-1 bg-red-600 hover:bg-red-700 disabled:opacity-60 text-white font-semibold text-sm py-2.5 rounded-lg transition-colors cursor-pointer"
                >
                  {actionLoading ? 'Submitting…' : 'Confirm Rejection'}
                </button>
                <button
                  onClick={() => {
                    setShowRejectBox(false)
                    setRejectReason('')
                    setError('')
                  }}
                  disabled={actionLoading}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold text-sm py-2.5 rounded-lg transition-colors cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {isActive && !showDeactivateConfirm && (
            <div className="mt-6">
              <button
                onClick={() => setShowDeactivateConfirm(true)}
                disabled={actionLoading}
                className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold text-sm py-2.5 rounded-lg transition-colors cursor-pointer"
              >
                Deactivate Cooperative
              </button>
            </div>
          )}

          {isActive && showDeactivateConfirm && (
            <div className="mt-6 border border-gray-200 rounded-lg p-4 bg-gray-50">
              <p className="text-sm text-gray-700 mb-3">
                Deactivating this cooperative will immediately block its
                Supervisor, Linemen, and Consumers from logging in. This
                action can only be reversed manually. Are you sure?
              </p>
              <div className="flex gap-3">
                <button
                  onClick={handleDeactivate}
                  disabled={actionLoading}
                  className="flex-1 bg-gray-800 hover:bg-gray-900 disabled:opacity-60 text-white font-semibold text-sm py-2.5 rounded-lg transition-colors cursor-pointer"
                >
                  {actionLoading ? 'Deactivating…' : 'Yes, Deactivate'}
                </button>
                <button
                  onClick={() => setShowDeactivateConfirm(false)}
                  disabled={actionLoading}
                  className="flex-1 bg-white hover:bg-gray-100 text-gray-700 font-semibold text-sm py-2.5 rounded-lg transition-colors border border-gray-200 cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {isDeactivated && (
            <div className="mt-6">
              <button
                onClick={handleReactivate}
                disabled={actionLoading}
                className="w-full bg-blue-700 hover:bg-blue-800 disabled:opacity-60 text-white font-semibold text-sm py-2.5 rounded-lg transition-colors cursor-pointer"
              >
                {actionLoading ? 'Reactivating…' : 'Reactivate Cooperative'}
              </button>
            </div>
          )}
        </Card>

        {/* Right: status history */}
        <Card>
          <h2 className="font-semibold text-gray-900 mb-4">Status History</h2>

          {logs.length === 0 ? (
            <p className="text-sm text-gray-500">
              No status changes recorded yet.
            </p>
          ) : (
            <ul className="space-y-3">
              {logs.map((log) => (
                <li
                  key={log.id}
                  className="flex items-center justify-between flex-wrap gap-2 border-b border-gray-100 last:border-0 pb-3 last:pb-0"
                >
                  <div className="flex items-center gap-1.5">
                    {log.previous_status && (
                      <>
                        <StatusBadge status={log.previous_status} />
                        <span className="text-gray-400 text-xs">→</span>
                      </>
                    )}
                    <StatusBadge status={log.new_status} />
                  </div>
                  <span className="text-xs text-gray-400">
                    {new Date(log.changed_at).toLocaleString('en-PH', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  )
}