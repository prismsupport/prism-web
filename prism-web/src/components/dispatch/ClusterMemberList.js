'use client'

import { useState } from 'react'
import MatchReviewCard from '@/components/dispatch/MatchReviewCard'
import CategoryGroupHeader, { CategoryMismatchTag } from '@/components/dispatch/CategoryGroupHeader'
import SearchInput from '@/components/ui/SearchInput'
import { buildBreakdownFactors } from '@/lib/scoring/masterTicketScoringConfig'
import { issueLabel } from '@/lib/issueCodes'
import { groupByCategory, matchesSearch, sameCategory } from '@/lib/ticketGrouping'

// Each member needs: issueCode (its category). anchorCode is the anchor's category.
export default function ClusterMemberList({
  members,
  anchorCode,
  expandedId,
  onToggleExpand,
  onToggleChecked,
}) {
  const [searchText, setSearchText] = useState('')

  const items = members.map((m) => ({
    m,
    id: m.report_id,
    code: m.issueCode ?? null,
    score: m.breakdown?.total_score,
    created: m.created_at,
  }))

  const anchorItem = items.find((i) => i.m.isAnchor) || null
  const others = items
    .filter((i) => !i.m.isAnchor)
    .filter((i) =>
      matchesSearch(
        [
          i.m.reporterName?.first_name,
          i.m.reporterName?.last_name,
          i.m.ticket_number,
          i.m.nearest_landmark,
          i.m.zone,
          i.m.barangay,
          i.m.municipality,
          i.m.report_details,
          issueLabel(i.code),
        ],
        searchText
      )
    )
  const groups = groupByCategory(others, { anchorCode, hasAnchor: true })

  function renderMember({ m, code }) {
    const isExpanded = expandedId === m.report_id
    const factors = buildBreakdownFactors(m.breakdown)
    const differs = !m.isAnchor && !sameCategory(code, anchorCode)

    return (
      <div
        key={m.report_id}
        className={`border rounded-lg ${
          m.isAnchor
            ? 'border-blue-300'
            : m.checked === false
            ? 'border-gray-200 opacity-60'
            : 'border-gray-200'
        }`}
      >
        <div className="w-full flex items-center justify-between p-3">
          <div className="flex items-start gap-3">
            {!m.isAnchor && (
              <input
                type="checkbox"
                checked={m.checked !== false}
                onChange={() => onToggleChecked(m.report_id)}
                className="w-4 h-4 mt-1"
              />
            )}
            <div>
              <p className="text-sm font-semibold text-gray-900">
                {m.reporterName?.first_name} {m.reporterName?.last_name}
                {m.isAnchor && (
                  <span className="ml-2 text-xs font-bold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded">
                    ANCHOR
                  </span>
                )}
              </p>
              <p className="text-xs text-gray-400 mt-0.5">
                {m.ticket_number} · {issueLabel(code)}
              </p>
              {!m.isAnchor && m.breakdown && (
                <p className="text-xs text-gray-400">
                  {m.breakdown.total_score}% match vs anchor
                  {m.breakdown.feeder_match === false && (
                    <span className="text-red-500 font-medium"> — different feeder</span>
                  )}
                </p>
              )}
              {differs && <CategoryMismatchTag code={code} referenceCode={anchorCode} />}
            </div>
          </div>
          <button
            onClick={() => onToggleExpand(isExpanded ? null : m.report_id)}
            className={`inline-flex min-w-28 justify-center items-center gap-2 rounded-lg px-3.5 py-2 text-xs font-semibold shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-blue-600 whitespace-nowrap ${
              isExpanded
                ? 'border border-gray-200 bg-white text-gray-700 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700'
                : 'bg-blue-700 text-white hover:bg-blue-800'
            }`}
          >
            {isExpanded ? 'Hide' : 'Review'}
          </button>
        </div>

        {isExpanded && (
          <div className="border-t border-gray-100 p-3 space-y-3">
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
            {!m.isAnchor && factors.length > 0 && (
              <div className="space-y-1">
                <p className="text-xs font-bold text-gray-400 uppercase">
                  Match Breakdown vs Anchor
                </p>
                {factors.map((f, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs">
                    <span className={f.passed ? 'text-green-600' : 'text-gray-300'}>
                      {f.passed ? '✓' : '✗'}
                    </span>
                    <span className={f.passed ? 'text-gray-700' : 'text-gray-400'}>{f.label}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-bold text-gray-900">Reports in this Cluster</h2>
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

      <div className="space-y-4">
        {anchorItem && <div className="space-y-2">{renderMember(anchorItem)}</div>}

        {groups.map((g) => (
          <div key={g.key}>
            <div className="mb-2 rounded-lg bg-gray-50 px-3 py-2">
              <CategoryGroupHeader
                label={g.label}
                count={g.items.length}
                hasAnchor
                matchesAnchor={g.matchesAnchor}
              />
            </div>
            <div className="space-y-2">{g.items.map(renderMember)}</div>
          </div>
        ))}

        {groups.length === 0 && searchText.trim() && (
          <p className="text-sm text-gray-500">No reports match your search.</p>
        )}
      </div>
    </div>
  )
}