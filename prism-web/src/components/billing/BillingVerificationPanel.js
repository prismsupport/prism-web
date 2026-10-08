'use client'

import { useEffect, useState } from 'react'

const RESULT_STYLES = {
  match: { icon: '✓', text: 'Match', cls: 'text-green-700 bg-green-50' },
  similar: { icon: '~', text: 'Similar', cls: 'text-amber-700 bg-amber-50' },
  mismatch: { icon: '✗', text: 'No match', cls: 'text-red-700 bg-red-50' },
  unknown: { icon: '—', text: 'Not available', cls: 'text-gray-500 bg-gray-100' },
}

const VERDICTS = {
  likely_valid: {
    label: 'Account found — details match',
    detail: 'The request matches the cooperative billing record.',
    cls: 'bg-green-50 border-green-200 text-green-800',
  },
  needs_review: {
    label: 'Account found — needs your review',
    detail:
      "The account exists, but the requester's registered name differs from the account holder. This can be legitimate (e.g. a family member's bill).",
    cls: 'bg-amber-50 border-amber-200 text-amber-800',
  },
  mismatch: {
    label: 'Account found — name does not match',
    detail: 'The account name in the request does not match the name on the billing record.',
    cls: 'bg-red-50 border-red-200 text-red-800',
  },
  not_found: {
    label: 'Account not found',
    detail: 'No record with this account number exists in the cooperative billing system.',
    cls: 'bg-red-50 border-red-200 text-red-800',
  },
}

export default function BillingVerificationPanel({ linkId, onVerdict }) {
  const [state, setState] = useState({ loading: true })

  useEffect(() => {
    let cancelled = false

    async function run() {
      setState({ loading: true })
      try {
        const res = await fetch('/api/supervisor/billing/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ linkId }),
        })
        const body = await res.json()
        if (cancelled) return

        if (!res.ok) {
          setState({ loading: false, available: false, message: body.error || 'Verification failed.' })
          onVerdict?.(null)
          return
        }
        setState({ loading: false, ...body })
        onVerdict?.(body.verdict || null)
      } catch {
        if (cancelled) return
        setState({ loading: false, available: false, message: 'Verification failed.' })
        onVerdict?.(null)
      }
    }

    run()
    return () => {
      cancelled = true
    }
  }, [linkId])

  return (
    <div className="border-t border-gray-100 pt-4 mb-4">
      <p className="text-xs font-bold text-gray-500 uppercase mb-3">
        Verification against cooperative billing records
      </p>

      {state.loading && <p className="text-sm text-gray-500">Checking billing records…</p>}

      {!state.loading && state.available === false && (
        <p className="text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
          {state.message} Please verify this request manually before deciding.
        </p>
      )}

      {!state.loading && state.available && (
        <>
          <div className={`border rounded-lg px-3 py-2 mb-3 ${VERDICTS[state.verdict]?.cls}`}>
            <p className="text-sm font-bold">{VERDICTS[state.verdict]?.label}</p>
            <p className="text-xs mt-0.5">{VERDICTS[state.verdict]?.detail}</p>
          </div>

          {state.checks?.length > 0 && (
            <div className="border border-gray-200 rounded-lg overflow-hidden mb-3">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 text-left text-xs text-gray-500 uppercase tracking-wide">
                    <th className="px-3 py-2 font-semibold">Field</th>
                    <th className="px-3 py-2 font-semibold">Consumer's request</th>
                    <th className="px-3 py-2 font-semibold">Billing record</th>
                    <th className="px-3 py-2 font-semibold">Result</th>
                  </tr>
                </thead>
                <tbody>
                  {state.checks.map((c) => {
                    const style = RESULT_STYLES[c.result] || RESULT_STYLES.unknown
                    return (
                      <tr key={c.key} className="border-t border-gray-100">
                        <td className="px-3 py-2 text-gray-500">{c.label}</td>
                        <td className="px-3 py-2 text-gray-900 font-medium">{c.requested}</td>
                        <td className="px-3 py-2 text-gray-900 font-medium">{c.record}</td>
                        <td className="px-3 py-2">
                          <span className={`text-xs font-bold px-2 py-0.5 rounded ${style.cls}`}>
                            {style.icon} {style.text}
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}

          {state.latestBill && (
            <p className="text-xs text-gray-500">
              Latest bill on record: {state.latestBill.period} · {state.latestBill.status}
              {state.latestBill.dueDate &&
                ` · due ${new Date(state.latestBill.dueDate).toLocaleDateString('en-PH', {
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric',
                })}`}
            </p>
          )}
        </>
      )}
    </div>
  )
}