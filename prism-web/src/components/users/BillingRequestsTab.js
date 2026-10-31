"use client";

import PageHeader from "@/components/ui/PageHeader";
import StatCard, { StatCardGrid } from "@/components/ui/StatCard";
import DataTable from "@/components/ui/DataTable";
import Pagination from "@/components/ui/Pagination";
import Button from "@/components/ui/Button";
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

export default function BillingRequestsTab({
  billingRequests,
  statusFilter,
  onFilterChange,
  onSelectRequest,
  isUnread,
  headerAction,
}) {
  const counts = {
    all: billingRequests.length,
    pending: billingRequests.filter((r) => r.status === "pending").length,
    approved: billingRequests.filter((r) => r.status === "approved").length,
    rejected: billingRequests.filter((r) => r.status === "rejected").length,
  };

  const filtered =
    statusFilter === "all"
      ? billingRequests
      : billingRequests.filter((r) => r.status === statusFilter);

  const pg = usePagination(filtered);

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
