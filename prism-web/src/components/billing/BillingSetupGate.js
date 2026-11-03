'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { usePermissions } from '@/lib/supervisor/PermissionsContext'
import ModalBackdrop from '@/components/ui/ModalBackdrop'
import Button from '@/components/ui/Button'
import BillingIntegrationForm, {
  BILLING_CHANGED_EVENT,
} from '@/components/billing/BillingIntegrationForm'

const ATTENTION_TEXT = {
  failed: 'The last test failed, so consumers may not be able to register or view their bills.',
  account_not_found: 'The last test could not find the test account.',
}

// Shown to the cooperative Owner only.
//  - Popup: cannot be closed until the billing connection has been set up successfully.
//  - Banner: shown after setup when the last test did not pass, or was never run.
export default function BillingSetupGate({ onLogout }) {
  const pathname = usePathname()
  const { isOwner, loading } = usePermissions()
  const [status, setStatus] = useState(null)

  const refresh = useCallback(async () => {
    try {
      const res = await fetch('/api/supervisor/billing/config', { cache: 'no-store' })
      if (!res.ok) return
      setStatus(await res.json())
    } catch {
      // A failed check never blocks the dashboard.
    }
  }, [])

  useEffect(() => {
    if (!loading && isOwner) refresh()
  }, [loading, isOwner, refresh])

  useEffect(() => {
    window.addEventListener(BILLING_CHANGED_EVENT, refresh)
    return () => window.removeEventListener(BILLING_CHANGED_EVENT, refresh)
  }, [refresh])

  if (loading || !isOwner || !status) return null

  if (!status.setupComplete) {
    return (
      <ModalBackdrop role="dialog" aria-modal="true" aria-label="Connect your billing system">
        <div className="bg-white rounded-2xl shadow-lg w-full max-w-2xl">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="text-lg font-bold text-gray-900">Connect your billing system</h2>
            <p className="text-sm text-gray-500 mt-1">
              Consumers need this to register their account numbers and view their bills in the
              mobile app. You can use the rest of the dashboard once the connection works.
            </p>
          </div>
          <div className="p-6">
            <BillingIntegrationForm
              compact
              onConnected={refresh}
              secondaryAction={
                <Button type="button" variant="outline" dim={false} onClick={onLogout}>
                  Log out
                </Button>
              }
            />
          </div>
        </div>
      </ModalBackdrop>
    )
  }

  if (status.lastTestStatus !== 'connected' && !pathname.startsWith('/supervisor/billing')) {
    const text =
      ATTENTION_TEXT[status.lastTestStatus] ||
      'This connection has not been tested with the current setup yet.'
    return (
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
        <p className="text-sm text-amber-900">
          <span className="font-semibold">Check your billing connection.</span> {text}
        </p>
        <Link
          href="/supervisor/billing"
          className="whitespace-nowrap rounded-lg bg-white px-3.5 py-2 text-xs font-semibold text-amber-900 border border-amber-200 hover:bg-amber-100 transition-colors"
        >
          Open Billing Integration
        </Link>
      </div>
    )
  }

  return null
}