export default function BillingStatusPill({ status }) {
  const styles = {
    pending: 'bg-amber-50 text-amber-700 border-amber-200',
    approved: 'bg-green-50 text-green-700 border-green-200',
    rejected: 'bg-gray-100 text-gray-600 border-gray-200',
  }
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border capitalize ${styles[status]}`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current" />
      {status === 'pending' ? 'Pending Verification' : status}
    </span>
  )
}