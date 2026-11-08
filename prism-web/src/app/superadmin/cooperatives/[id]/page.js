'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { CalendarDays, Clock, Mail, MapPin, Phone, ShieldAlert } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { PageLoading } from '@/components/ui/Skeleton'
import { toast } from '@/lib/toast'
import CooperativeLogo from '@/components/ui/CooperativeLogo'
import StatusBadge from '@/components/StatusBadge'
import Card from '@/components/ui/Card'
import Avatar from '@/components/ui/Avatar'
import StatusDot from '@/components/ui/StatusDot'
import EmptyState from '@/components/ui/EmptyState'
import CooperativeStatusActions from '@/components/superadmin/CooperativeStatusActions'
import CooperativeStatusHistory from '@/components/superadmin/CooperativeStatusHistory'
import BackButton from '@/components/ui/BackButton'
import Alert from '@/components/ui/Alert'
import { formatDate, DATE_LONG } from '@/lib/format'

function InfoItem({ icon: Icon, label, children, className = '' }) {
  return (
    <div className={`flex items-start gap-3 ${className}`}>
      <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gray-100 text-gray-500">
        <Icon size={17} aria-hidden="true" />
      </span>
      <div className="min-w-0">
        <dt className="text-xs text-gray-400">{label}</dt>
        <dd className="mt-0.5 break-words text-sm font-medium text-gray-900">{children}</dd>
      </div>
    </div>
  )
}

