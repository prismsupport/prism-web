'use client'

import { useCallback, useEffect, useState } from 'react'
import PageHeader from '@/components/ui/PageHeader'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Alert from '@/components/ui/Alert'
import { PageLoading } from '@/components/ui/Skeleton'
import BillingIntegrationModal from '@/components/billing/BillingIntegrationModal'
import { BILLING_CHANGED_EVENT } from '@/components/billing/BillingIntegrationForm'
import { formatDateTime, DATETIME_FULL } from '@/lib/format'
import { toast } from '@/lib/toast'

const STATUS_STYLES = {
  connected: { text: 'Connected', cls: 'bg-green-50 text-green-700' },
  account_not_found: { text: 'Test account not found', cls: 'bg-amber-50 text-amber-700' },
  failed: { text: 'Last test failed', cls: 'bg-red-50 text-red-700' },
}

const STATUS_SUMMARIES = {
  connected: 'Your billing API is ready for consumers to use.',
  account_not_found: 'The connection works, but the last test account was not found.',
  failed: 'The last connection test failed. Review your settings and try again.',
}

const STATUS_BANNERS = {
  connected: {
    title: 'Billing connection is active',
    cls: 'border-green-200 bg-green-50 text-green-900',
  },
  account_not_found: {
    title: 'Billing connection needs attention',
    cls: 'border-amber-200 bg-amber-50 text-amber-900',
  },
  failed: {
    title: 'Billing connection needs attention',
    cls: 'border-red-200 bg-red-50 text-red-900',
  },
  unset: {
    title: 'Billing connection is not configured',
    cls: 'border-blue-200 bg-blue-50 text-blue-900',
  },
}

