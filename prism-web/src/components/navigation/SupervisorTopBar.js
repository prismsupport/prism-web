"use client";

import Link from "next/link";
import { useState } from "react";

export default function SupervisorTopBar({ supervisorName, onLogout }) {
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-30 flex shrink-0 items-center justify-between border-b border-gray-200 bg-white px-8 py-4">
      <div className="relative w-full max-w-lg">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          aria-hidden="true"
          className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
        >
          <circle cx="11" cy="11" r="7" />
          <path d="m21 21-4.3-4.3" />
        </svg>
        <input
          type="text"
          placeholder="Search reports, tickets, or users..."
          className="w-full rounded-lg border border-gray-200 bg-gray-50 py-2.5 pl-9 pr-3.5 text-sm placeholder-gray-400 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-600"
        />
      </div>

      <div className="relative ml-4">
        <button
          type="button"
          onClick={() => setProfileMenuOpen(!profileMenuOpen)}
          className="flex items-center gap-3"
        >
          <span className="text-sm font-medium text-gray-700">
            {supervisorName || "Loading..."}
          </span>
          <div className="h-9 w-9 rounded-full bg-gray-200" />
        </button>

        {profileMenuOpen && (
          <>
            <button
              type="button"
              aria-label="Close profile menu"
              className="fixed inset-0 z-10"
              onClick={() => setProfileMenuOpen(false)}
            ></button>
            <div className="absolute right-0 top-full z-20 mt-2 w-44 overflow-hidden rounded-lg border border-gray-200 bg-white shadow-lg">
              <Link
                href="/supervisor/profile"
                onClick={() => setProfileMenuOpen(false)}
                className="block px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
              >
                Edit Profile
              </Link>
              <button
                type="button"
                onClick={onLogout}
                className="block w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
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
