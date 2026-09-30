'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import BillingRequestsTab from '@/components/users/BillingRequestsTab'
import BillingRequestDetailsModal from '@/components/users/BillingRequestDetailsModal'

export default function BillingRequestsPage() {
  const [billingRequests, setBillingRequests] = useState([])
  const [statusFilter, setStatusFilter] = useState('all')
  const [selectedRequest, setSelectedRequest] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    loadBilling()
  }, [])

  async function loadBilling() {
    setLoading(true)
    setError('')
    const supabase = createClient()

    const { data: billingData, error: billingError } = await supabase
      .from('consumer_bill_links')
      .select('*')
      .order('request_at', { ascending: false })

    if (billingError) {
      setError(billingError.message)
      setLoading(false)
      return
    }

    const consumerIds = (billingData || []).map((r) => r.consumer_id)
    let consumerNames = []
    if (consumerIds.length > 0) {
      const { data } = await supabase
        .from('users')
        .select('id, first_name, last_name')
        .in('id', consumerIds)
      consumerNames = data || []
    }

    const merged = (billingData || []).map((r) => ({
      ...r,
      consumerName: consumerNames.find((u) => u.id === r.consumer_id),
    }))

    setBillingRequests(merged)
    setLoading(false)
  }

  if (loading) return <p className="text-sm text-gray-500">Loading…</p>

  return (
    <div>
      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2 mb-4">
          {error}
        </p>
      )}
      <BillingRequestsTab
        billingRequests={billingRequests}
        statusFilter={statusFilter}
        onFilterChange={setStatusFilter}
        onSelectRequest={setSelectedRequest}
      />
      {selectedRequest && (
        <BillingRequestDetailsModal
          request={selectedRequest}
          onClose={() => setSelectedRequest(null)}
          onDecided={() => {
            setSelectedRequest(null)
            loadBilling()
          }}
        />
      )}
    </div>
  )
}