'use client'

import Modal from '@/components/ui/Modal'
import Button from '@/components/ui/Button'
import BillingIntegrationForm from '@/components/billing/BillingIntegrationForm'

// The Edit dialog on the Billing Integration page. It can be closed freely.
export default function BillingIntegrationModal({ onClose, onConnected }) {
  return (
    <Modal title="Edit billing connection" onClose={onClose} size="xl" stickyHeader>
      <p className="text-sm text-gray-500 mb-4 -mt-2">
        Changes are tested before they are saved. If the test fails, your current connection stays
        as it is.
      </p>
      <BillingIntegrationForm
        onConnected={() => {
          onConnected?.()
          onClose()
        }}
        secondaryAction={
          <Button type="button" variant="outline" dim={false} onClick={onClose}>
            Cancel
          </Button>
        }
      />
    </Modal>
  )
}