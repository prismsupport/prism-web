'use client'

import { useState } from 'react'
import { issueLabel } from '@/lib/issueCodes'
import { groupByCategory, matchesSearch } from '@/lib/ticketGrouping'
import SearchInput from '@/components/ui/SearchInput'
import StatusPill from '@/components/ui/StatusPill'
import ReporterInfo from '@/components/dispatch/ReporterInfo'
import MatchReviewCard from '@/components/dispatch/MatchReviewCard'
import CategoryGroupHeader from '@/components/dispatch/CategoryGroupHeader'

// members = reports of the Master Ticket (with reporterName), codes = { report_id: issue_code }
export default function MasterAffectedConsumers({ members, codes }) {
  const [searchText, setSearchText] = useState('')
  const [expandedId, setExpandedId] = useState(null)

  const items = members
    .map((m) => ({ m, id: m.report_id, code: codes[m.report_id] ?? null, created: m.created_at }))
    .filter(({ m, code }) =>
      matchesSearch(
        [
          m.reporterName?.first_name,
          m.reporterName?.last_name,
          m.ticket_number,
          m.nearest_landmark,
          m.zone,
          m.barangay,
          m.municipality,
          m.report_details,
          issueLabel(code),
        ],
        searchText
      )
    )

  const groups = groupByCategory(items)

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-bold text-gray-900">Affected Consumers</h2>
        <span className="bg-blue-50 text-blue-700 text-xs font-bold px-2 py-1 rounded">
          TOTAL: {members.length}
        </span>
      </div>

      <SearchInput
        className="mb-4"
        value={searchText}
        onChange={setSearchText}
        placeholder="Search name, ticket no., landmark, barangay, category…"
      />

      {groups.length === 0 && (
        <p className="text-sm text-gray-500">No consumers match your search.</p>
      )}

      <div className="space-y-4 max-h-96 overflow-y-auto pr-1">
        {groups.map((g) => (
          <div key={g.key}>
            <div className="mb-2 rounded-lg bg-gray-50 px-3 py-2">
              <CategoryGroupHeader label={g.label} count={g.items.length} />
            </div>
            <div className="space-y-2">
              {g.items.map(({ m }) => {
                const isExpanded = expandedId === m.report_id
                return (
                  <div key={m.report_id} className="border border-gray-200 rounded-lg">
                    <div className="flex items-center justify-between gap-3 p-3">
                      <div>
                        <p className="text-sm font-semibold text-gray-900">
                          {m.reporterName?.first_name} {m.reporterName?.last_name}
                        </p>
                        <p className="text-xs text-gray-400">
                          Zone {m.zone || '—'}, {m.barangay}, {m.municipality}
                        </p>
                        <ReporterInfo compact reportId={m.report_id} consumerId={m.consumer_id} />
                      </div>
                      <div className="flex items-center gap-3">
                        <StatusPill kind="priority" status={m.priority} />
                        <span className="text-xs font-medium text-blue-700">{m.ticket_number}</span>
                        <button
                          type="button"
                          onClick={() => setExpandedId(isExpanded ? null : m.report_id)}
                          className="inline-flex min-w-24 justify-center items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-700 shadow-sm transition-colors hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-600 whitespace-nowrap"
                        >
                          {isExpanded ? 'Hide Details' : 'View Details'}
                        </button>
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="border-t border-gray-100 bg-gray-50 p-3">
                        <MatchReviewCard
                          title="Report Details"
                          ticketLabel={m.ticket_number}
                          reportId={m.report_id}
                          consumerId={m.consumer_id}
                          barangay={m.barangay}
                          municipality={m.municipality}
                          zone={m.zone}
                          nearestLandmark={m.nearest_landmark}
                          description={m.report_details}
                          photoUrl={m.photo_url}
                          otherHomesAffected={m.other_homes_affected}
                        />
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}