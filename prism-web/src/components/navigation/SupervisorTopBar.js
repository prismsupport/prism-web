"use client";

import Link from "next/link";
import { useState } from "react";
import Avatar from "@/components/ui/Avatar";
import NotificationBell from "@/components/ui/NotificationBell";

export default function SupervisorTopBar({ supervisorName, avatarUrl, onLogout }) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center justify-end gap-2 border-b border-gray-200 bg-white px-8">
      <NotificationBell />

      <div className="relative ml-1">
        <button
          type="button"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Account menu"
          className="flex items-center gap-1.5 rounded-full p-0.5 transition-colors hover:bg-gray-100"
        >
          <Avatar name={supervisorName} src={avatarUrl} size={36} />
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="mr-1 h-4 w-4 text-gray-400"
          >
            <path d="m6 9 6 6 6-6" />
          </svg>
        </button>

        {menuOpen && (
          <>
            <button
              type="button"
              aria-label="Close account menu"
              className="fixed inset-0 z-10 cursor-default"
              onClick={() => setMenuOpen(false)}
            />
            <div className="absolute right-0 top-full z-20 mt-2 w-56 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-lg">
              <div className="border-b border-gray-100 px-4 py-3">
                <p className="truncate text-sm font-semibold text-gray-900">
                  {supervisorName || "Loading…"}
                </p>
                <p className="text-xs text-gray-400">Supervisor</p>
              </div>
              <Link
                href="/supervisor/profile"
                onClick={() => setMenuOpen(false)}
                className="block px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
              >
                Edit Profile
              </Link>
              <button
                type="button"
                onClick={onLogout}
                className="block w-full px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-gray-50"
              >
                Logout
              </button>
            </div>
          </>
        )}
      </div>
    </header>
  );
}