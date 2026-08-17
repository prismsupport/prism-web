import { Bell, Search } from "lucide-react";

// Search and notifications are presentational for now — neither is wired to
// data yet, so this stays a Server Component.
export default function Header() {
  return (
    <header className="flex items-center gap-4 px-6 py-3 bg-white border-b border-gray-200">
      <div className="relative flex-1 max-w-2xl">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="search"
          placeholder="Search reports, tickets, or personnel..."
          aria-label="Search reports, tickets, or personnel"
          className="w-full pl-10 pr-3.5 py-2.5 rounded-lg border border-gray-200 bg-gray-50 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent"
        />
      </div>

      <div className="ml-auto flex items-center gap-4">
        <span className="relative inline-flex p-2 text-gray-500">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-500 ring-2 ring-white" />
        </span>

        <div className="h-6 w-px bg-gray-200" />

        <div className="flex items-center gap-3">
          <span className="text-xs font-bold tracking-wide text-gray-700">
            SUPERVISOR
          </span>
          <div className="w-9 h-9 rounded-full bg-gray-100 border border-gray-300" />
        </div>
      </div>
    </header>
  );
}
