"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Logo from "@/components/ui/Logo";
import supervisorNavItems from "./supervisorNavItems";

export default function SupervisorSidebar() {
  const pathname = usePathname();

  return (
    <aside className="h-screen w-64 shrink-0 overflow-y-auto border-r border-gray-200 bg-white">
      <div className="border-b border-gray-100 px-6 py-5">
        <Logo subtitle="SUPERVISOR PORTAL" />
      </div>

      <nav className="space-y-1 px-3 py-4">
        {supervisorNavItems.map((item) => {
          const isActive = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`block rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                isActive
                  ? "bg-blue-700 text-white"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
