import Button from '@/components/ui/Button'
import Alert from '@/components/ui/Alert'
import { INPUT, MAX_PHOTO_MB } from '@/lib/billing/powerRates'

// Custom overlay, not the shared Modal, so the visuals stay as they were.
// Render it inside the panel's <form>: the Save and Publish button is a submit button.
// onClose = close the popup, turn "post" off and clear the error (the panel does all three).
export default function PowerRatesAdvisoryPopup({
  error,
  saving,
  title,
  setTitle,
  description,
  setDescription,
  descEdited,
  setDescEdited,
  photoFile,
  setPhotoFile,
  onPhoto,
  onClose,
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget && !saving) {
          onClose()
        }
      }}
    >
      <div className="flex max-h-[90vh] w-full max-w-xl flex-col overflow-hidden rounded-xl bg-white shadow-2xl">

        {/* Popup Header */}
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-5">
          <div>
            <h2 className="text-lg font-bold text-gray-900">
              Post Power Rates Advisory
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Prepare the announcement for your consumers.
            </p>
          </div>

          <button
            type="button"
            disabled={saving}
            onClick={onClose}
            className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700"
            aria-label="Close advisory popup"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            >
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Popup Content */}
        <div className="space-y-5 overflow-y-auto p-6">

          {error && <Alert>{error}</Alert>}

          {/* Title */}
          <label className="block">
            <span className="mb-1.5 block text-sm font-semibold text-gray-700">
              Advisory Title
            </span>

            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter advisory title"
              className={INPUT}
              maxLength={150}
            />
          </label>

          {/* Description */}
          <label className="block">
            <span className="mb-1.5 block text-sm font-semibold text-gray-700">
              Description
            </span>

            <textarea
              rows={5}
              value={description}
              onChange={(e) => {
                setDescription(e.target.value)
                setDescEdited(true)
              }}
              placeholder="Write the advisory details..."
              className={`${INPUT} resize-y`}
            />

            {descEdited && (
              <button
                type="button"
                onClick={() => setDescEdited(false)}
                className="mt-2 text-xs font-medium text-blue-700 hover:underline"
              >
                Rewrite from the rates above
              </button>
            )}
          </label>

          {/* Poster Attachment */}
          <div>
            <div className="mb-2">
              <span className="block text-sm font-semibold text-gray-700">
                Advisory Poster{' '}
                <span className="font-normal text-gray-400">
                  (Optional)
                </span>
              </span>

              <p className="mt-1 text-xs text-gray-500">
                Upload an image to accompany your power rates announcement.
              </p>
            </div>

            <label
              htmlFor="advisory-poster"
              className="group flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 px-5 py-8 text-center transition-colors hover:border-blue-400 hover:bg-blue-50/50"
            >
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 text-blue-600 transition-colors group-hover:bg-blue-200">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect x="3" y="3" width="18" height="18" rx="2" />
                  <circle cx="8.5" cy="8.5" r="1.5" />
                  <path d="m21 15-5-5L5 21" />
                </svg>
              </div>

              <span className="text-sm font-semibold text-gray-700">
                {photoFile
                  ? 'Change poster image'
                  : 'Click to upload a poster'}
              </span>

              <span className="mt-1 text-xs text-gray-500">
                JPG or PNG · Maximum file size: {MAX_PHOTO_MB} MB
              </span>

              <input
                id="advisory-poster"
                type="file"
                accept="image/jpeg,image/png"
                onChange={onPhoto}
                className="hidden"
              />
            </label>

            {/* Selected File */}
            {photoFile && (
              <div className="mt-3 flex items-center justify-between gap-3 rounded-lg border border-gray-200 bg-white p-3">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <rect x="3" y="3" width="18" height="18" rx="2" />
                      <circle cx="8.5" cy="8.5" r="1.5" />
                      <path d="m21 15-5-5L5 21" />
                    </svg>
                  </div>

                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-gray-800">
                      {photoFile.name}
                    </p>

                    <p className="text-xs text-gray-400">
                      {(photoFile.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setPhotoFile(null)}
                  className="shrink-0 rounded-md px-2 py-1 text-xs font-semibold text-red-600 hover:bg-red-50"
                >
                  Remove
                </button>
              </div>
            )}
          </div>

        </div>

        {/* Popup Footer */}
        <div className="flex flex-wrap justify-end gap-3 border-t border-gray-100 bg-gray-50 px-6 py-4">

          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-50"
          >
            Cancel
          </button>

          <Button type="submit" disabled={saving}>
            {saving ? 'Publishing…' : 'Save and Publish'}
          </Button>

        </div>
      </div>
    </div>
  )
}