'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Modal from '@/components/ui/Modal'
import { toast } from "@/lib/toast"

export default function AddEditFaqModal({ cooperativeId, entry, categories, onClose, onSaved }) {
  const isEditing = !!entry
  const [category, setCategory] = useState(entry?.category || categories[0] || '')
  const [question, setQuestion] = useState(entry?.question || '')
  const [answer, setAnswer] = useState(entry?.answer || '')
  const [keywords, setKeywords] = useState(entry?.keywords || '')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    const supabase = createClient()

    const normalizedKeywords = keywords
      .split(',')
      .map((k) => k.trim())
      .filter(Boolean)
      .join(', ')

    if (isEditing) {
      const { error: updateError } = await supabase
        .from('faq_entries')
        .update({
          category,
          question,
          answer,
          keywords: normalizedKeywords || null,
          updated_at: new Date().toISOString(),
        })
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
        keywords: normalizedKeywords || null,
      })

      if (insertError) {
        setError(insertError.message)
        setLoading(false)
        return
      }
    }

    toast.success(isEditing ? "FAQ updated" : "FAQ added")
    
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
            {categories.map((cat) => (
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

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Keywords <span className="text-gray-400 font-normal">(optional)</span>
          </label>
          <input
            value={keywords}
            onChange={(e) => setKeywords(e.target.value)}
            placeholder="e.g. walang kuryente, no power, blackout, brownout"
            className="w-full px-3.5 py-2.5 rounded-lg border border-gray-200 bg-gray-50 text-sm placeholder-gray-400"
          />
          <p className="text-xs text-gray-400 mt-1">
            Comma-separated synonyms or alternate phrasings (including Filipino terms) the
            chatbot should also match to this question.
          </p>
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