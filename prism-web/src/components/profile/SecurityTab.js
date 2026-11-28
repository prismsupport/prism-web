import Alert from '@/components/ui/Alert'
import Card from '@/components/ui/Card'

// "Security" tab. Display only: `security` is the object returned by useProfileSecurity.
// email = the current login email shown on the profile.
export default function SecurityTab({ email, security }) {
  const {
    newEmail,
    setNewEmail,
    emailSaving,
    emailError,
    emailSuccess,
    handleChangeEmail,
    newPassword,
    setNewPassword,
    confirmPassword,
    setConfirmPassword,
    passwordSaving,
    passwordError,
    passwordSuccess,
    handleChangePassword,
  } = security

  return (
    <div className="flex flex-1 flex-col gap-6">
      <Card className="flex flex-1 flex-col justify-between">
        <h2 className="mb-2 text-base font-semibold text-gray-900">Login Email</h2>
        <p className="mb-5 text-sm text-gray-500">
          Current: <span className="font-medium text-gray-700">{email}</span>
        </p>
        <form onSubmit={handleChangeEmail} className="flex flex-1 flex-col justify-between gap-6">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-500">
              New Email Address
            </label>
            <input
              type="email"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              placeholder="new-email@example.com"
              className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-gray-50 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent"
            />
          </div>

          <Alert className="">{emailError}</Alert>
          {emailSuccess && (
            <p className="text-sm text-green-700 bg-green-50 border border-green-100 rounded-lg px-3 py-2">
              {emailSuccess}
            </p>
          )}

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={emailSaving}
              className="px-4 py-2.5 rounded-lg text-sm font-semibold text-white bg-blue-700 hover:bg-blue-800 disabled:opacity-60"
            >
              {emailSaving ? 'Sending…' : 'Update Email'}
            </button>
          </div>
        </form>
      </Card>

      <Card className="flex flex-1 flex-col justify-between">
        <h2 className="mb-4 text-base font-semibold text-gray-900">Change Password</h2>
        <form onSubmit={handleChangePassword} className="flex flex-1 flex-col justify-between gap-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-500">
                New Password
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-gray-50 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-500">
                Confirm New Password
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-gray-50 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent"
              />
            </div>
          </div>

          <Alert className="">{passwordError}</Alert>
          {passwordSuccess && (
            <p className="text-sm text-green-700 bg-green-50 border border-green-100 rounded-lg px-3 py-2">
              {passwordSuccess}
            </p>
          )}

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={passwordSaving}
              className="px-4 py-2.5 rounded-lg text-sm font-semibold text-white bg-blue-700 hover:bg-blue-800 disabled:opacity-60"
            >
              {passwordSaving ? 'Updating…' : 'Update Password'}
            </button>
          </div>
        </form>
      </Card>
    </div>
  )
}