export default function BillingIntegrationPage() {
  const [status, setStatus] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showEdit, setShowEdit] = useState(false)

  const [testAccount, setTestAccount] = useState('')
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState(null)

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/supervisor/billing/config', { cache: 'no-store' })
      const body = await res.json()
      if (!res.ok) setError(body.error || 'Could not load billing settings.')
      else {
        setError('')
        setStatus(body)
      }
    } catch {
      setError('Could not load billing settings.')
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    load()
  }, [load])

  async function handleTest(e) {
    e.preventDefault()
    setTestResult(null)
    setTesting(true)
    try {
      const res = await fetch('/api/supervisor/billing/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accountNumber: testAccount }),
      })
      const body = await res.json()
      if (!res.ok) {
        toast.error(body.error || 'Test failed.')
      } else {
        setTestResult(body)
        await load()
        window.dispatchEvent(new Event(BILLING_CHANGED_EVENT))
      }
    } catch {
      toast.error('Test failed. Check your internet connection and try again.')
    }
    setTesting(false)
  }

  if (loading) return <PageLoading />

  const statusStyle = status?.lastTestStatus ? STATUS_STYLES[status.lastTestStatus] : null
  const statusSummary =
    STATUS_SUMMARIES[status?.lastTestStatus] ||
    'Connect and test your billing API before consumers use billing features.'
  const statusBanner = STATUS_BANNERS[status?.lastTestStatus] || STATUS_BANNERS.unset

  return (
    <div className="w-full">
      <PageHeader
        title="Billing Integration"
        description="Connect your billing system so consumers can register their account numbers and view their bills in the mobile app."
      />

      <Alert>{error}</Alert>

      <section className={`mb-6 rounded-2xl border p-5 sm:p-6 ${statusBanner.cls}`}>
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wide opacity-70">Connection status</p>
            <h2 className="mt-1 text-lg font-bold">{statusBanner.title}</h2>
            <p className="mt-1 text-sm opacity-80">{statusSummary}</p>
          </div>
          <Button
            dim={false}
            className="w-full shrink-0 border border-gray-900 bg-gray-900 text-white shadow-sm hover:bg-gray-800 sm:w-auto"
            onClick={() => setShowEdit(true)}
          >
            {status?.setupComplete ? 'Edit connection' : 'Set up connection'}
          </Button>
        </div>
      </section>

      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-2">
        <Card className="h-full">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-gray-400">Overview</p>
              <h2 className="mt-1 text-lg font-bold text-gray-900">Current connection</h2>
            </div>
            {statusStyle ? (
              <span className={`rounded-full px-3 py-1 text-xs font-bold ${statusStyle.cls}`}>
                {statusStyle.text}
              </span>
            ) : (
              <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-bold text-gray-600">
                Not tested
              </span>
            )}
          </div>

          <dl className="divide-y divide-gray-100 rounded-xl border border-gray-100">
            <div className="flex items-center justify-between gap-4 px-4 py-3">
              <dt className="text-sm text-gray-500">API address</dt>
              <dd className="max-w-[60%] truncate text-right text-sm font-medium text-gray-900">
                {status?.apiUrl ? 'Configured (hidden)' : 'Not set up'}
              </dd>
            </div>
            <div className="flex items-center justify-between gap-4 px-4 py-3">
              <dt className="text-sm text-gray-500">API key</dt>
              <dd className="text-sm font-medium text-gray-900">
                {status?.hasKey ? 'Saved securely' : 'Not set up'}
              </dd>
            </div>
            <div className="flex items-center justify-between gap-4 px-4 py-3">
              <dt className="text-sm text-gray-500">Last tested</dt>
              <dd className="text-right text-sm font-medium text-gray-900">
                {status?.lastTestedAt ? formatDateTime(status.lastTestedAt, DATETIME_FULL) : 'Never'}
              </dd>
            </div>
          </dl>
        </Card>

        <Card className="h-full">
          <div className="mb-5">
            <p className="text-xs font-bold uppercase tracking-wide text-gray-400">Verification</p>
            <h2 className="mt-1 text-lg font-bold text-gray-900">Test the connection</h2>
            <p className="mt-1 text-sm text-gray-500">
              Verify account lookup and bill history with a real account number.
            </p>
          </div>
          {!status?.hasKey && (
            <Alert tone="info" className="mb-4">
              Set up your billing API first to enable testing.
            </Alert>
          )}
          <form onSubmit={handleTest} className="flex flex-col gap-3">
            <label htmlFor="test-account" className="text-sm font-medium text-gray-700">
              Test account number
            </label>
            <div className="flex flex-col gap-2 sm:flex-row">
              <input
                id="test-account"
                required
                value={testAccount}
                onChange={(e) => setTestAccount(e.target.value)}
                placeholder="Enter an existing account number"
                className="min-w-0 flex-1 rounded-lg border border-gray-200 bg-gray-50 px-3.5 py-2.5 text-sm placeholder-gray-400"
              />
              <Button type="submit" variant="neutral" className="sm:shrink-0" disabled={testing || !status?.hasKey}>
                {testing ? 'Testing…' : 'Run test'}
              </Button>
            </div>
          </form>
          {testResult && (
            <Alert tone={testResult.ok ? 'success' : 'warning'} className="mt-4" role="status">
              {testResult.message}
            </Alert>
          )}
        </Card>
      </div>

      <Card className="mt-6">
        <div className="mb-5">
          <p className="text-xs font-bold uppercase tracking-wide text-gray-400">Integration guide</p>
          <h2 className="mt-1 text-lg font-bold text-gray-900">What your billing API needs to provide</h2>
          <p className="mt-1 text-sm text-gray-500">
            Both endpoints must accept the API key header and return JSON.
          </p>
        </div>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <div className="rounded-xl border border-gray-100 bg-gray-50/70 p-4">
            <p className="mb-2 text-xs font-bold uppercase tracking-wide text-gray-400">Account lookup</p>
            <code className="block break-all text-sm font-semibold text-gray-900">
              POST /api/registration/accounts/lookup
            </code>
            <p className="mt-2 text-sm text-gray-600">
              Returns the account, customer name, location, and account type.
            </p>
          </div>
          <div className="rounded-xl border border-gray-100 bg-gray-50/70 p-4">
            <p className="mb-2 text-xs font-bold uppercase tracking-wide text-gray-400">Bill history</p>
            <code className="block break-all text-sm font-semibold text-gray-900">
              GET /api/accounts/&#123;account number&#125;
            </code>
            <p className="mt-2 text-sm text-gray-600">
              Returns the account, bills, and paging details using limit and offset.
            </p>
          </div>
        </div>
      </Card>

      {showEdit && (
        <BillingIntegrationModal onClose={() => setShowEdit(false)} onConnected={load} />
      )}
    </div>
  )
}