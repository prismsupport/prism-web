'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Modal from '@/components/ui/Modal'

const CATEGORIES = ['billing', 'technical', 'outages']

export default function ProvideAnswerModal({ inquiry, cooperativeId, onClose, onAnswered }) {
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