'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Modal from '@/components/ui/Modal'
import Alert from '@/components/ui/Alert'
import Button from '@/components/ui/Button'
import { FormInput, FormSelect } from '@/components/ui/FormControls'
import FaqBilingualFields from '@/components/faq/FaqBilingualFields'
import { formatDateTime, DATETIME_FULL_LONG } from '@/lib/format'
import { toast } from '@/lib/toast'

export default function ProvideAnswerModal({ inquiry, cooperativeId, categories, onClose, onAnswered }) {
  const [reply, setReply] = useState('')

  // FAQ part (only used when the checkbox is ticked)
  const [addToFaq, setAddToFaq] = useState(false)
  const [category, setCategory] = useState(categories[0] || '')
  const [faqQuestion, setFaqQuestion] = useState(inquiry.question || '')
  const [faqAnswer, setFaqAnswer] = useState('')
  const [faqQuestionTl, setFaqQuestionTl] = useState('')
  const [faqAnswerTl, setFaqAnswerTl] = useState('')
  const [keywords, setKeywords] = useState('')
  const [movedQuestion, setMovedQuestion] = useState(null)

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  function handleToggleFaq(checked) {
    setAddToFaq(checked)
    // Start the FAQ answer from the reply, the supervisor can then edit it
    if (checked && !faqAnswer.trim()) setFaqAnswer(reply)
  }

  function moveQuestionToTagalog() {
    setMovedQuestion(faqQuestion)
    setFaqQuestionTl(faqQuestion)
    setFaqQuestion('')
  }

  function undoMoveQuestionToTagalog() {
    setFaqQuestion(movedQuestion)
    setFaqQuestionTl('')
    setMovedQuestion(null)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    if (!reply.trim()) {
      setError('Please write a reply before sending.')
      return
    }

    if (addToFaq) {
      if (!faqQuestion.trim() || !faqAnswer.trim()) {
        setError('To add this to the FAQ, fill in the English question and answer.')
        return
      }
      if (!!faqQuestionTl.trim() !== !!faqAnswerTl.trim()) {
        setError('Fill in both the Tagalog question and answer, or leave both empty.')
        return
      }
    }

    setLoading(true)
    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    // 1) Reply to the consumer (they are notified when this is saved)
    const { error: inquiryError } = await supabase
      .from('faq_inquiries')
      .update({
        status: 'answered',
        supervisor_answer: reply.trim(),
        supervisor_id: user.id,
        answered_at: new Date().toISOString(),
      })
      .eq('faq_inquiries_id', inquiry.faq_inquiries_id)

    if (inquiryError) {
      setError(inquiryError.message)
      setLoading(false)
      return
    }

    // 2) Optionally publish it as an FAQ entry
    if (addToFaq) {
      const normalizedKeywords = keywords
        .split(',')
        .map((k) => k.trim())
        .filter(Boolean)
        .join(', ')

      const { error: entryError } = await supabase.from('faq_entries').insert({
        cooperative_id: cooperativeId,
        category,
        question: faqQuestion.trim(),
        answer: faqAnswer.trim(),
        question_tl: faqQuestionTl.trim() || null,
        answer_tl: faqAnswerTl.trim() || null,
        keywords: normalizedKeywords || null,
      })

      if (entryError) {
        // The reply was already sent. Pressing the button again is safe: it
        // won't notify the consumer twice, it only retries the FAQ entry.
        setError(`The reply was sent, but the FAQ entry could not be saved: ${entryError.message}`)
        setLoading(false)
        return
      }
    }

    toast.success(addToFaq ? 'Reply sent and added to the FAQ' : 'Reply sent to the consumer')
    onAnswered()
  }

  return (
    <Modal title="Answer Consumer Inquiry" onClose={onClose} size="xl">
      <div className="bg-blue-50 rounded-lg p-4 mb-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-gray-500 uppercase">Consumer</p>
            <p className="text-sm font-semibold text-gray-900">
              {inquiry.consumer?.first_name} {inquiry.consumer?.last_name}
            </p>
          </div>
          <p className="text-xs text-gray-400">
            {formatDateTime(inquiry.submitted_at, DATETIME_FULL_LONG)}
          </p>
        </div>
        <div className="border-t border-blue-100 my-2" />
        <p className="text-xs font-bold text-gray-500 uppercase">Question</p>
        <p className="text-sm font-semibold text-blue-700">{inquiry.question}</p>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label className="block text-xs font-bold tracking-wide text-gray-600 mb-1.5">
            YOUR REPLY TO THE CONSUMER
          </label>
          <textarea
            rows={4}
            value={reply}
            onChange={(e) => setReply(e.target.value)}
            placeholder="Type the reply the consumer will receive..."
            className="w-full px-3.5 py-2.5 rounded-lg border border-gray-200 bg-gray-50 text-sm placeholder-gray-400"
          />
        </div>

        <label className="flex items-start gap-3 border border-gray-200 rounded-lg p-3 mb-4 cursor-pointer">
          <input
            type="checkbox"
            checked={addToFaq}
            onChange={(e) => handleToggleFaq(e.target.checked)}
            className="w-4 h-4 mt-0.5"
          />
          <div>
            <p className="text-sm font-semibold text-gray-900">Also add this to the FAQ</p>
            <p className="text-xs text-gray-500">
              {addToFaq
                ? 'Other consumers will be able to find this question and answer in the FAQ.'
                : 'Only this consumer will receive the reply. Tick this if the question would help other consumers too.'}
            </p>
          </div>
        </label>

        {addToFaq && (
          <div className="border border-gray-200 rounded-lg p-4 mb-4">
            <p className="text-xs font-bold text-gray-500 uppercase mb-3">FAQ entry</p>

            <FormSelect label="Category" value={category} onChange={(e) => setCategory(e.target.value)}>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat.charAt(0).toUpperCase() + cat.slice(1)}
                </option>
              ))}
            </FormSelect>

            <FaqBilingualFields
              question={faqQuestion}
              onQuestionChange={setFaqQuestion}
              answer={faqAnswer}
              onAnswerChange={setFaqAnswer}
              questionTl={faqQuestionTl}
              onQuestionTlChange={setFaqQuestionTl}
              answerTl={faqAnswerTl}
              onAnswerTlChange={setFaqAnswerTl}
              questionHint={
                movedQuestion === null ? (
                  <button
                    type="button"
                    onClick={moveQuestionToTagalog}
                    className="text-xs text-blue-700 font-medium"
                  >
                    Consumer wrote in Tagalog? Move it to the Tagalog box
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={undoMoveQuestionToTagalog}
                    className="text-xs text-blue-700 font-medium"
                  >
                    Undo
                  </button>
                )
              }
            />

            <FormInput
              wrapperClassName=""
              label="Keywords"
              optional
              value={keywords}
              onChange={(e) => setKeywords(e.target.value)}
              placeholder="e.g. walang kuryente, no power, blackout, brownout"
            />
          </div>
        )}

        <Alert>{error}</Alert>

        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" dim={false} onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? 'Sending…' : addToFaq ? 'Send reply and add to FAQ' : 'Send reply'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
