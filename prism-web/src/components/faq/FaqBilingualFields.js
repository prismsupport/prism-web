'use client'

const INPUT_CLS =
  'w-full px-3.5 py-2.5 rounded-lg border border-gray-200 bg-gray-50 text-sm placeholder-gray-400'

export default function FaqBilingualFields({
  question,
  onQuestionChange,
  answer,
  onAnswerChange,
  questionTl,
  onQuestionTlChange,
  answerTl,
  onAnswerTlChange,
  questionHint = null,
  answerRows = 4,
}) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
      <div>
        <p className="text-xs font-bold tracking-wide text-gray-500 uppercase mb-2">English</p>

        <label className="block text-sm font-medium text-gray-700 mb-1.5">Question</label>
        <input
          required
          value={question}
          onChange={(e) => onQuestionChange(e.target.value)}
          placeholder="e.g. How do I report a power outage?"
          className={`${INPUT_CLS} mb-1`}
        />
        {questionHint}

        <label className="block text-sm font-medium text-gray-700 mt-3 mb-1.5">Answer</label>
        <textarea
          required
          rows={answerRows}
          value={answer}
          onChange={(e) => onAnswerChange(e.target.value)}
          placeholder="Provide a clear answer with any necessary steps..."
          className={INPUT_CLS}
        />
      </div>

      <div>
        <p className="text-xs font-bold tracking-wide text-green-700 uppercase mb-2">
          Tagalog <span className="text-gray-400 font-normal normal-case">(optional)</span>
        </p>

        <label className="block text-sm font-medium text-gray-700 mb-1.5">Tanong</label>
        <input
          value={questionTl}
          onChange={(e) => onQuestionTlChange(e.target.value)}
          placeholder="hal. Paano mag-ulat ng brownout?"
          className={`${INPUT_CLS} mb-1`}
        />

        <label className="block text-sm font-medium text-gray-700 mt-3 mb-1.5">Sagot</label>
        <textarea
          rows={answerRows}
          value={answerTl}
          onChange={(e) => onAnswerTlChange(e.target.value)}
          placeholder="Isulat ang malinaw na sagot at mga hakbang..."
          className={INPUT_CLS}
        />
      </div>
    </div>
  )
}