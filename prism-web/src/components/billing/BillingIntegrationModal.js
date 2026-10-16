'use client'

import { useEffect, useState } from 'react'
import Modal from '@/components/ui/Modal'
import { toast } from '@/lib/toast'

const STATUS_STYLES = {
  connected: { text: 'Connected', cls: 'bg-green-50 text-green-700' },
  account_not_found: { text: 'Reachable, test account not found', cls: 'bg-amber-50 text-amber-700' },
  failed: { text: 'Last test failed', cls: 'bg-red-50 text-red-700' },
}

const INPUT_CLS =
  'w-full px-3.5 py-2.5 rounded-lg border border-gray-200 bg-gray-50 text-sm placeholder-gray-400'

export default function BillingIntegrationModal({ onClose }) {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [testing, setTesting] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [testResult, setTestResult] = useState(null)

  const [saved, setSaved] = useState(null)
  const [apiUrl, setApiUrl] = useState('')
  const [showApiUrl, setShowApiUrl] = useState(false)
  const [headerName, setHeaderName] = useState('X-api-key')
  const [apiKey, setApiKey] = useState('')
  const [enabled, setEnabled] = useState(false)
  const [testAccount, setTestAccount] = useState('')

  useEffect(() => {
    load()
  }, [])

  async function load(silent = false) {
    if (!silent) setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/supervisor/billing/config')
      const body = await res.json()
      if (!res.ok) {
        setError(body.error || 'Could not load billing settings.')
      } else {
        setSaved(body)
        setApiUrl(body.apiUrl)
        setHeaderName(body.headerName || 'X-api-key')
        setEnabled(body.enabled)
        setApiKey('')
      }
    } catch {
      setError('Could not load billing settings.')
    }
    setLoading(false)
  }

  const dirty =
    !!saved &&
    (apiUrl.trim().replace(/\/+$/, '') !== saved.apiUrl ||
      (headerName.trim() || 'X-api-key') !== saved.headerName ||
      enabled !== saved.enabled ||
      apiKey.trim() !== '')

  const canTest = !!saved?.apiUrl && !!saved?.hasKey && !dirty

  async function handleSave(e) {
    e.preventDefault()
    setError('')
    setNotice('')
    setTestResult(null)
    setSaving(true)
    try {
      const res = await fetch('/api/supervisor/billing/config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiUrl, headerName, apiKey, enabled }),
      })
      const body = await res.json()
      if (!res.ok) {
        toast.error(body.error || 'Could not save.')
        setError(body.error || 'Could not save.')
      } else {
        setNotice('Saved. Run a test to confirm the connection.')
        toast.success('Billing integration saved')
        await load(true)
      }
    } catch {
      toast.error('Could not save.')
      setError('Could not save.')
    }
    setSaving(false)
  }

  async function handleTest() {
    setError('')
    setNotice('')
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
        setError(body.error || 'Test failed.')
      } else {
        setTestResult(body)
        toast.success('Billing connection test completed')
        await load(true)
      }
    } catch {
      toast.error('Test failed.')
      setError('Test failed.')
    }
    setTesting(false)
  }

  const statusStyle = saved?.lastTestStatus ? STATUS_STYLES[saved.lastTestStatus] : null

  return (
    <Modal title="Billing Integration" onClose={onClose}>
      {loading ? (
        <p className="text-sm text-gray-500">Loading…</p>
      ) : (
        <>
          <p className="text-sm text-gray-500 mb-4 -mt-2">
            Connect your cooperative's billing inquiry API. It is used to check billing
            linkage requests against your real billing records.
          </p>

          <form onSubmit={handleSave}>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Billing API address
              </label>
              <div className="relative">
                <input
                  type={showApiUrl ? 'text' : 'password'}
                  autoComplete="off"
                  value={apiUrl}
                  onChange={(e) => setApiUrl(e.target.value)}
                  placeholder="https://your-billing-api.example.com/api/accounts/"
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
              <p className="text-xs text-gray-400 mt-1">
                Must start with https://. The account number is added to the end of this address.
              </p>
            </div>

            <div className="mb-4">
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

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">API key</label>
              <input
                type="password"
                autoComplete="off"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder={saved?.hasKey ? 'Saved. Leave blank to keep it' : 'Paste the API key'}
                className={INPUT_CLS}
              />
              <p className="text-xs text-gray-400 mt-1">
                The key is stored encrypted and is never shown again after saving.
              </p>
            </div>

            <label className="flex items-center gap-2 mb-4 cursor-pointer">
              <input
                type="checkbox"
                checked={enabled}
                onChange={(e) => setEnabled(e.target.checked)}
                className="w-4 h-4"
              />
              <span className="text-sm text-gray-700">
                Use this connection to verify billing requests
              </span>
            </label>

            {error && (
              <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2 mb-4">
                {error}
              </p>
            )}
            {notice && (
              <p className="text-sm text-green-700 bg-green-50 border border-green-100 rounded-lg px-3 py-2 mb-4">
                {notice}
              </p>
            )}

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-lg text-sm font-semibold text-gray-600 border border-gray-200 hover:bg-gray-50"
              >
                Close
              </button>
              <button
                type="submit"
                disabled={saving || !dirty}
                className="px-4 py-2.5 rounded-lg text-sm font-semibold text-white bg-blue-700 hover:bg-blue-800 disabled:opacity-50"
              >
                {saving ? 'Saving…' : 'Save'}
              </button>
            </div>
          </form>

          <div className="border-t border-gray-100 mt-6 pt-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-bold text-gray-500 uppercase">Test connection</p>
              {statusStyle && (
                <span className={`text-xs font-bold px-2 py-0.5 rounded ${statusStyle.cls}`}>
                  {statusStyle.text}
                </span>
              )}
            </div>
            {saved?.lastTestedAt && (
              <p className="text-xs text-gray-400 mb-2">
                Last tested{' '}
                {new Date(saved.lastTestedAt).toLocaleString('en-PH', {
                  month: 'short',
                  day: 'numeric',
                  hour: 'numeric',
                  minute: '2-digit',
                })}
              </p>
            )}

            <div className="flex gap-2">
              <input
                value={testAccount}
                onChange={(e) => setTestAccount(e.target.value)}
                placeholder="An account number that exists"
                className={INPUT_CLS}
              />
              <button
                type="button"
                onClick={handleTest}
                disabled={!canTest || !testAccount.trim() || testing}
                className="px-4 py-2.5 rounded-lg text-sm font-semibold text-blue-700 border border-blue-200 hover:bg-blue-50 disabled:opacity-50 whitespace-nowrap"
              >
                {testing ? 'Testing…' : 'Test'}
              </button>
            </div>
            {!canTest && (
              <p className="text-xs text-gray-400 mt-1">
                Save your settings first, then you can test.
              </p>
            )}

            {testResult && (
              <p
                className={`text-sm rounded-lg px-3 py-2 mt-3 border ${
                  testResult.ok
                    ? 'text-green-700 bg-green-50 border-green-100'
                    : 'text-amber-800 bg-amber-50 border-amber-200'
                }`}
              >
                {testResult.message}
              </p>
            )}
          </div>
        </>
      )}
    </Modal>
  )
}