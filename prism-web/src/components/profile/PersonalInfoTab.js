import Alert from '@/components/ui/Alert'
import Card from '@/components/ui/Card'
import FormSection from '@/components/ui/FormSection'
import FormField from '@/components/ui/FormField'

// "Personal Information" tab. Display only: the page owns the data and the handlers.
// onEdit  = setEditing(true) and clear the success message
// onCancel = setEditing(false) and reload the profile
export default function PersonalInfoTab({
  isOwner,
  featureAccess,
  form,
  onChange,
  editing,
  onEdit,
  onCancel,
  onSave,
  saving,
  error,
  success,
}) {
  return (
    <div className="flex flex-1 flex-col gap-6">
      <Card className="flex flex-1 flex-col justify-between">
        <h2 className="mb-2 text-base font-semibold text-gray-900">Your Access</h2>
        <p className="mb-5 text-sm text-gray-500">
          {isOwner
            ? 'As the cooperative owner you have full access to every feature.'
            : 'These are the features your cooperative owner has assigned to you.'}
        </p>
        <div className="flex flex-wrap gap-2">
          {isOwner ? (
            <span className="rounded-full bg-blue-100 px-3 py-1.5 text-sm font-bold text-blue-700">Full access</span>
          ) : featureAccess.length > 0 ? (
            featureAccess.map((f) => (
                <span key={f} className="rounded-full bg-gray-100 px-3 py-1.5 text-sm font-semibold text-gray-700 capitalize">
                {f}
              </span>
            ))
          ) : (
            <span className="text-xs text-gray-400">No features assigned yet.</span>
          )}
        </div>
      </Card>
      <Card className="flex flex-1 flex-col">
        <div className="mb-5 flex items-center justify-between border-b border-gray-100 pb-3">
          <h2 className="text-base font-semibold text-gray-900">Personal Details</h2>
          {!editing && (
            <button
              onClick={onEdit}
              className="text-xs font-semibold text-blue-700"
            >
              Edit
            </button>
          )}
        </div>

        <div className="flex flex-1 flex-col justify-between">
          <FormSection title="Basic Information">
            <FormField
              label="First Name"
              name="first_name"
              value={form.first_name}
              onChange={onChange}
              disabled={!editing}
            />
            <FormField
              label="Last Name"
              name="last_name"
              value={form.last_name}
              onChange={onChange}
              disabled={!editing}
            />
            <FormField
              label="Contact Number"
              name="phone_number"
              value={form.phone_number}
              onChange={onChange}
              disabled={!editing}
            />
            <FormField label="Email Address" value={form.email} disabled />
          </FormSection>

          <div>
            <Alert>{error}</Alert>
            {success && (
              <p className="mb-4 rounded-lg border border-green-100 bg-green-50 px-3 py-2 text-sm text-green-700">
                {success}
              </p>
            )}

            {editing && (
              <div className="flex justify-end gap-3">
                <button
                  onClick={onCancel}
                  className="rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={onSave}
                  disabled={saving}
                  className="rounded-lg bg-blue-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-800 disabled:opacity-60"
                >
                  {saving ? 'Saving…' : 'Save Changes'}
                </button>
              </div>
            )}
          </div>
        </div>
      </Card>
    </div>
  )
}