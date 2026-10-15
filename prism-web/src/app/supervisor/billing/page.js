"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import BillingRequestsTab from "@/components/users/BillingRequestsTab";
import BillingRequestDetailsModal from "@/components/users/BillingRequestDetailsModal";
import BillingIntegrationModal from "@/components/billing/BillingIntegrationModal";
import {
  useSupervisorNotificationRefresh,
  useUnreadSupervisorNotifications,
} from "@/lib/supervisor/useSupervisorLiveUpdates";
import { PageLoading } from "@/components/ui/Skeleton";

export default function BillingRequestsPage() {
  const [billingRequests, setBillingRequests] = useState([]);
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showIntegration, setShowIntegration] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const { isUnread, markNotificationRead } = useUnreadSupervisorNotifications([
    "consumer_bill_links",
  ]);

  useEffect(() => {
    loadBilling();
  }, []);
  useSupervisorNotificationRefresh(loadBilling);

  async function loadBilling() {
    setLoading(true);
    setError("");
    const supabase = createClient();

    const { data: billingData, error: billingError } = await supabase
      .from("consumer_bill_links")
      .select("*")
      .order("request_at", { ascending: false });

    if (billingError) {
      setError(billingError.message);
      setLoading(false);
      return;
    }

    const consumerIds = (billingData || []).map((r) => r.consumer_id);
    let consumerNames = [];
    if (consumerIds.length > 0) {
      const { data } = await supabase
        .from("users")
        .select("id, first_name, last_name")
        .in("id", consumerIds);
      consumerNames = data || [];
    }

    const merged = (billingData || []).map((r) => ({
      ...r,
      consumerName: consumerNames.find((u) => u.id === r.consumer_id),
    }));

    setBillingRequests(merged);
    setLoading(false);
  }

  if (loading) return <PageLoading />

  return (
    <div>
      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2 mb-4">
          {error}
        </p>
      )}
      <BillingRequestsTab
        billingRequests={billingRequests}
        statusFilter={statusFilter}
        onFilterChange={setStatusFilter}
        onSelectRequest={(request) => {
          markNotificationRead("consumer_bill_links", request.link_id);
          setSelectedRequest(request);
        }}
        isUnread={isUnread}
        headerAction={
          <button
            onClick={() => setShowIntegration(true)}
            className="bg-white hover:bg-gray-50 text-gray-700 text-sm font-semibold px-4 py-2.5 rounded-lg border border-gray-200 transition-colors whitespace-nowrap"
          >
            Billing Integration
          </button>
        }
      />
      {selectedRequest && (
        <BillingRequestDetailsModal
          request={selectedRequest}
          onClose={() => setSelectedRequest(null)}
          onDecided={() => {
            setSelectedRequest(null);
            loadBilling();
          }}
        />
      )}
      {showIntegration && (
        <BillingIntegrationModal onClose={() => setShowIntegration(false)} />
      )}
    </div>
  );
}