const DECISION_COPY = {
  'Pending Approval': {
    title: 'Review this registration',
    text: 'Approving activates the supervisor account so they can log in. Rejecting requires a reason, which the supervisor sees on login.',
  },
  Active: {
    title: 'Manage access',
    text: 'This cooperative is live. Deactivating blocks its supervisors, linemen and consumers from logging in.',
  },
  Deactivated: {
    title: 'Manage access',
    text: 'This cooperative is deactivated and nobody in it can log in. Reactivate it to restore access.',
  },
  Rejected: {
    title: 'Registration rejected',
    text: 'This registration was rejected. The supervisor can see the reason below when they try to log in.',
  },
}

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
        // The registrant is the first supervisor created for this cooperative
        supabase
          .from('users')
          .select('first_name, last_name, email, phone_number, is_active')
          .eq('cooperative_id', id)
          .eq('user_type', 'supervisor')
          .order('created_at', { ascending: true })
          .limit(1)
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
      <div>
        <BackButton href="/superadmin/cooperatives" label="Back to all cooperatives" withMarginBottom />
        <Card>
          <EmptyState
            title="Cooperative not found"
            description="It may have been removed, or the link is incorrect."
          />
        </Card>
      </div>
    )
  }

  const isPending = coop.status === 'Pending Approval'
  const isActive = coop.status === 'Active'
  const isDeactivated = coop.status === 'Deactivated'
  const decision = DECISION_COPY[coop.status] || DECISION_COPY.Active
  const supervisorName = supervisor ? `${supervisor.first_name} ${supervisor.last_name}` : ''
  const hasBeenUpdated = coop.updated_at !== coop.created_at

  return (
    <div>
      <BackButton href="/superadmin/cooperatives" label="Back to all cooperatives" withMarginBottom />

      {/* Header */}
      <section className="relative mb-6 overflow-hidden rounded-3xl bg-gradient-to-br from-blue-900 to-blue-950 p-6 shadow-lg sm:p-8">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage: 'radial-gradient(rgba(255,255,255,0.08) 1px, transparent 1px)',
            backgroundSize: '24px 24px',
          }}
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-blue-500/25 blur-3xl"
        />

        <div className="relative flex flex-wrap items-center justify-between gap-5">
          <div className="flex items-center gap-5">
            <div className="rounded-2xl bg-white p-1.5 shadow-md">
              <CooperativeLogo name={coop.cooperative_name} src={coop.logo_url} size={72} />
            </div>
            <div className="min-w-0">
              <h1 className="text-2xl font-extrabold leading-tight text-white sm:text-3xl">
                {coop.cooperative_name}
              </h1>
              <p className="mt-1.5 text-sm text-blue-200">
                {[coop.municipality, coop.province].filter(Boolean).join(', ') || 'Location not provided'}
              </p>
            </div>
          </div>

          <div className="flex flex-col items-start gap-2 sm:items-end">
            <StatusBadge status={coop.status} />
            <p className="text-xs text-blue-200">
              Submitted {formatDate(coop.created_at, DATE_LONG)}
            </p>
          </div>
        </div>
      </section>

      <Alert>{error}</Alert>

      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[1.35fr_1fr]">
        {/* Left: information */}
        <div className="space-y-6">
          <Card>
            <h2 className="mb-5 text-sm font-bold text-gray-900">Cooperative information</h2>
            <dl className="grid grid-cols-1 gap-x-8 gap-y-5 sm:grid-cols-2">
              <InfoItem icon={MapPin} label="Office address" className="sm:col-span-2">
                {[coop.office_address, coop.municipality, coop.province].filter(Boolean).join(', ') ||
                  'Not provided'}
              </InfoItem>
              <InfoItem icon={Phone} label="Contact number">
                {coop.contact_number || 'Not provided'}
              </InfoItem>
              <InfoItem icon={Mail} label="Official email">
                {coop.official_email || 'Not provided'}
              </InfoItem>
              <InfoItem icon={CalendarDays} label="Submitted">
                {formatDate(coop.created_at, DATE_LONG)}
              </InfoItem>
              <InfoItem icon={Clock} label="Last updated">
                {hasBeenUpdated ? formatDate(coop.updated_at, DATE_LONG) : 'No changes since submission'}
              </InfoItem>
            </dl>
          </Card>

          <Card>
            <div className="mb-5 flex items-center justify-between gap-3">
              <h2 className="text-sm font-bold text-gray-900">Registered supervisor</h2>
              {supervisor && <StatusDot isActive={supervisor.is_active} />}
            </div>

            {supervisor ? (
              <>
                <div className="mb-5 flex items-center gap-4 rounded-xl bg-gray-50 p-4">
                  <Avatar name={supervisorName} size={48} />
                  <div className="min-w-0">
                    <p className="truncate text-base font-semibold text-gray-900">{supervisorName}</p>
                    <p className="text-xs text-gray-500">
                      Registered this cooperative and holds Owner access
                    </p>
                  </div>
                </div>
                <dl className="grid grid-cols-1 gap-x-8 gap-y-5 sm:grid-cols-2">
                  <InfoItem icon={Mail} label="Personal email (login)">
                    {supervisor.email}
                  </InfoItem>
                  <InfoItem icon={Phone} label="Contact number">
                    {supervisor.phone_number || 'Not provided'}
                  </InfoItem>
                </dl>
              </>
            ) : (
              <p className="text-sm text-gray-500">
                No supervisor account was found for this cooperative.
              </p>
            )}
          </Card>
        </div>

        {/* Right: decision + history */}
        <div className="space-y-6 lg:sticky lg:top-24">
          <Card>
            <h2 className="text-sm font-bold text-gray-900">{decision.title}</h2>
            <p className="mt-1.5 text-sm leading-relaxed text-gray-500">{decision.text}</p>

            {coop.status === 'Rejected' && coop.rejection_reason && (
              <div className="mt-4 flex gap-3 rounded-xl border border-red-100 bg-red-50 p-4">
                <ShieldAlert size={18} className="mt-0.5 shrink-0 text-red-600" aria-hidden="true" />
                <div>
                  <p className="text-xs font-semibold text-red-700">Reason given</p>
                  <p className="mt-0.5 text-sm text-red-800">{coop.rejection_reason}</p>
                </div>
              </div>
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
            <CooperativeStatusHistory logs={logs} submittedAt={coop.created_at} />
          </Card>
        </div>
      </div>
    </div>
  )
}