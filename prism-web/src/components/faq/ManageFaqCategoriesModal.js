'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Modal from '@/components/ui/Modal'

export default function ManageFaqCategoriesModal({ cooperativeId, categories, onClose, onUpdated }) {
  const [list, setList] = useState(categories)
  const [newCategory, setNewCategory] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function persist(updatedList) {
    setSaving(true)
    setError('')
    const supabase = createClient()
    const { error: updateError } = await supabase
      .from('cooperatives')
      .update({ faq_categories: updatedList })
      .eq('id', cooperativeId)

    if (updateError) {
      setError(updateError.message)
      setSaving(false)
      return
    }

    setList(updatedList)
    onUpdated(updatedList)
    setSaving(false)
  }

  function handleAdd() {
    const trimmed = newCategory.trim().toLowerCase()
    if (!trimmed || list.includes(trimmed)) return
    persist([...list, trimmed])
    setNewCategory('')
  }

  function handleDelete(category) {
    persist(list.filter((c) => c !== category))
  }

  return (
    <Modal title="Manage FAQ Categories" onClose={onClose}>
      <div className="space-y-2 mb-4">
        {list.length === 0 && (
          <p className="text-sm text-gray-500">No categories yet.</p>
        )}
        {list.map((category) => (
          <div
            key={category}
            className="flex items-center justify-between px-3 py-2 rounded-lg border border-gray-200"
          >
            <span className="text-sm text-gray-900 capitalize">{category}</span>
            <button
              onClick={() => handleDelete(category)}
              disabled={saving}
              className="text-xs font-semibold text-red-600"
            >
              Delete
            </button>
          </div>
        ))}
      </div>

      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2 mb-4">
          {error}
        </p>
      )}

      <div className="flex gap-2">
        <input
          value={newCategory}
          onChange={(e) => setNewCategory(e.target.value)}
          placeholder="New category name"
          className="flex-1 px-3 py-2 rounded-lg border border-gray-200 bg-gray-50 text-sm"
        />
        <button
          onClick={handleAdd}
          disabled={saving}
          className="px-4 py-2 rounded-lg text-sm font-semibold text-white bg-blue-700 hover:bg-blue-800 disabled:opacity-60"
        >
          Add
        </button>
      </div>
    </Modal>
  )
}