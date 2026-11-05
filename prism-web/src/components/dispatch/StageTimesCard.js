'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  STAGES,
  computeStageTimes,
  formatDuration,
  slowestStageKey,
} from '@/lib/stageTimes'

export default function StageTimesCard({ reportId, masterId }) {
  const [attempts, setAttempts] = useState(null)
  const [threshold, setThreshold] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    setLoading(true)

    async function load() {
      const supabase = createClient()
      const column = reportId ? 'report_id' : 'master_id'
      const ticketId = reportId || masterId

      const { data: assignmentData } = await supabase
        .from('job_assignments')
        .select('*')
        .eq(column, ticketId)
        .order('assigned_at', { ascending: true })

      const list = assignmentData || []
      if (list.length === 0) {
        if (!cancelled) {
          setAttempts([])
          setLoading(false)
        }
        return
      }

      const ids = list.map((a) => a.assignment_id)
      const [logRes, startRes, settingsRes] = await Promise.all([
        supabase
          .from('job_assignment_status_logs')
          .select('assignment_id, new_status, changed_at')
          .in('assignment_id', ids),
        reportId
          ? supabase.from('reports').select('created_at').eq('report_id', reportId).maybeSingle()
          : supabase
              .from('reports')
              .select('created_at')
              .eq('master_id', masterId)
              .order('created_at', { ascending: true })
              .limit(1)
              .maybeSingle(),
        supabase
          .from('cooperative_settings')
          .select('response_time_threshold_minutes')
          .maybeSingle(),
      ])

      const logs = logRes.data || []
      const ticketStart = startRes.data?.created_at || null

      const built = list.map((a, i) => ({
        number: i + 1,
        isCurrent: i === list.length - 1,
        stages: computeStageTimes(
          a,
          logs.filter((l) => l.assignment_id === a.assignment_id),
          i === 0 ? ticketStart : null
        ),
      }))

      if (cancelled) return
      setThreshold(settingsRes.data?.response_time_threshold_minutes ?? null)
      setAttempts(built)
      setLoading(false)
    }

    load()
    return () => {
      cancelled = true
    }
  }, [reportId, masterId])

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center gap-2 text-sm font-bold text-gray-900">
          <span
            className="h-4 w-4 animate-spin rounded-full border-2 border-gray-200 border-t-blue-600"
            aria-hidden="true"
          />
          Loading time per stage…
        </div>
      </div>
    )
  }

  if (!attempts || attempts.length === 0) return null

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <h2 className="text-sm font-bold text-gray-900 mb-1">Time per Stage</h2>
      <p className="text-xs text-gray-400 mb-4">
        How long each step of the repair took. A dash means that step was not recorded.
      </p>

      <div className="space-y-5">
        {attempts.map((attempt) => {
          const slowest = slowestStageKey(attempt.stages)
          const rows = STAGES.filter((s) => attempt.number === 1 || s.key !== 'waiting')
          const max = Math.max(...rows.map((s) => attempt.stages[s.key] || 0), 1)

          return (
            <div key={attempt.number}>
              {attempts.length > 1 && (
                <p className="text-xs font-bold text-gray-500 uppercase mb-2">
                  Attempt {attempt.number}
                  {attempt.isCurrent && (
                    <span className="ml-2 text-[10px] font-bold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded">
                      CURRENT
                    </span>
                  )}
                </p>
              )}

              <div className="space-y-2.5">
                {rows.map((s) => {
                  const value = attempt.stages[s.key]
                  const overThreshold =
                    s.key === 'waiting' && threshold != null && value != null && value > threshold
                  const isSlowest = slowest === s.key
                  return (
                    <div key={s.key}>
                      <div className="flex items-center justify-between text-sm mb-1">
                        <span className="text-gray-700" title={s.hint}>
                          {s.label}
                          {isSlowest && (
                            <span className="ml-2 text-[10px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded">
                              SLOWEST
                            </span>
                          )}
                          {overThreshold && (
                            <span className="ml-2 text-[10px] font-bold text-red-700 bg-red-50 px-1.5 py-0.5 rounded">
                              OVER {threshold} MIN LIMIT
                            </span>
                          )}
                        </span>
                        <span
                          className={`font-semibold tabular-nums ${
                            value == null ? 'text-gray-300' : 'text-gray-900'
                          }`}
                        >
                          {formatDuration(value)}
                        </span>
                      </div>
                      <div className="h-1.5 w-full rounded-full bg-gray-100">
                        {value != null && (
                          <div
                            className={`h-1.5 rounded-full ${
                              overThreshold ? 'bg-red-500' : isSlowest ? 'bg-amber-400' : 'bg-blue-600'
                            }`}
                            style={{ width: `${Math.max(2, (value / max) * 100)}%` }}
                          />
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>

              <div className="flex items-center justify-between border-t border-gray-100 mt-3 pt-2 text-sm">
                <span className="font-semibold text-gray-700">
                  {attempt.number === 1 ? 'Total (submission to approval)' : 'Total (dispatch to approval)'}
                </span>
                <span className="font-bold text-gray-900 tabular-nums">
                  {formatDuration(attempt.stages.total)}
                </span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}