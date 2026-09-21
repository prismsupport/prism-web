'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Modal from '@/components/ui/Modal'
import Pagination from '@/components/ui/Pagination'

const PAGE_SIZE = 10

const CATEGORIES = ['billing', 'technical', 'outages']

const categoryStyles = {
  billing: 'bg-amber-50 text-amber-700',
  technical: 'bg-blue-50 text-blue-700',
  outages: 'bg-purple-50 text-purple-700',
}

export default function FaqManagementPage() {
  const [activeTab, setActiveTab] = useState('all')
  const [cooperativeId, setCooperativeId] = useState(null)

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
            {CATEGORIES.map((cat) => (
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
              <div
                key={inq.faq_inquiries_id}
                className="flex items-center justify-between gap-4 px-5 py-4 border-b border-gray-100 last:border-0"
              >
                <div>
                  <span className="inline-block bg-amber-50 text-amber-700 text-xs font-bold px-2 py-0.5 rounded mr-2">
                    PENDING
                  </span>
                  <span className="text-xs text-gray-400">
                    {new Date(inq.submitted_at).toLocaleString('en-PH', {
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric',
                      hour: 'numeric',
                      minute: '2-digit',
                    })}
                  </span>
                  <p className="text-sm text-gray-900 mt-1">{inq.question}</p>
                  <p className="text-xs text-gray-400 mt-1">
                    From: {inq.consumer?.first_name} {inq.consumer?.last_name}
                  </p>
                </div>
                <button
                  onClick={() => setAnsweringInquiry(inq)}
                  className="bg-blue-700 hover:bg-blue-800 text-white text-xs font-semibold px-4 py-2 rounded-lg transition-colors whitespace-nowrap"
                >
                  Provide Answer
                </button>
              </div>
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
              <div
                key={entry.faq_id}
                className="flex items-start justify-between gap-4 px-5 py-4 border-b border-gray-100 last:border-0"
              >
                <div className="flex-1">
                  <span
                    className={`inline-block text-xs font-bold px-2 py-0.5 rounded mr-2 uppercase ${categoryStyles[entry.category]}`}
                  >
                    {entry.category}
                  </span>
                  <span className="text-xs text-gray-400">
                    Updated{' '}
                    {new Date(entry.updated_at).toLocaleDateString('en-PH', {
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </span>
                  <p className="text-sm font-semibold text-gray-900 mt-1">
                    {entry.question}
                  </p>
                  <p className="text-sm text-gray-600 mt-1">
                    <span className="font-semibold text-gray-700">Answer:</span>{' '}
                    {entry.answer}
                  </p>
                </div>
                <div className="flex items-center gap-3 pt-1">
                  <button
                    onClick={() => setEditingEntry(entry)}
                    className="text-blue-600 hover:text-blue-800"
                    title="Edit"
                  >
                    <PencilIcon />
                  </button>
                  <button
                    onClick={() => setDeletingEntry(entry)}
                    className="text-red-500 hover:text-red-700"
                    title="Delete"
                  >
                    <TrashIcon />
                  </button>
                </div>
              </div>
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
          onClose={() => setAnsweringInquiry(null)}
          onAnswered={() => {
            setAnsweringInquiry(null)
            loadEverything()
          }}
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

function PencilIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
    </svg>
  )
}

function TrashIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
      <path d="M3 6h18" />
      <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0-1 14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2L4 6" />
    </svg>
  )
}

function AddEditFaqModal({ cooperativeId, entry, onClose, onSaved }) {
  const isEditing = !!entry
  const [category, setCategory] = useState(entry?.category || 'billing')
  const [question, setQuestion] = useState(entry?.question || '')
  const [answer, setAnswer] = useState(entry?.answer || '')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    const supabase = createClient()

    if (isEditing) {
      const { error: updateError } = await supabase
        .from('faq_entries')
        .update({ category, question, answer, updated_at: new Date().toISOString() })
        .eq('faq_id', entry.faq_id)

      if (updateError) {
        setError(updateError.message)
        setLoading(false)
        return
      }
    } else {
      const { error: insertError } = await supabase.from('faq_entries').insert({
        cooperative_id: cooperativeId,
        category,
        question,
        answer,
      })

      if (insertError) {
        setError(insertError.message)
        setLoading(false)
        return
      }
    }

    onSaved()
  }

  return (
    <Modal title={isEditing ? 'Edit FAQ' : 'Add New FAQ'} onClose={onClose}>
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Category
          </label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-lg border border-gray-200 bg-gray-50 text-sm"
          >
            {CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat.charAt(0).toUpperCase() + cat.slice(1)}
              </option>
            ))}
          </select>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Question
          </label>
          <input
            required
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="e.g. How do I reset my password?"
            className="w-full px-3.5 py-2.5 rounded-lg border border-gray-200 bg-gray-50 text-sm placeholder-gray-400"
          />
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Answer
          </label>
          <textarea
            required
            rows={4}
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            placeholder="Provide a detailed answer with any necessary steps..."
            className="w-full px-3.5 py-2.5 rounded-lg border border-gray-200 bg-gray-50 text-sm placeholder-gray-400"
          />
        </div>

        {error && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2 mb-4">
            {error}
          </p>
        )}

        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-lg text-sm font-semibold text-gray-600 border border-gray-200 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2.5 rounded-lg text-sm font-semibold text-white bg-blue-700 hover:bg-blue-800 disabled:opacity-60"
          >
            {loading ? 'Saving…' : isEditing ? 'Save Changes' : 'Save FAQ'}
          </button>
        </div>
      </form>
    </Modal>
  )
}

