'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Modal from '@/components/ui/Modal'
import Alert from '@/components/ui/Alert'
import Button from '@/components/ui/Button'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import { toast } from '@/lib/toast'

export default function ManageFaqCategoriesModal({ cooperativeId, categories, onClose, onUpdated }) {
  const [list, setList] = useState(categories)
  const [newCategory, setNewCategory] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [categoryToDelete, setCategoryToDelete] = useState(null)

  async function persist(updatedList, successMessage) {
    setSaving(true)
    setError('')
    const supabase = createClient()
    const { error: updateError } = await supabase
      .from('cooperative_settings')
      .update({ faq_categories: updatedList })
      .eq('cooperative_id', cooperativeId)

    if (updateError) {
      toast.error(updateError.message)
      setError(updateError.message)
      setSaving(false)
      return
    }

    setList(updatedList)
    onUpdated(updatedList)
    setSaving(false)
    toast.success(successMessage)
  }

  function handleAdd() {
    const trimmed = newCategory.trim().toLowerCase()
    if (!trimmed || list.includes(trimmed)) return
    persist([...list, trimmed], 'FAQ category added')
    setNewCategory('')
  }

  async function handleDeleteConfirmed() {
    setSaving(true)
    setError('')
    const supabase = createClient()
    const { error: archiveError } = await supabase
      .from('faq_entries')
      .update({ archived_at: new Date().toISOString() })
      .eq('cooperative_id', cooperativeId)
      .eq('category', categoryToDelete)
      .is('archived_at', null)

    if (archiveError) {
      toast.error(archiveError.message)
      setError(archiveError.message)
      setSaving(false)
      return
    }

    const updatedList = list.filter((c) => c !== categoryToDelete)
    const { error: updateError } = await supabase
      .from('cooperative_settings')
      .update({ faq_categories: updatedList })
      .eq('cooperative_id', cooperativeId)

    if (updateError) {
      toast.error(updateError.message)
      setError(updateError.message)
      setSaving(false)
      return
    }

    setList(updatedList)
    onUpdated(updatedList)
    setCategoryToDelete(null)
    setSaving(false)
    toast.success('FAQ category removed and entries archived')
  }

  return (
    <Modal title="Manage FAQ Categories" onClose={onClose}>
      <div className="space-y-2 mb-4">
        {list.length === 0 && <p className="text-sm text-gray-500">No categories yet.</p>}
        {list.map((category) => (
          <div
            key={category}
            className="flex items-center justify-between px-3 py-2 rounded-lg border border-gray-200"
          >
            <span className="text-sm text-gray-900 capitalize">{category}</span>
            <button
              onClick={() => setCategoryToDelete(category)}
              disabled={saving}
              className="text-xs font-semibold text-red-600"
            >
              Remove
            </button>
          </div>
        ))}
      </div>

      <Alert>{error}</Alert>

      <div className="flex gap-2">
        <input
          value={newCategory}
          onChange={(e) => setNewCategory(e.target.value)}
          aria-label="New category name"
          placeholder="New category name"
          className="flex-1 px-3 py-2 rounded-lg border border-gray-200 bg-gray-50 text-sm"
        />
        <Button size="compact" onClick={handleAdd} disabled={saving}>
          Add
        </Button>
      </div>
      {categoryToDelete && (
        <ConfirmDialog
          title="Remove FAQ Category"
          confirmLabel="Remove and Archive"
          loading={saving}
          onConfirm={handleDeleteConfirmed}
          onClose={() => setCategoryToDelete(null)}
        >
          Removing <span className="font-semibold">{categoryToDelete}</span> will
          archive all FAQ entries in this category. They will no longer be used
          by the chatbot, but you can restore them from the Archived tab.
        </ConfirmDialog>
      )}
    </Modal>
  )
}