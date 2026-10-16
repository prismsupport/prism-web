'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import StatusBadge from '@/components/StatusBadge'
import Card from '@/components/ui/Card'
import CooperativeStatusActions from '@/components/superadmin/CooperativeStatusActions'
import CooperativeStatusHistory from '@/components/superadmin/CooperativeStatusHistory'
import BackButton from '@/components/ui/BackButton'
import { PageLoading } from "@/components/ui/Skeleton";
import { toast } from '@/lib/toast'

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
      toast.error(coopError.message)
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
      toast.error(logError.message)
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

    const { error } = await supabase.from('cooperative_status_logs').insert({
      cooperative_id: id,
      previous_status: previousStatus,
      new_status: newStatus,
      changed_by: user?.id ?? null,
    })
    if (error) toast.error(error.message)
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
      toast.error(coopError.message)
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
      toast.error(userError.message)
      setError(userError.message)
      setActionLoading(false)
      return
    }

    await logStatusChange(previousStatus, 'Active')
    toast.success('Cooperative approved')
    router.push('/superadmin/cooperatives')
  }

  async function handleConfirmReject() {
    if (!rejectReason.trim()) {
      toast.error('Please provide a rejection reason before submitting.')
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
      toast.error(coopError.message)
      setError(coopError.message)
      setActionLoading(false)
      return
    }

    await logStatusChange(previousStatus, 'Rejected')
    toast.success('Cooperative rejected')
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
      toast.error(coopError.message)
      setError(coopError.message)
      setActionLoading(false)
      return
    }

    const { error: userError } = await supabase
      .from('users')
      .update({ is_active: false })
      .eq('cooperative_id', id)

    if (userError) {
      toast.error(userError.message)
      setError(userError.message)
      setActionLoading(false)
      return
    }

    await logStatusChange(previousStatus, 'Deactivated')
    toast.success('Cooperative deactivated')
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
      toast.error(coopError.message)
      setError(coopError.message)
      setActionLoading(false)
      return
    }

    const { error: userError } = await supabase
      .from('users')
      .update({ is_active: true })
      .eq('cooperative_id', id)

    if (userError) {
      toast.error(userError.message)
      setError(userError.message)
      setActionLoading(false)
      return
    }

    await logStatusChange(previousStatus, 'Active')
    toast.success('Cooperative reactivated')
    router.push('/superadmin/cooperatives')
  }

  if (loading) return <PageLoading />

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
      <BackButton href="/superadmin/cooperatives" label="Back to All Cooperatives" withMarginBottom />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
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

          <CooperativeStatusActions
            isPending={isPending}
            isActive={isActive}
            isDeactivated={isDeactivated}
            showRejectBox={showRejectBox}
            rejectReason={rejectReason}
            onRejectReasonChange={setRejectReason}
            showDeactivateConfirm={showDeactivateConfirm}
            onApprove={handleApprove}
            onShowRejectBox={() => setShowRejectBox(true)}
            onConfirmReject={handleConfirmReject}
            onCancelReject={() => {
              setShowRejectBox(false)
              setRejectReason('')
              setError('')
            }}
            onShowDeactivateConfirm={() => setShowDeactivateConfirm(true)}
            onDeactivate={handleDeactivate}
            onCancelDeactivate={() => setShowDeactivateConfirm(false)}
            onReactivate={handleReactivate}
            actionLoading={actionLoading}
          />
        </Card>
        
        <Card>
          <CooperativeStatusHistory logs={logs} />
        </Card>
      </div>
    </div>
  )
}