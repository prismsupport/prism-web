import Modal from '@/components/ui/Modal'
import Alert from '@/components/ui/Alert'
import Button from '@/components/ui/Button'

// Shows what depends on a service area before it is archived.
// impact = { consumer_count, advisory_count, open_report_count, can_delete } or null while loading.
export default function ArchiveServiceAreaModal({
  area,
  impact,
  impactLoading,
  impactError,
  loading,
  onConfirm,
  onClose,
}) {
  return (
    <Modal title="Archive Service Area" onClose={onClose}>
      <p className="text-sm text-gray-700 mb-4">
        <span className="font-semibold">{area.barangay}</span>,{' '}
        {area.municipality}
      </p>

      {impactLoading && (
        <p className="text-sm text-gray-500 mb-6">Checking what depends on this area…</p>
      )}

      {impactError && (
        <Alert className="mb-6">
          Could not check what depends on this area, so it can't be archived right now. (
          {impactError})
        </Alert>
      )}

      {impact && (
        <>
          <div className="border border-gray-200 rounded-lg divide-y divide-gray-100 mb-4 text-sm">
            <div className="flex justify-between px-3 py-2">
              <span className="text-gray-600">Consumers registered here</span>
              <span className="font-semibold text-gray-900">{impact.consumer_count}</span>
            </div>
            <div className="flex justify-between px-3 py-2">
              <span className="text-gray-600">Current or upcoming advisories aimed here</span>
              <span className="font-semibold text-gray-900">{impact.advisory_count}</span>
            </div>
            <div className="flex justify-between px-3 py-2">
              <span className="text-gray-600">Open reports (not yet resolved)</span>
              <span className="font-semibold text-gray-900">{impact.open_report_count}</span>
            </div>
          </div>

          {!impact.can_delete ? (
            <p className="text-sm text-red-700 bg-red-50 border border-red-100 rounded-lg px-3 py-2 mb-6">
              This area can't be archived while consumers or current/upcoming advisories depend
              on it. Archiving it would stop those consumers from saving an address change and
              leave the advisories pointing at an area that is no longer in use.
            </p>
          ) : (
            <p className="text-sm text-gray-700 mb-6">
              {impact.open_report_count > 0
                ? `Archiving it removes the Area Office and feeder match for ${impact.open_report_count} open report(s), which changes how linemen and duplicates are ranked for them. `
                : 'Nothing depends on this area. '}
              You can restore it later from the archive.
            </p>
          )}
        </>
      )}

      <div className="flex justify-end gap-3">
        <Button variant="outline" dim={false} onClick={onClose} disabled={loading}>
          {impact && !impact.can_delete ? 'Close' : 'Cancel'}
        </Button>
        {impact?.can_delete && (
          <Button variant="danger" onClick={onConfirm} disabled={loading}>
            {loading ? 'Archiving…' : 'Archive'}
          </Button>
        )}
      </div>
    </Modal>
  )
}