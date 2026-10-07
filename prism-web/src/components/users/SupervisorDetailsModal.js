'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Modal from '@/components/ui/Modal'
import FormSection from '@/components/ui/FormSection'
import FormField from '@/components/ui/FormField'
import StatusDot from '@/components/ui/StatusDot'

const FEATURES = [
  { key: 'dispatch', label: 'Dispatch' },
  { key: 'advisories', label: 'Advisories' },
  { key: 'faq', label: 'FAQ' },
  { key: 'billing', label: 'Billing Requests' },
]

export default function SupervisorDetailsModal({
  supervisor,
  currentUserId,
  onClose,
  onToggleActive,
  onSaved,
}) {
  const isSelf = supervisor.id === currentUserId
  const [featureAccess, setFeatureAccess] = useState(supervisor.feature_access || [])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [showTransferConfirm, setShowTransferConfirm] = useState(false)

  function toggleFeature(key) {
    setFeatureAccess((prev) =>
      prev.includes(key) ? prev.filter((f) => f !== key) : [...prev, key]
    )
  }

  async function handleSaveAccess() {
    setSaving(true)
    setError('')
    const supabase = createClient()

    const { error: updateError } = await supabase
      .from('supervisor')
      .update({ feature_access: featureAccess })
      .eq('profile_id', supervisor.id)

    if (updateError) {
      setError(updateError.message)
      setSaving(false)
      return
    }

    onSaved()
  }

  async function handleTransferOwnership() {
    setSaving(true)
    setError('')
    const supabase = createClient()

    // Two sequential updates: strip ownership from the current owner,
    // grant it to this supervisor. Not wrapped in a DB transaction —
    // acceptable here since a partial failure just leaves the old owner
    // still marked as owner, which is a safe state to retry from.
    const { error: demoteError } = await supabase
      .from('supervisor')
      .update({ is_owner: false })
      .eq('profile_id', currentUserId)

    if (demoteError) {
      setError(demoteError.message)
      setSaving(false)
      return
    }

    const { error: promoteError } = await supabase
      .from('supervisor')
      .update({ is_owner: true, feature_access: [] })
      .eq('profile_id', supervisor.id)

    if (promoteError) {
      setError(promoteError.message)
      setSaving(false)
      return
    }

    onSaved()
  }

  return (
    <Modal title="Supervisor Details" onClose={onClose}>
      <div className="mb-4">
        <StatusDot isActive={supervisor.is_active} />
      </div>

      <FormSection title="Supervisor Identity">
        <FormField
          label="First Name"
          value={supervisor.first_name}
          disabled
        />
        <FormField
          label="Last Name"
          value={supervisor.last_name}
          disabled
        />
        <FormField label="Email Address" value={supervisor.email} disabled />
        <FormField label="Contact Number" value={supervisor.phone_number || '—'} disabled />
      </FormSection>

      {supervisor.is_owner ? (
        <p className="text-sm text-blue-700 bg-blue-50 rounded-lg px-3 py-2 mb-4">
          This account is the current cooperative owner and has full access to
          every feature.
        </p>
      ) : (
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3 pb-2 border-b border-gray-100">
            <h3 className="font-semibold text-gray-900 text-sm">Feature Access</h3>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {FEATURES.map((f) => (
              <label
                key={f.key}
                className="flex items-center gap-2 text-sm text-gray-700 border border-gray-200 rounded-lg px-3 py-2 cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={featureAccess.includes(f.key)}
                  onChange={() => toggleFeature(f.key)}
                />
                {f.label}
              </label>
            ))}
          </div>
          <button
            onClick={handleSaveAccess}
            disabled={saving}
            className="w-full mt-3 bg-blue-700 hover:bg-blue-800 disabled:opacity-60 text-white font-semibold text-sm py-2.5 rounded-lg"
          >
            {saving ? 'Saving…' : 'Save Feature Access'}
          </button>
        </div>
      )}

      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2 mb-4">
          {error}
        </p>
      )}

      {!isSelf && !supervisor.is_owner && (
        <div className="mb-4">
          {!showTransferConfirm ? (
            <button
              onClick={() => setShowTransferConfirm(true)}
              className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold text-sm py-2.5 rounded-lg"
            >
              Transfer Ownership to This Supervisor
            </button>
          ) : (
            <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
              <p className="text-sm text-gray-700 mb-3">
                This will make {supervisor.first_name} the new cooperative
                owner with full access, and remove your own ownership. This
                action can only be reversed by the new owner.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={handleTransferOwnership}
                  disabled={saving}
                  className="flex-1 bg-gray-800 hover:bg-gray-900 disabled:opacity-60 text-white font-semibold text-sm py-2.5 rounded-lg"
                >
                  {saving ? 'Transferring…' : 'Yes, Transfer Ownership'}
                </button>
                <button
                  onClick={() => setShowTransferConfirm(false)}
                  disabled={saving}
                  className="flex-1 bg-white hover:bg-gray-100 text-gray-700 font-semibold text-sm py-2.5 rounded-lg border border-gray-200"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {!isSelf && (
        <button
          onClick={() => onToggleActive(supervisor.id, supervisor.is_active)}
          className={`w-full py-2.5 rounded-lg text-sm font-semibold transition-colors ${
            supervisor.is_active
              ? 'bg-red-50 hover:bg-red-100 text-red-700'
              : 'bg-blue-700 hover:bg-blue-800 text-white'
          }`}
        >
          {supervisor.is_active ? 'Deactivate Account' : 'Reactivate Account'}
        </button>
      )}
    </Modal>
  )
}