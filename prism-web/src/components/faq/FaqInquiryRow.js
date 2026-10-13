export default function FaqInquiryRow({ inquiry, onAnswer, isUnread, onOpen }) {
  return (
    <div className="flex items-center justify-between gap-4 px-5 py-4 border-b border-gray-100 last:border-0">
      <div>
        <span className="inline-block bg-amber-50 text-amber-700 text-xs font-bold px-2 py-0.5 rounded mr-2">
          PENDING
        </span>
        <span className="text-xs text-gray-400">
          {new Date(inquiry.submitted_at).toLocaleString("en-PH", {
            month: "long",
            day: "numeric",
            year: "numeric",
            hour: "numeric",
            minute: "2-digit",
          })}
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
      <button
        onClick={() => {
          onOpen?.();
          onAnswer(inquiry);
        }}
        className="bg-blue-700 hover:bg-blue-800 text-white text-xs font-semibold px-4 py-2 rounded-lg transition-colors whitespace-nowrap"
      >
        Provide Answer
      </button>
    </div>
  );
}
