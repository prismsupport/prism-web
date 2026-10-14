"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Avatar from "@/components/ui/Avatar";
import NotificationBell from "@/components/ui/NotificationBell";

export default function SupervisorTopBar({ supervisorName, avatarUrl, onLogout }) {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchText, setSearchText] = useState("");

  // Press "/" anywhere to open search.
  useEffect(() => {
    function onKey(e) {
      const tag = e.target.tagName;
      if (e.key === "/" && tag !== "INPUT" && tag !== "TEXTAREA" && !e.target.isContentEditable) {
        e.preventDefault();
        setSearchOpen(true);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  function handleSearchSubmit(event) {
    event.preventDefault();
    const query = searchText.trim();
    if (query) router.push(`/supervisor/search?q=${encodeURIComponent(query)}`);
  }

  function closeSearch() {
    setSearchText("");
    setSearchOpen(false);
  }

  return (
    <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center justify-end gap-2 border-b border-gray-200 bg-white px-8">
      <form
        onSubmit={handleSearchSubmit}
        className={`flex items-center overflow-hidden rounded-full border transition-all duration-200 ${
          searchOpen ? "w-80 border-gray-200 bg-gray-50" : "w-9 border-transparent"
        }`}
      >
        <button
          type="button"
          onClick={() => setSearchOpen(true)}
          aria-label="Search"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            className="h-5 w-5"
          >
            <circle cx="11" cy="11" r="7" />
            <path d="m21 21-4.3-4.3" />
          </svg>
        </button>
        {searchOpen && (
          <input
            autoFocus
            type="text"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            onBlur={() => !searchText && setSearchOpen(false)}
            onKeyDown={(e) => e.key === "Escape" && closeSearch()}
            aria-label="Search reports, tickets, or users"
            placeholder="Search reports, tickets, or users…"
            className="min-w-0 flex-1 bg-transparent pr-4 text-sm placeholder-gray-400 focus:outline-none"
          />
        )}
      </form>

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