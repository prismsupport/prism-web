'use client'

import { useEffect, useState } from 'react'
import Alert from '@/components/ui/Alert'
import Button from '@/components/ui/Button'
import { toast } from '@/lib/toast'

const INPUT_CLS =
  'w-full px-3.5 py-2.5 rounded-lg border border-gray-200 bg-gray-50 text-sm placeholder-gray-400'

// Fired after a successful connection so other parts of the dashboard
// (the setup popup, the attention banner, the Billing page) can refresh.
export const BILLING_CHANGED_EVENT = 'billing-integration-changed'

// The form used by both the setup popup and the Edit dialog.
// secondaryAction is the button shown next to Connect (Cancel or Log out).
export default function BillingIntegrationForm({ onConnected, secondaryAction, compact = false }) {
  const [loading, setLoading] = useState(true)
  const [connecting, setConnecting] = useState(false)
  const [error, setError] = useState('')

  const [saved, setSaved] = useState(null)
  const [apiUrl, setApiUrl] = useState('')
  const [showApiUrl, setShowApiUrl] = useState(false)
  const [headerName, setHeaderName] = useState('X-api-key')
  const [apiKey, setApiKey] = useState('')
  const [accountNumber, setAccountNumber] = useState('')

  useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        const res = await fetch('/api/supervisor/billing/config', { cache: 'no-store' })
        const body = await res.json()
        if (cancelled) return
        if (!res.ok) {
          setError(body.error || 'Could not load billing settings.')
        } else {
          setSaved(body)
          setApiUrl(body.apiUrl || '')
          setHeaderName(body.headerName || 'X-api-key')
        }
      } catch {
        if (!cancelled) setError('Could not load billing settings.')
      }
      if (!cancelled) setLoading(false)
    }

    load()
    return () => {
      cancelled = true
    }
  }, [])

  async function handleConnect(e) {
    e.preventDefault()
    setError('')
    setConnecting(true)

    try {
      const res = await fetch('/api/supervisor/billing/config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiUrl, headerName, apiKey, accountNumber }),
      })
      const body = await res.json()

      if (!res.ok) {
        setError(body.error || 'Could not connect.')
      } else if (body.ok === false) {
        setError(body.message || 'The connection test failed. Nothing was saved.')
      } else {
        toast.success('Billing integration connected')
        window.dispatchEvent(new Event(BILLING_CHANGED_EVENT))
        onConnected?.()
        return
      }
    } catch {
      setError('Could not connect. Check your internet connection and try again.')
    }

    setConnecting(false)
  }

  if (loading) return <p className="text-sm text-gray-500">Loading…</p>

  return (
    <form onSubmit={handleConnect}>
      <fieldset className={compact ? 'mb-4' : 'mb-5'}>
        <legend className="text-sm font-bold text-gray-900 mb-3">API details</legend>
        <div className={compact ? 'mb-3' : 'mb-4'}>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          Billing API address
        </label>
        <div className="relative">
          <input
            type={showApiUrl ? 'text' : 'password'}
            autoComplete="off"
            required
            value={apiUrl}
            onChange={(e) => setApiUrl(e.target.value)}
            placeholder="https://billing.your-cooperative.com"
            aria-describedby="billing-api-help"
            className={`${INPUT_CLS} pr-10`}
          />
          <button
            type="button"
            onClick={() => setShowApiUrl((visible) => !visible)}
            aria-label={showApiUrl ? 'Hide billing API address' : 'Show billing API address'}
            title={showApiUrl ? 'Hide billing API address' : 'Show billing API address'}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-4 w-4"
              aria-hidden="true"
            >
              {showApiUrl ? (
                <>
                  <path d="M2.06 12.35a1 1 0 0 1 0-.7A10.94 10.94 0 0 1 12 5c5.52 0 9.64 3.8 9.94 6.65a1 1 0 0 1 0 .7C21.64 15.2 17.52 19 12 19a10.94 10.94 0 0 1-9.94-6.65Z" />
                  <circle cx="12" cy="12" r="3" />
                </>
              ) : (
                <>
                  <path d="m3 3 18 18" />
                  <path d="M10.58 10.58a2 2 0 0 0 2.83 2.83" />
                  <path d="M9.88 5.09A10.94 10.94 0 0 1 12 5c5.52 0 9.64 3.8 9.94 6.65a1 1 0 0 1 0 .7 10.96 10.96 0 0 1-4.18 4.93" />
                  <path d="M6.61 6.61A10.96 10.96 0 0 0 2.06 11.65a1 1 0 0 0 0 .7A10.94 10.94 0 0 0 12 19c.74 0 1.46-.08 2.14-.23" />
                </>
              )}
            </svg>
          </button>
        </div>
        <p id="billing-api-help" className="text-xs text-gray-400 mt-1">
          Enter the base address only, starting with https://. The mobile app adds the paths it needs.
        </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Header name for the API key
          </label>
          <input
            value={headerName}
            onChange={(e) => setHeaderName(e.target.value)}
            placeholder="X-api-key"
            className={INPUT_CLS}
          />
        </div>
      </fieldset>

      <fieldset className={`${compact ? 'mb-4 pt-4' : 'mb-5 pt-5'} border-t border-gray-100`}>
        <legend className="text-sm font-bold text-gray-900 mb-3">Authentication</legend>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">API key</label>
        <input
          type="password"
          autoComplete="new-password"
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          placeholder={saved?.hasKey ? 'Saved. Leave blank to keep it' : 'Paste the API key'}
          className={INPUT_CLS}
        />
        <p className="text-xs text-gray-400 mt-1">
          The key is stored encrypted and is never shown again after saving.
        </p>
      </fieldset>

      <fieldset className={`${compact ? 'mb-4 pt-4' : 'mb-5 pt-5'} border-t border-gray-100`}>
        <legend className="text-sm font-bold text-gray-900 mb-3">Connection test</legend>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          Test account number
        </label>
        <input
          required
          value={accountNumber}
          onChange={(e) => setAccountNumber(e.target.value)}
          placeholder="An account number that exists in your billing system"
          className={INPUT_CLS}
        />
        <p className="text-xs text-gray-400 mt-1">
          Used once to test the connection. It is not saved. Nothing is saved unless the test passes.
        </p>
      </fieldset>

      <Alert role="alert">{error}</Alert>

      {connecting && (
        <p className="text-xs text-gray-500 mb-3" role="status" aria-live="polite">
          Testing the connection. This can take up to 30 seconds.
        </p>
      )}

      <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3">
        {secondaryAction}
        <Button type="submit" disabled={connecting} className="sm:w-auto">
          {connecting ? 'Connecting…' : 'Connect and test'}
        </Button>
      </div>
    </form>
  )
}