"use client";

import {
  HelpCircle,
  LayoutGrid,
  Megaphone,
  Users,
  Waypoints,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Logo from "@/components/ui/Logo";

const navItems = [
  { label: "Dashboard", href: "/supervisor/dashboard", icon: LayoutGrid },
  { label: "Dispatch", href: "/supervisor/dispatch", icon: Waypoints },
  { label: "Advisories", href: "/supervisor/advisories", icon: Megaphone },
  { label: "FAQ", href: "/supervisor/faq", icon: HelpCircle },
  { label: "Users", href: "/supervisor/users", icon: Users },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 shrink-0 bg-white border-r border-gray-200 flex flex-col h-full overflow-hidden">
      <div className="px-5 py-5 shrink-0">
        <Logo subtitle="SUPERVISOR PORTAL" />
      </div>

      <nav className="px-3 pb-6 space-y-1 overflow-auto flex-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            pathname === item.href || pathname.startsWith(`${item.href}/`);

          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive ? "page" : undefined}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? "bg-blue-600 text-white"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              }`}
            >
              <Icon className="w-[18px] h-[18px]" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
