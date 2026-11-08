'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { PageLoading } from "@/components/ui/Skeleton";
import { toast } from '@/lib/toast'
import CooperativeLogo from '@/components/ui/CooperativeLogo'
import StatusBadge from '@/components/StatusBadge'
import Card from '@/components/ui/Card'
import CooperativeStatusActions from '@/components/superadmin/CooperativeStatusActions'
import CooperativeStatusHistory from '@/components/superadmin/CooperativeStatusHistory'
import BackButton from '@/components/ui/BackButton'
import Alert from '@/components/ui/Alert';

export default function CooperativeDetailPage() {
  const { id } = useParams()
  const router = useRouter()

  const [coop, setCoop] = useState(null)
  const [supervisor, setSupervisor] = useState(null)
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

    const [{ data: logData, error: logError }, { data: supervisorData, error: supervisorError }] =
      await Promise.all([
        supabase
          .from('cooperative_status_logs')
          .select('*')
          .eq('cooperative_id', id)
          .order('changed_at', { ascending: false }),
        supabase
          .from('users')
          .select('first_name, last_name, email, phone_number, is_active')
          .eq('cooperative_id', id)
          .eq('user_type', 'supervisor')
          .maybeSingle(),
      ])

    if (logError) {
      toast.error(logError.message)
      setError(logError.message)
    }
    if (supervisorError) {
      toast.error(supervisorError.message)
      setError(supervisorError.message)
    }

    setCoop(coopData)
    setSupervisor(supervisorData)
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

      <div className="grid grid-cols-1 gap-6 items-start lg:grid-cols-[1.1fr_0.9fr]">
        <Card>
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <CooperativeLogo name={coop.cooperative_name} src={coop.logo_url} size={64} />
              <h1 className="text-xl font-bold text-gray-900">{coop.cooperative_name}</h1>
            </div>
            <StatusBadge status={coop.status} />
          </div>

          <dl className="grid grid-cols-1 gap-x-6 gap-y-4 text-sm sm:grid-cols-2">
            <div className="sm:col-span-2">
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
            <div>
              <dt className="text-gray-400">Last Updated</dt>
              <dd className="text-gray-900">
                {new Date(coop.updated_at).toLocaleDateString('en-PH', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </dd>
            </div>
            <div className="border-t border-gray-100 pt-4 sm:col-span-2">
              <h2 className="mb-3 text-xs font-bold tracking-wide text-blue-700">
                REGISTERED SUPERVISOR
              </h2>
            </div>
            <div>
              <dt className="text-gray-400">Full Name</dt>
              <dd className="text-gray-900">
                {supervisor
                  ? `${supervisor.first_name} ${supervisor.last_name}`
                  : 'Not available'}
              </dd>
            </div>
            <div>
              <dt className="text-gray-400">Personal Email</dt>
              <dd className="break-words text-gray-900">
                {supervisor?.email || 'Not available'}
              </dd>
            </div>
            <div>
              <dt className="text-gray-400">Contact Number</dt>
              <dd className="text-gray-900">
                {supervisor?.phone_number || 'Not available'}
              </dd>
            </div>
            <div>
              <dt className="text-gray-400">Account Status</dt>
              <dd className="text-gray-900">
                {supervisor ? (supervisor.is_active ? 'Active' : 'Inactive') : 'Not available'}
              </dd>
            </div>
            {coop.status === 'Rejected' && coop.rejection_reason && (
              <div className="sm:col-span-2">
                <dt className="text-gray-400">Rejection Reason</dt>
                <dd className="text-red-600">{coop.rejection_reason}</dd>
              </div>
            )}
          </dl>

          <Alert className="mt-4">{error}</Alert>

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