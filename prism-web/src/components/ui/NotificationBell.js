'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

function timeAgo(dateString) {
  const seconds = Math.floor((new Date() - new Date(dateString)) / 1000)
  if (seconds < 60) return 'Just now'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

export default function NotificationBell() {
  const [notifications, setNotifications] = useState([])
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [userId, setUserId] = useState(null)

  useEffect(() => {
    let channel

    async function init() {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return
      setUserId(user.id)

      await loadNotifications(user.id)

      channel = supabase
        .channel(`notifications-${user.id}`)
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` },
          (payload) => {
            setNotifications((prev) => [payload.new, ...prev])
          }
        )
        .subscribe()
    }

    init()

    return () => {
      if (channel) {
        const supabase = createClient()
        supabase.removeChannel(channel)
      }
    }
  }, [])

  async function loadNotifications(uid) {
    setLoading(true)
    const supabase = createClient()
    const { data } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', uid)
      .order('created_at', { ascending: false })
      .limit(20)
    setNotifications(data || [])
    setLoading(false)
  }

  const unreadCount = notifications.filter((n) => !n.is_read).length

  async function handleMarkAsRead(notification) {
    if (notification.is_read) return
    const supabase = createClient()
    await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('notification_id', notification.notification_id)
    setNotifications((prev) =>
      prev.map((n) =>
        n.notification_id === notification.notification_id ? { ...n, is_read: true } : n
      )
    )
  }

  async function handleMarkAllRead() {
    if (unreadCount === 0 || !userId) return
    const supabase = createClient()
    await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', userId)
      .eq('is_read', false)
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })))
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="relative text-gray-500 hover:text-gray-700"
        aria-label="Notifications"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className="w-5 h-5"
        >
          <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full border border-white" />
        )}
      </button>

      {open && (
        <>
          <button
            type="button"
            aria-label="Close notifications"
            className="fixed inset-0 z-10"
            onClick={() => setOpen(false)}
          />
          <div className="absolute right-0 top-full z-20 mt-2 w-80 max-h-96 overflow-y-auto rounded-lg border border-gray-200 bg-white shadow-lg">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
              <p className="text-sm font-bold text-gray-900">Notifications</p>
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={handleMarkAllRead}
                  className="text-xs text-blue-700 font-medium"
                >
                  Mark all as read
                </button>
              )}
            </div>

            {loading && (
              <p className="text-sm text-gray-500 px-4 py-6 text-center">Loading…</p>
            )}

            {!loading && notifications.length === 0 && (
              <p className="text-sm text-gray-500 px-4 py-6 text-center">
                No notifications yet.
              </p>
            )}

            {!loading &&
              notifications.map((n) => (
                <button
                  key={n.notification_id}
                  type="button"
                  onClick={() => handleMarkAsRead(n)}
                  className={`block w-full text-left px-4 py-3 border-b border-gray-50 last:border-0 hover:bg-gray-50 ${
                    !n.is_read ? 'bg-blue-50/40' : ''
                  }`}
                >
                  <div className="flex items-start gap-2">
                    {!n.is_read && (
                      <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-blue-600 shrink-0" />
                    )}
                    <div className={!n.is_read ? '' : 'pl-3.5'}>
                      <p className="text-sm font-semibold text-gray-900">{n.title}</p>
                      <p className="text-xs text-gray-600 mt-0.5">{n.message}</p>
                      <p className="text-xs text-gray-400 mt-1">{timeAgo(n.created_at)}</p>
                    </div>
                  </div>
                </button>
              ))}
          </div>
        </>
      )}
    </div>
  )
}