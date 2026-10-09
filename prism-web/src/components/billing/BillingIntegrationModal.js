'use client'

import { useEffect, useState } from 'react'
import Modal from '@/components/ui/Modal'

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
        setError(body.error || 'Could not save.')
      } else {
        setNotice('Saved. Run a test to confirm the connection.')
        await load(true)
      }
    } catch {
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
        setError(body.error || 'Test failed.')
      } else {
        setTestResult(body)
        await load(true)
      }
    } catch {
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
              <input
                value={apiUrl}
                onChange={(e) => setApiUrl(e.target.value)}
                placeholder="https://your-billing-api.example.com/api/accounts/"
                className={INPUT_CLS}
              />
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