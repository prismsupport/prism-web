'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Modal from '@/components/ui/Modal'
import FaqEntryRow from '@/components/faq/FaqEntryRow'
import FaqInquiryRow from '@/components/faq/FaqInquiryRow'
import ManageFaqCategoriesModal from '@/components/faq/ManageFaqCategoriesModal'
import AddEditFaqModal from '@/components/faq/AddEditFaqModal'
import ProvideAnswerModal from '@/components/faq/ProvideAnswerModal'
import Pagination from '@/components/ui/Pagination'

const PAGE_SIZE = 10

export default function FaqManagementPage() {
  const [activeTab, setActiveTab] = useState('all')
  const [cooperativeId, setCooperativeId] = useState(null)

  const [categories, setCategories] = useState([])
  const [showManageCategories, setShowManageCategories] = useState(false)

  const [entries, setEntries] = useState([])
  const [inquiries, setInquiries] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [entriesPage, setEntriesPage] = useState(1)
  const [inquiriesPage, setInquiriesPage] = useState(1)

  const [showAddModal, setShowAddModal] = useState(false)
  const [editingEntry, setEditingEntry] = useState(null)
  const [deletingEntry, setDeletingEntry] = useState(null)
  const [answeringInquiry, setAnsweringInquiry] = useState(null)

  useEffect(() => {
    loadEverything()
  }, [])

  async function loadEverything() {
    setLoading(true)
    setError('')
    const supabase = createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    const { data: myRow, error: myRowError } = await supabase
      .from('users')
      .select('cooperative_id')
      .eq('id', user.id)
      .single()

    if (myRowError || !myRow) {
      setError('Unable to load your cooperative.')
      setLoading(false)
      return
    }

    setCooperativeId(myRow.cooperative_id)

        const { data: coop } = await supabase
      .from('cooperatives')
      .select('faq_categories')
      .eq('id', myRow.cooperative_id)
      .single()

    setCategories(coop?.faq_categories || [])

    const { data: entryData, error: entryError } = await supabase
      .from('faq_entries')
      .select('*')
      .eq('cooperative_id', myRow.cooperative_id)
      .order('updated_at', { ascending: false })

    if (entryError) setError(entryError.message)
    setEntries(entryData || [])

    const { data: inquiryData, error: inquiryError } = await supabase
      .from('faq_inquiries')
      .select('*')
      .eq('status', 'pending')
      .order('submitted_at', { ascending: false })

    if (inquiryError) setError(inquiryError.message)

    const consumerIds = (inquiryData || []).map((i) => i.consumer_id)
    let consumerNames = []
    if (consumerIds.length > 0) {
      const { data } = await supabase
        .from('users')
        .select('id, first_name, last_name, cooperative_id')
        .in('id', consumerIds)
      consumerNames = data || []
    }

    // Only keep inquiries from consumers in this supervisor's cooperative
    const relevantInquiries = (inquiryData || [])
      .map((i) => ({
        ...i,
        consumer: consumerNames.find((c) => c.id === i.consumer_id),
      }))
      .filter((i) => i.consumer?.cooperative_id === myRow.cooperative_id)

    setInquiries(relevantInquiries)
    setLoading(false)
  }

  async function handleDeleteConfirmed() {
    const supabase = createClient()
    await supabase.from('faq_entries').delete().eq('faq_id', deletingEntry.faq_id)
    setDeletingEntry(null)
    loadEverything()
  }

  const filteredEntries =
    activeTab === 'all' || activeTab === 'unanswered'
      ? entries
      : entries.filter((e) => e.category === activeTab)

  return (
    <div>
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">FAQ Management</h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage frequently asked questions for the consumer portal.
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="bg-blue-700 hover:bg-blue-800 text-white text-sm font-semibold px-4 py-2.5 rounded-lg transition-colors"
        >
          + Add New FAQ
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200">
        <div className="flex items-center justify-between px-5 pt-4">
          <div className="flex gap-2">
            <TabButton
              active={activeTab === 'all'}
              onClick={() => {
                setActiveTab('all')
                setEntriesPage(1)
              }}
            >
              All Categories
            </TabButton>
            <TabButton
              active={activeTab === 'unanswered'}
              onClick={() => {
                setActiveTab('unanswered')
                setInquiriesPage(1)
              }}
            >
              Unanswered{' '}
              {inquiries.length > 0 && (
                <span className="ml-1 bg-red-500 text-white text-xs font-bold px-1.5 py-0.5 rounded-full">
                  {inquiries.length}
                </span>
              )}
            </TabButton>
            {categories.map((cat) => (
              <TabButton
                key={cat}
                active={activeTab === cat}
                onClick={() => {
                  setActiveTab(cat)
                  setEntriesPage(1)
                }}
              >
                {cat.charAt(0).toUpperCase() + cat.slice(1)}
              </TabButton>
            ))}
          </div>
          <button
            onClick={() => setShowManageCategories(true)}
            className="text-xs text-blue-700 font-medium whitespace-nowrap"
          >
            Manage categories
          </button>
        </div>

        <div className="border-b border-gray-200 mt-3" />

        {error && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2 m-5">
            {error}
          </p>
        )}

        {loading && <p className="text-sm text-gray-500 p-5">Loading…</p>}

        {!loading && activeTab === 'unanswered' && (
          <div>
            {inquiries.length === 0 && (
              <p className="text-sm text-gray-500 p-5">No pending inquiries.</p>
            )}
            {inquiries
              .slice((inquiriesPage - 1) * PAGE_SIZE, inquiriesPage * PAGE_SIZE)
              .map((inq) => (
                <FaqInquiryRow key={inq.faq_inquiries_id} inquiry={inq} onAnswer={setAnsweringInquiry} />
              ))}
            <Pagination
              page={inquiriesPage}
              totalPages={Math.max(1, Math.ceil(inquiries.length / PAGE_SIZE))}
              totalCount={inquiries.length}
              pageSize={PAGE_SIZE}
              onPageChange={setInquiriesPage}
            />
          </div>
        )}

        {!loading && activeTab !== 'unanswered' && (
          <div>
            {filteredEntries.length === 0 && (
              <p className="text-sm text-gray-500 p-5">No FAQ entries yet.</p>
            )}
            {filteredEntries
              .slice((entriesPage - 1) * PAGE_SIZE, entriesPage * PAGE_SIZE)
              .map((entry) => (
                <FaqEntryRow key={entry.faq_id} entry={entry} onEdit={setEditingEntry} onDelete={setDeletingEntry} />
              ))}
            <Pagination
              page={entriesPage}
              totalPages={Math.max(1, Math.ceil(filteredEntries.length / PAGE_SIZE))}
              totalCount={filteredEntries.length}
              pageSize={PAGE_SIZE}
              onPageChange={setEntriesPage}
            />
          </div>
        )}
      </div>

      {(showAddModal || editingEntry) && (
        <AddEditFaqModal
          cooperativeId={cooperativeId}
          entry={editingEntry}
          categories={categories}
          onClose={() => {
            setShowAddModal(false)
            setEditingEntry(null)
          }}
          onSaved={() => {
            setShowAddModal(false)
            setEditingEntry(null)
            loadEverything()
          }}
        />
      )}

      {deletingEntry && (
        <Modal title="Delete FAQ Entry" onClose={() => setDeletingEntry(null)}>
          <p className="text-sm text-gray-700 mb-6">
            Are you sure you want to delete "
            <span className="font-semibold">{deletingEntry.question}</span>"?
            This action cannot be undone.
          </p>
          <div className="flex justify-end gap-3">
            <button
              onClick={() => setDeletingEntry(null)}
              className="px-4 py-2.5 rounded-lg text-sm font-semibold text-gray-600 border border-gray-200 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleDeleteConfirmed}
              className="px-4 py-2.5 rounded-lg text-sm font-semibold text-white bg-red-600 hover:bg-red-700"
            >
              Delete
            </button>
          </div>
        </Modal>
      )}

      {answeringInquiry && (
        <ProvideAnswerModal
          inquiry={answeringInquiry}
          cooperativeId={cooperativeId}
          categories={categories}
          onClose={() => setAnsweringInquiry(null)}
          onAnswered={() => {
            setAnsweringInquiry(null)
            loadEverything()
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
  )
}

function TabButton({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
        active ? 'bg-blue-700 text-white' : 'text-gray-600 hover:bg-gray-100'
      }`}
    >
      {children}
    </button>
  )
}
