export default function PhotoEvidenceCard({ title = 'Photo Evidence', photoUrl }) {

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <h2 className="text-sm font-bold text-gray-900 mb-3">{title}</h2>
      {photoUrl ? (
        <img
          src={photoUrl}
          alt={title}
          className="w-full rounded-lg border border-gray-200"
        />
      ) : (
        <p className="text-sm text-gray-400 italic">No photo submitted.</p>
      )}
    </div>
  )
}