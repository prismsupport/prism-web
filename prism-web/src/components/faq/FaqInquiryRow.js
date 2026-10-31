import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import { formatDateTime, DATETIME_FULL_LONG } from '@/lib/format'

export default function FaqInquiryRow({ inquiry, onAnswer, isUnread, onOpen }) {
  return (
    <div className="flex items-center justify-between gap-4 px-5 py-4 border-b border-gray-100 last:border-0">
      <div>
        <Badge tone="amber" className="inline-block mr-2">
          PENDING
        </Badge>
        <span className="text-xs text-gray-400">
          {formatDateTime(inquiry.submitted_at, DATETIME_FULL_LONG)}
        </span>
        <p className="text-sm text-gray-900 mt-1">
          {isUnread && (
            <span className="inline-block w-2 h-2 mr-2 rounded-full bg-red-500 align-middle" />
          )}
          {inquiry.question}
        </p>
        <p className="text-xs text-gray-400 mt-1">
          From: {inquiry.consumer?.first_name} {inquiry.consumer?.last_name}
        </p>
      </div>
      <Button
        size="xs"
        dim={false}
        onClick={() => {
          onOpen?.()
          onAnswer(inquiry)
        }}
      >
        Provide Answer
      </Button>
    </div>
  )
}