function ProvideAnswerModal({ inquiry, cooperativeId, onClose, onAnswered }) {
  const [category, setCategory] = useState('billing')
  const [answer, setAnswer] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    if (!answer.trim()) {
      setError('Please write an answer before submitting.')
      return
    }

    setError('')
    setLoading(true)
    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    const { error: inquiryError } = await supabase
      .from('faq_inquiries')
      .update({
        status: 'answered',
        supervisor_answer: answer.trim(),
        supervisor_id: user.id,
        answered_at: new Date().toISOString(),
      })
      .eq('faq_inquiries_id', inquiry.faq_inquiries_id)

    if (inquiryError) {
      setError(inquiryError.message)
      setLoading(false)
      return
    }

    const { error: entryError } = await supabase.from('faq_entries').insert({
      cooperative_id: cooperativeId,
      category,
      question: inquiry.question,
      answer: answer.trim(),
    })

    if (entryError) {
      setError(entryError.message)
      setLoading(false)
      return
    }

    onAnswered()
  }

  return (
    <Modal title="Provide FAQ Answer" onClose={onClose}>
      <p className="text-sm text-gray-500 mb-4 -mt-2">
        Drafting response for consumer inquiry
      </p>

      <div className="bg-blue-50 rounded-lg p-4 mb-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-gray-500 uppercase">Consumer</p>
            <p className="text-sm font-semibold text-gray-900">
              {inquiry.consumer?.first_name} {inquiry.consumer?.last_name}
            </p>
          </div>
          <p className="text-xs text-gray-400">
            {new Date(inquiry.submitted_at).toLocaleString('en-PH', {
              month: 'long',
              day: 'numeric',
              year: 'numeric',
              hour: 'numeric',
              minute: '2-digit',
            })}
          </p>
        </div>
        <div className="border-t border-blue-100 my-2" />
        <p className="text-xs font-bold text-gray-500 uppercase">Question</p>
        <p className="text-sm font-semibold text-blue-700">{inquiry.question}</p>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Category
          </label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-lg border border-gray-200 bg-gray-50 text-sm"
          >
            {CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat.charAt(0).toUpperCase() + cat.slice(1)}
              </option>
            ))}
          </select>
        </div>

        <div className="mb-4">
          <label className="block text-xs font-bold tracking-wide text-gray-600 mb-1.5">
            OFFICIAL ANSWER
          </label>
          <textarea
            rows={5}
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            placeholder="Type the official response here..."
            className="w-full px-3.5 py-2.5 rounded-lg border border-gray-200 bg-gray-50 text-sm placeholder-gray-400"
          />
        </div>

        {error && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2 mb-4">
            {error}
          </p>
        )}

        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-lg text-sm font-semibold text-gray-600 border border-gray-200 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2.5 rounded-lg text-sm font-semibold text-white bg-blue-700 hover:bg-blue-800 disabled:opacity-60"
          >
            {loading ? 'Submitting…' : 'Submit Answer'}
          </button>
        </div>
      </form>
    </Modal>
  )
}