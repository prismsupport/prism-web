'use client'

import { useState } from 'react'
import Modal from '@/components/ui/Modal'
import FormSection from '@/components/ui/FormSection'
import FormField from '@/components/ui/FormField'
import StatusDot from '@/components/ui/StatusDot'

export default function ConsumerDetailsModal({ consumer, onClose, onToggleActive }) {
  const [toggling, setToggling] = useState(false)

  async function handleToggle() {
    setToggling(true)
    await onToggleActive(consumer.id, consumer.is_active)
    setToggling(false)
  }

  return (
    <Modal title="Consumer Details" onClose={onClose}>
      <div className="mb-4">
        <StatusDot isActive={consumer.is_active} />
      </div>

      <FormSection title="Consumer Identity">
        <FormField
          label="Full Name"
          value={`${consumer.first_name} ${consumer.last_name}`}
          disabled
        />
        <FormField label="Contact Number" value={consumer.phone_number || '—'} disabled />
      </FormSection>

      <FormSection title="Location">
        <FormField label="Zone" value={consumer.zone || '—'} disabled />
        <FormField label="Barangay" value={consumer.barangay || '—'} disabled />
        <FormField label="Municipality" value={consumer.municipality || '—'} disabled />
      </FormSection>

      <button
        onClick={handleToggle}
        disabled={toggling}
        className={`w-full py-2.5 rounded-lg text-sm font-semibold transition-colors disabled:opacity-60 ${
          consumer.is_active
            ? 'bg-gray-100 hover:bg-gray-200 text-gray-700'
            : 'bg-blue-700 hover:bg-blue-800 text-white'
        }`}
      >
        {toggling ? 'Working…' : consumer.is_active ? 'Deactivate Account' : 'Reactivate Account'}
      </button>
    </Modal>
  )
}