'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Modal from '@/components/ui/Modal'

const MAX_RECENT = 20

function Stars({ value }) {
  return (
    <span className="text-amber-500 tracking-tight">
      {'★'.repeat(value)}
      <span className="text-gray-300">{'☆'.repeat(5 - value)}</span>
    </span>
  )
}

export default function LinemanRatingsModal({ lineman, periodLabel, onClose }) {
  const [names, setNames] = useState({})
  const [tickets, setTickets] = useState({})
  const [loading, setLoading] = useState(true)

  const recent = (lineman.ratings || []).slice(0, MAX_RECENT)
  const maxBar = Math.max(...Object.values(lineman.distribution), 1)

  useEffect(() => {
    let cancelled = false

    async function load() {
      setLoading(true)
      const supabase = createClient()

      const consumerIds = Array.from(new Set(recent.map((r) => r.consumer_id)))
      const assignmentIds = Array.from(new Set(recent.map((r) => r.assignment_id)))

      const nameMap = {}
      if (consumerIds.length > 0) {
        const { data } = await supabase
          .from('users')
          .select('id, first_name, last_name')
          .in('id', consumerIds)
        ;(data || []).forEach((u) => {
          nameMap[u.id] = `${u.first_name} ${u.last_name}`
        })
      }

      // Work out which ticket each rating belongs to
      const ticketMap = {}
      if (assignmentIds.length > 0) {
        const { data: assignments } = await supabase
          .from('job_assignments')
          .select('assignment_id, report_id, master_id')
          .in('assignment_id', assignmentIds)

        const reportIds = Array.from(
          new Set((assignments || []).map((a) => a.report_id).filter(Boolean))
        )
        const masterIds = Array.from(
          new Set((assignments || []).map((a) => a.master_id).filter(Boolean))
        )

        const reportLabels = {}
        if (reportIds.length > 0) {
          const { data } = await supabase
            .from('reports')
            .select('report_id, ticket_number')
            .in('report_id', reportIds)
          ;(data || []).forEach((r) => {
            reportLabels[r.report_id] = r.ticket_number
          })
        }

        const masterLabels = {}
        if (masterIds.length > 0) {
          const { data } = await supabase
            .from('master_tickets')
            .select('master_id, master_ticket')
            .in('master_id', masterIds)
          ;(data || []).forEach((m) => {
            masterLabels[m.master_id] = m.master_ticket
          })
        }

        ;(assignments || []).forEach((a) => {
          ticketMap[a.assignment_id] = a.report_id
            ? reportLabels[a.report_id]
            : masterLabels[a.master_id]
        })
      }

      if (cancelled) return
      setNames(nameMap)
      setTickets(ticketMap)
      setLoading(false)
    }

    load()
    return () => {
      cancelled = true
    }
  }, [lineman.id])

  return (
    <Modal title={`${lineman.first_name} ${lineman.last_name}`} onClose={onClose} size="xl">
      <div className="flex items-start justify-between mb-5">
        <div>
          <p className="text-sm text-gray-500">
            {lineman.areaOffice || 'No area office'} · {periodLabel}
          </p>
        </div>
        {lineman.ratingCount > 0 ? (
          <div className="text-right">
            <p className="text-2xl font-bold text-gray-900">
              <span className="text-amber-500">★</span> {lineman.ratingAverage.toFixed(1)}
            </p>
            <p className="text-xs text-gray-400">
              from {lineman.ratingCount} rating{lineman.ratingCount === 1 ? '' : 's'}
            </p>
          </div>
        ) : (
          <p className="text-sm text-gray-400">No ratings in this period</p>
        )}
      </div>

      {lineman.ratingCount > 0 && (
        <div className="space-y-1.5 mb-6">
          {[5, 4, 3, 2, 1].map((star) => (
            <div key={star} className="flex items-center gap-3 text-xs">
              <span className="w-8 text-gray-500">{star} ★</span>
              <div className="flex-1 bg-gray-100 rounded-full h-2">
                <div
                  className="bg-amber-400 h-2 rounded-full"
                  style={{ width: `${(lineman.distribution[star] / maxBar) * 100}%` }}
                />
              </div>
              <span className="w-6 text-right text-gray-600">{lineman.distribution[star]}</span>
            </div>
          ))}
        </div>
      )}

      <p className="text-xs font-bold text-gray-500 uppercase mb-2">
        Recent ratings{lineman.ratingCount > MAX_RECENT ? ` (latest ${MAX_RECENT})` : ''}
      </p>

      {loading && <p className="text-sm text-gray-500">Loading…</p>}

      {!loading && recent.length === 0 && (
        <p className="text-sm text-gray-500">Nothing to show for this period.</p>
      )}

      <div className="space-y-2">
        {!loading &&
          recent.map((r) => (
            <div key={r.rating_id} className="border border-gray-200 rounded-lg p-3">
              <div className="flex items-center justify-between">
                <Stars value={r.rating} />
                <span className="text-xs text-gray-400">
                  {new Date(r.created_at).toLocaleDateString('en-PH', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {names[r.consumer_id] || 'Consumer'}
                {tickets[r.assignment_id] ? ` · ${tickets[r.assignment_id]}` : ''}
              </p>
              {r.comment ? (
                <p className="text-sm text-gray-700 bg-gray-50 rounded-lg p-2 mt-2">
                  "{r.comment}"
                </p>
              ) : (
                <p className="text-xs text-gray-400 italic mt-2">No comment</p>
              )}
            </div>
          ))}
      </div>
    </Modal>
  )
}