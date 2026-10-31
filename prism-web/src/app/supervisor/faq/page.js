"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { getMyCooperativeId } from "@/lib/supabase/getCooperativeId";
import { toast } from "@/lib/toast";
import usePagination from "@/lib/usePagination";
import PageHeader from "@/components/ui/PageHeader";
import Alert from "@/components/ui/Alert";
import Button from "@/components/ui/Button";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import EmptyState from "@/components/ui/EmptyState";
import InlineLoading from "@/components/ui/InlineLoading";
import Tabs from "@/components/ui/Tabs";
import FaqEntryRow from "@/components/faq/FaqEntryRow";
import FaqInquiryRow from "@/components/faq/FaqInquiryRow";
import ManageFaqCategoriesModal from "@/components/faq/ManageFaqCategoriesModal";
import AddEditFaqModal from "@/components/faq/AddEditFaqModal";
import ProvideAnswerModal from "@/components/faq/ProvideAnswerModal";
import Pagination from "@/components/ui/Pagination";
import {
  useSupervisorNotificationRefresh,
  useUnreadSupervisorNotifications,
} from "@/lib/supervisor/useSupervisorLiveUpdates";

export default function FaqManagementPage() {
  const [activeTab, setActiveTab] = useState("all");
  const [cooperativeId, setCooperativeId] = useState(null);

  const [categories, setCategories] = useState([]);
  const [showManageCategories, setShowManageCategories] = useState(false);

  const [entries, setEntries] = useState([]);
  const [inquiries, setInquiries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [showAddModal, setShowAddModal] = useState(false);
  const [editingEntry, setEditingEntry] = useState(null);
  const [deletingEntry, setDeletingEntry] = useState(null);
  const [answeringInquiry, setAnsweringInquiry] = useState(null);
  const { isUnread, markNotificationRead } = useUnreadSupervisorNotifications([
    "faq_inquiries",
  ]);

  useEffect(() => {
    loadEverything();
  }, []);
  useSupervisorNotificationRefresh(loadEverything);

  async function loadEverything() {
    setLoading(true);
    setError("");
    const supabase = createClient();

    const coopId = await getMyCooperativeId(supabase);

    if (!coopId) {
      setError("Unable to load your cooperative.");
      setLoading(false);
      return;
    }

    setCooperativeId(coopId);

    const { data: coop } = await supabase
      .from("cooperative_settings")
      .select("faq_categories")
      .eq("cooperative_id", coopId)
      .single();

    setCategories(coop?.faq_categories || []);

    const { data: entryData, error: entryError } = await supabase
      .from("faq_entries")
      .select("*")
      .eq("cooperative_id", coopId)
      .order("updated_at", { ascending: false });

    if (entryError) setError(entryError.message);
    setEntries(entryData || []);

    const { data: inquiryData, error: inquiryError } = await supabase
      .from("faq_inquiries")
      .select("*")
      .eq("status", "pending")
      .order("submitted_at", { ascending: false });

    if (inquiryError) setError(inquiryError.message);

    const consumerIds = (inquiryData || []).map((i) => i.consumer_id);
    let consumerNames = [];
    if (consumerIds.length > 0) {
      const { data } = await supabase
        .from("users")
        .select("id, first_name, last_name, cooperative_id")
        .in("id", consumerIds);
      consumerNames = data || [];
    }

    // Only keep inquiries from consumers in this supervisor's cooperative
    const relevantInquiries = (inquiryData || [])
      .map((i) => ({
        ...i,
        consumer: consumerNames.find((c) => c.id === i.consumer_id),
      }))
      .filter((i) => i.consumer?.cooperative_id === coopId);

    setInquiries(relevantInquiries);
    setLoading(false);
  }

  async function handleDeleteConfirmed() {
    const supabase = createClient();
    const { data, error: deleteError } = await supabase
      .from('faq_entries')
      .delete()
      .eq('faq_id', deletingEntry.faq_id)
      .select()
    if (deleteError || !data?.length) {
      toast.error(deleteError?.message || "Couldn't delete this entry.")
    } else {
      toast.success("FAQ entry deleted")
    }
    setDeletingEntry(null)
    loadEverything();
  }

  const filteredEntries =
    activeTab === "all" || activeTab === "unanswered"
      ? entries
      : entries.filter((e) => e.category === activeTab);

  const entriesPg = usePagination(filteredEntries);
  const inquiriesPg = usePagination(inquiries);

  const tabs = [
    { key: "all", label: "All Categories" },
    {
      key: "unanswered",
      label: (
        <>
          Unanswered{" "}
          {inquiries.length > 0 && (
            <span className="ml-1 bg-red-500 text-white text-xs font-bold px-1.5 py-0.5 rounded-full">
              {inquiries.length}
            </span>
          )}
        </>
      ),
    },
    ...categories.map((cat) => ({
      key: cat,
      label: cat.charAt(0).toUpperCase() + cat.slice(1),
    })),
  ];

  function handleTabChange(key) {
    setActiveTab(key);
    if (key === "unanswered") inquiriesPg.setPage(1);
    else entriesPg.setPage(1);
  }

  return (
    <div>
      <PageHeader
        title="FAQ Management"
        description="Manage frequently asked questions for the consumer portal."
        actions={
          <Button dim={false} onClick={() => setShowAddModal(true)}>
            + Add New FAQ
          </Button>
        }
      />

      <div className="bg-white rounded-xl border border-gray-200">
        <div className="flex items-center justify-between px-5 pt-4">
          <Tabs tabs={tabs} value={activeTab} onChange={handleTabChange} />
          <button
            onClick={() => setShowManageCategories(true)}
            className="text-xs text-blue-700 font-medium whitespace-nowrap"
          >
            Manage categories
          </button>
        </div>

        <div className="border-b border-gray-200 mt-3" />

        <Alert className="m-5">{error}</Alert>

        {loading && <InlineLoading className="p-5" />}

        {!loading && activeTab === "unanswered" && (
          <div>
            {inquiries.length === 0 && (
              <p className="text-sm text-gray-500 p-5">No pending inquiries.</p>
            )}
            {inquiriesPg.pageItems.map((inq) => (
              <FaqInquiryRow
                key={inq.faq_inquiries_id}
                inquiry={inq}
                isUnread={isUnread("faq_inquiries", inq.faq_inquiries_id)}
                onOpen={() =>
                  markNotificationRead("faq_inquiries", inq.faq_inquiries_id)
                }
                onAnswer={setAnsweringInquiry}
              />
            ))}
            <Pagination {...inquiriesPg.paginationProps} />
          </div>
        )}

        {!loading && activeTab !== "unanswered" && (
          <div>
            {filteredEntries.length === 0 && (
              <EmptyState
                title="No FAQ entries yet"
                description="Add a question and answer for your consumers, or answer a pending inquiry."
              />
            )}
            {entriesPg.pageItems.map((entry) => (
              <FaqEntryRow
                key={entry.faq_id}
                entry={entry}
                onEdit={setEditingEntry}
                onDelete={setDeletingEntry}
              />
            ))}
            <Pagination {...entriesPg.paginationProps} />
          </div>
        )}
      </div>

      {(showAddModal || editingEntry) && (
        <AddEditFaqModal
          cooperativeId={cooperativeId}
          entry={editingEntry}
          categories={categories}
          onClose={() => {
            setShowAddModal(false);
            setEditingEntry(null);
          }}
          onSaved={() => {
            setShowAddModal(false);
            setEditingEntry(null);
            loadEverything();
          }}
        />
      )}

      {deletingEntry && (
        <ConfirmDialog
          title="Delete FAQ Entry"
          onConfirm={handleDeleteConfirmed}
          onClose={() => setDeletingEntry(null)}
        >
          Are you sure you want to delete "
          <span className="font-semibold">{deletingEntry.question}</span>"?
          This action cannot be undone.
        </ConfirmDialog>
      )}

      {answeringInquiry && (
        <ProvideAnswerModal
          inquiry={answeringInquiry}
          cooperativeId={cooperativeId}
          categories={categories}
          onClose={() => setAnsweringInquiry(null)}
          onAnswered={() => {
            setAnsweringInquiry(null);
            loadEverything();
          }}
        />
      )}

      {showManageCategories && (
        <ManageFaqCategoriesModal
          cooperativeId={cooperativeId}
          categories={categories}
          onClose={() => setShowManageCategories(false)}
          onUpdated={(newList) => setCategories(newList)}
        />
      )}
    </div>
  );
}
