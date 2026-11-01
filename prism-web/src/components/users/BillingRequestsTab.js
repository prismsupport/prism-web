"use client";

import { useState } from "react";
import PageHeader from "@/components/ui/PageHeader";
import StatCard, { StatCardGrid } from "@/components/ui/StatCard";
import DataTable from "@/components/ui/DataTable";
import Pagination from "@/components/ui/Pagination";
import Button from "@/components/ui/Button";
import SearchInput from "@/components/ui/SearchInput";
import { FilterBar, FilterSelect } from "@/components/ui/FilterBar";
import BillingStatusPill from "@/components/users/BillingStatusPill";
import usePagination from "@/lib/usePagination";
import { formatDate } from "@/lib/format";

const COLUMNS = [
  "Consumer Name",
  "Account #",
  "Account Type",
  "Status",
  "Request Date",
  "Actions",
];

const CARDS = [
  { key: "all", label: "All Requests", color: "text-blue-700" },
  { key: "pending", label: "Pending Approval", color: "text-amber-600" },
  { key: "approved", label: "Approved", color: "text-green-600" },
  { key: "rejected", label: "Rejected", color: "text-gray-900" },
];

const DATE_RANGES = [
  { key: "all", label: "Any time", days: null },
  { key: "7", label: "Last 7 days", days: 7 },
  { key: "30", label: "Last 30 days", days: 30 },
  { key: "90", label: "Last 90 days", days: 90 },
];

export default function BillingRequestsTab({
  billingRequests,
  statusFilter,
  onFilterChange,
  onSelectRequest,
  isUnread,
  headerAction,
}) {
  const [searchText, setSearchText] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [rangeKey, setRangeKey] = useState("all");

  const counts = {
    all: billingRequests.length,
    pending: billingRequests.filter((r) => r.status === "pending").length,
    approved: billingRequests.filter((r) => r.status === "approved").length,
    rejected: billingRequests.filter((r) => r.status === "rejected").length,
  };

  const accountTypes = Array.from(
    new Set(billingRequests.map((r) => r.account_type).filter(Boolean))
  ).sort();

  const term = searchText.trim().toLowerCase();
  const range = DATE_RANGES.find((r) => r.key === rangeKey);
  const since = range.days ? Date.now() - range.days * 86400000 : null;

  const filtered = billingRequests.filter((r) => {
    if (statusFilter !== "all" && r.status !== statusFilter) return false;
    if (typeFilter !== "all" && r.account_type !== typeFilter) return false;
    if (since && new Date(r.request_at).getTime() < since) return false;
    if (!term) return true;
    const consumer = `${r.consumerName?.first_name || ""} ${r.consumerName?.last_name || ""}`;
    return [consumer, r.account_number, r.account_name]
      .filter(Boolean)
      .some((v) => String(v).toLowerCase().includes(term));
  });

  const pg = usePagination(filtered);
  const hasFilters = term || typeFilter !== "all" || rangeKey !== "all" || statusFilter !== "all";

  function resetAll() {
    setSearchText("");
    setTypeFilter("all");
    setRangeKey("all");
    onFilterChange("all");
    pg.setPage(1);
  }

  return (
    <div>
      <PageHeader
        title="Billing Linkage Requests"
        description="Every billing linkage request submitted on the platform. Click a status below to filter."
        actions={headerAction}
      />

      <StatCardGrid>
        {CARDS.map((c) => (
          <StatCard
            key={c.key}
            compact
            label={c.label}
            labelIndicator={c.key === "pending" && counts[c.key] > 0}
            value={counts[c.key]}
            color={c.color}
            active={statusFilter === c.key}
            onClick={() => {
              onFilterChange(c.key);
              pg.setPage(1);
            }}
          />
        ))}
      </StatCardGrid>

      <FilterBar className="flex items-center">
        <SearchInput
          className="flex-1 min-w-[220px]"
          value={searchText}
          onChange={(v) => {
            setSearchText(v);
            pg.setPage(1);
          }}
          placeholder="Search consumer name, account number, or account name…"
        />
        <FilterSelect
          label="TYPE"
          value={typeFilter}
          onChange={(v) => {
            setTypeFilter(v);
            pg.setPage(1);
          }}
        >
          <option value="all">All Types</option>
          {accountTypes.map((t) => (
            <option key={t} value={t} className="capitalize">
              {t}
            </option>
          ))}
        </FilterSelect>
        <FilterSelect
          label="REQUESTED"
          value={rangeKey}
          onChange={(v) => {
            setRangeKey(v);
            pg.setPage(1);
          }}
        >
          {DATE_RANGES.map((r) => (
            <option key={r.key} value={r.key}>
              {r.label}
            </option>
          ))}
        </FilterSelect>
        {hasFilters && (
          <button onClick={resetAll} className="text-sm text-blue-700 font-medium whitespace-nowrap">
            Clear filters
          </button>
        )}
      </FilterBar>

      <DataTable
        columns={COLUMNS}
        isEmpty={filtered.length === 0}
        empty="No requests match this view."
        footer={<Pagination {...pg.paginationProps} />}
      >
        {pg.pageItems.map((r) => (
          <tr
            key={r.link_id}
            className={`border-b border-gray-100 last:border-0 ${
              isUnread?.("consumer_bill_links", r.link_id) ? "bg-red-50/40" : ""
            }`}
          >
            <td className="px-5 py-4 font-medium text-gray-900">
              {isUnread?.("consumer_bill_links", r.link_id) && (
                <span className="inline-block w-2 h-2 mr-2 rounded-full bg-red-500 align-middle" />
              )}
              {r.consumerName?.first_name} {r.consumerName?.last_name}
            </td>
            <td className="px-5 py-4 text-gray-600">{r.account_number}</td>
            <td className="px-5 py-4 text-gray-600 capitalize">{r.account_type}</td>
            <td className="px-5 py-4 text-center">
              <BillingStatusPill status={r.status} />
            </td>
            <td className="px-5 py-4 text-gray-600">{formatDate(r.request_at)}</td>
            <td className="px-5 py-4">
              <Button
                type="button"
                size="row"
                dim={false}
                variant={r.status === "pending" ? "primary" : "neutral"}
                onClick={() => onSelectRequest(r)}
              >
                {r.status === "pending" ? "Review" : "View Details"}
              </Button>
            </td>
          </tr>
        ))}
      </DataTable>
    </div>
  );
}