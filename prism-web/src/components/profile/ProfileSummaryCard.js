'use client'

import { useRef } from 'react'
import Card from '@/components/ui/Card'

// Left-hand card: photo, name, role badge, and the cooperative / email / role / since details.
export default function ProfileSummaryCard({
  avatarUrl,
  avatarUploading,
  avatarError,
  onAvatarSelected,
  firstName,
  lastName,
  cooperativeName,
  email,
  isOwner,
  memberSince,
}) {
  const fileInputRef = useRef(null)

  return (
    <Card className="flex h-full flex-col justify-between lg:sticky lg:top-6">
      <div className="flex flex-col items-center text-center">
        <div className="relative">
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt="Profile"
              className="h-32 w-32 rounded-full border border-gray-200 object-cover"
            />
          ) : (
            <div className="h-32 w-32 rounded-full border border-gray-300 bg-gray-200" />
          )}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={avatarUploading}
            className="absolute bottom-0 right-0 flex h-9 w-9 items-center justify-center rounded-full border-2 border-white bg-blue-700 text-white hover:bg-blue-800"
            title="Change photo"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
              <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2Z" />
              <circle cx="12" cy="13" r="4" />
            </svg>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png, image/jpeg, image/webp"
            className="hidden"
            onChange={onAvatarSelected}
          />
        </div>
        {avatarUploading && (
          <p className="text-xs text-gray-400 mt-2">Uploading…</p>
        )}
        {avatarError && (
          <p className="text-xs text-red-600 mt-2">{avatarError}</p>
        )}

        <p className="mt-6 text-xl font-bold text-gray-900">
          {firstName} {lastName}
        </p>
        <span className="mt-2 inline-block rounded bg-blue-50 px-3 py-1 text-sm font-bold uppercase text-blue-700">
          Supervisor
        </span>
      </div>

      <div className="mt-8 grid gap-5 border-t border-gray-100 pt-6 text-sm">
        <div>
          <p className="text-sm text-gray-400">Cooperative</p>
          <p className="mt-1 text-base font-semibold text-gray-900">{cooperativeName || '—'}</p>
        </div>
        <div>
          <p className="text-sm text-gray-400">Email</p>
          <p className="mt-1 break-words text-base font-semibold text-gray-900">{email || '—'}</p>
        </div>
        <div>
          <p className="text-sm text-gray-400">Role</p>
          <p className="mt-1 text-base font-semibold text-gray-900">{isOwner ? 'Cooperative Owner' : 'Supervisor'}</p>
        </div>
        <div>
          <p className="text-sm text-gray-400">Supervisor Since</p>
          <p className="mt-1 text-base font-semibold text-gray-900">
            {memberSince
              ? new Date(memberSince).toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' })
              : '—'}
          </p>
        </div>
      </div>
    </Card>
  )
}