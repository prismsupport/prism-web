'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Modal from '@/components/ui/Modal'
import Alert from '@/components/ui/Alert'
import Button from '@/components/ui/Button'
import { FormInput, FormSelect } from '@/components/ui/FormControls'
import FaqBilingualFields from '@/components/faq/FaqBilingualFields'
import { toast } from '@/lib/toast'

export default function AddEditFaqModal({ cooperativeId, entry, categories, onClose, onSaved }) {
  const isEditing = !!entry
  const [category, setCategory] = useState(entry?.category || categories[0] || '')
  const [question, setQuestion] = useState(entry?.question || '')
  const [answer, setAnswer] = useState(entry?.answer || '')
  const [questionTl, setQuestionTl] = useState(entry?.question_tl || '')
  const [answerTl, setAnswerTl] = useState(entry?.answer_tl || '')
  const [keywords, setKeywords] = useState(entry?.keywords || '')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    if (!!questionTl.trim() !== !!answerTl.trim()) {
      setError('Fill in both the Tagalog question and answer, or leave both empty.')
      return
    }

    setLoading(true)
    const supabase = createClient()

    const normalizedKeywords = keywords
      .split(',')
      .map((k) => k.trim())
      .filter(Boolean)
      .join(', ')

    const fields = {
      category,
      question,
      answer,
      question_tl: questionTl.trim() || null,
      answer_tl: answerTl.trim() || null,
      keywords: normalizedKeywords || null,
    }

    if (isEditing) {
      const { error: updateError } = await supabase
        .from('faq_entries')
        .update({ ...fields, updated_at: new Date().toISOString() })
        .eq('faq_id', entry.faq_id)

      if (updateError) {
        setError(updateError.message)
        setLoading(false)
        return
      }
    } else {
      const { error: insertError } = await supabase
        .from('faq_entries')
        .insert({ cooperative_id: cooperativeId, ...fields })

      if (insertError) {
        setError(insertError.message)
        setLoading(false)
        return
      }
    }

    toast.success(isEditing ? 'FAQ updated' : 'FAQ added')
    onSaved()
  }

  return (
    <Modal title={isEditing ? 'Edit FAQ' : 'Add New FAQ'} onClose={onClose} size="xl">
      <form onSubmit={handleSubmit}>
        <FormSelect label="Category" value={category} onChange={(e) => setCategory(e.target.value)}>
          {categories.map((cat) => (
            <option key={cat} value={cat}>
              {cat.charAt(0).toUpperCase() + cat.slice(1)}
            </option>
          ))}
        </FormSelect>

        <FaqBilingualFields
          question={question}
          onQuestionChange={setQuestion}
          answer={answer}
          onAnswerChange={setAnswer}
          questionTl={questionTl}
          onQuestionTlChange={setQuestionTl}
          answerTl={answerTl}
          onAnswerTlChange={setAnswerTl}
        />

        <FormInput
          label="Keywords"
          optional
          value={keywords}
          onChange={(e) => setKeywords(e.target.value)}
          placeholder="e.g. walang kuryente, no power, blackout, brownout"
          hint="Comma-separated synonyms or alternate phrasings (including Filipino terms) the chatbot should also match to this question."
        />

        <Alert>{error}</Alert>

        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" dim={false} onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? 'Saving…' : isEditing ? 'Save Changes' : 'Save FAQ'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
