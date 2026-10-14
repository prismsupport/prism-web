"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Logo from "@/components/ui/Logo";
import supervisorNavItems from "./supervisorNavItems";
import { usePermissions } from "@/lib/supervisor/PermissionsContext";

function LockIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-3.5 w-3.5 shrink-0"
      aria-hidden="true"
    >
      <rect x="3" y="11" width="18" height="11" rx="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}

export default function SupervisorSidebar() {
  const pathname = usePathname();
  const { loading, canAccessPath } = usePermissions();

  return (
    <aside className="h-screen w-64 shrink-0 overflow-y-auto border-r border-gray-200 bg-white">
      <div className="border-b border-gray-100 px-6 py-5">
        <Logo subtitle="SUPERVISOR PORTAL" />
      </div>

      <nav className="space-y-1 px-3 py-4">
        {supervisorNavItems.map((item) => {
          const isActive = pathname.startsWith(item.href);
          const locked = !loading && !canAccessPath(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              title={locked ? "Restricted: you don't have access to this page" : undefined}
              className={`flex items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                locked
                  ? `opacity-50 ${
                      isActive
                        ? "bg-gray-200 text-gray-700"
                        : "text-gray-500 hover:bg-gray-100"
                    }`
                  : isActive
                  ? "bg-blue-700 text-white"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              <span>{item.label}</span>
              {locked && <LockIcon />}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}