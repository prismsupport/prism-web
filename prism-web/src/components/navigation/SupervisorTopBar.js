"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ChevronDown, LogOut, UserRound } from "lucide-react";
import Avatar from "@/components/ui/Avatar";
import NotificationBell from "@/components/ui/NotificationBell";

export default function SupervisorTopBar({ supervisorName, avatarUrl, onLogout }) {
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    if (!menuOpen) return;
    function onKey(event) {
      if (event.key === "Escape") setMenuOpen(false);
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [menuOpen]);

  return (
    <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center justify-end gap-2 border-b border-gray-200 bg-white px-4 sm:px-8">
      <NotificationBell />

      <div className="h-6 w-px bg-gray-200" />

      <div className="relative">
        <button
          type="button"
          onClick={() => setMenuOpen((open) => !open)}
          aria-label="Account menu"
          aria-expanded={menuOpen}
          className="flex items-center gap-2 rounded-full py-0.5 pl-0.5 pr-2 transition-colors hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-600"
        >
          <Avatar name={supervisorName} src={avatarUrl} size={36} />
          <ChevronDown
            size={16}
            className={`text-gray-400 transition-transform ${menuOpen ? "rotate-180" : ""}`}
            aria-hidden="true"
          />
        </button>

        {menuOpen && (
          <>
            <button
              type="button"
              aria-label="Close account menu"
              className="fixed inset-0 z-10 cursor-default"
              onClick={() => setMenuOpen(false)}
            />
            <div className="absolute right-0 top-full z-20 mt-2 w-60 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-lg">
              <div className="flex items-center gap-3 border-b border-gray-100 px-4 py-3.5">
                <Avatar name={supervisorName} src={avatarUrl} size={40} />
                <div>
                  <p className="truncate text-sm font-semibold text-gray-900">
                    {supervisorName || "Loading…"}
                  </p>
                  <p className="text-xs text-gray-400">Supervisor access</p>
                </div>
              </div>
              <Link
                href="/supervisor/profile"
                onClick={() => setMenuOpen(false)}
                className="flex w-full items-center gap-2.5 px-4 py-3 text-left text-sm text-gray-700 transition-colors hover:bg-gray-50"
              >
                <UserRound size={16} className="text-gray-400" aria-hidden="true" />
                Edit Profile
              </Link>
              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false);
                  onLogout();
                }}
                className="flex w-full items-center gap-2.5 px-4 py-3 text-left text-sm text-gray-700 transition-colors hover:bg-gray-50"
              >
                <LogOut size={16} className="text-gray-400" aria-hidden="true" />
                Log out
              </button>
            </div>
          </>
        )}
      </div>
    </header>
  );
}