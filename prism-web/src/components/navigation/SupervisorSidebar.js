"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import Logo from "@/components/ui/Logo";
import { usePermissions } from "@/lib/supervisor/PermissionsContext";
import useNavCounts from "@/lib/supervisor/useNavCounts";
import supervisorNavItems from "./supervisorNavItems";

const STORAGE_KEY = "prism.sidebar.collapsed";

const ICONS = {
  dashboard: (
    <>
      <rect width="7" height="9" x="3" y="3" rx="1" />
      <rect width="7" height="5" x="14" y="3" rx="1" />
      <rect width="7" height="9" x="14" y="12" rx="1" />
      <rect width="7" height="5" x="3" y="16" rx="1" />
    </>
  ),
  dispatch: (
    <>
      <rect width="8" height="4" x="8" y="2" rx="1" ry="1" />
      <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
      <path d="M12 11h4" />
      <path d="M12 16h4" />
      <path d="M8 11h.01" />
      <path d="M8 16h.01" />
    </>
  ),
  advisories: (
    <>
      <path d="m3 11 18-5v12L3 14v-3z" />
      <path d="M11.6 16.8a3 3 0 1 1-5.8-1.6" />
    </>
  ),
  faq: (
    <>
      <circle cx="12" cy="12" r="10" />
      <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
      <path d="M12 17h.01" />
    </>
  ),
  billing: (
    <>
      <path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1Z" />
      <path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8" />
      <path d="M12 17.5v-11" />
    </>
  ),
  users: (
    <>
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </>
  ),
  fallback: <circle cx="12" cy="12" r="3" />,
};

function Icon({ children, className = "h-5 w-5" }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`${className} shrink-0`}
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

function LockIcon({ className = "h-3.5 w-3.5" }) {
  return (
    <Icon className={className}>
      <rect x="3" y="11" width="18" height="11" rx="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </Icon>
  );
}

function iconFor(href) {
  const key = href.split("/").filter(Boolean).pop();
  return ICONS[key] || ICONS.fallback;
}

export default function SupervisorSidebar() {
  const pathname = usePathname();
  const { loading, canAccessPath } = usePermissions();
  const counts = useNavCounts();

  const [collapsed, setCollapsed] = useState(false);
  const [lockedMessage, setLockedMessage] = useState("");

  // Restore the saved sidebar state.
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);

    if (saved !== null) {
      setCollapsed(saved === "1");
    } else if (window.innerWidth < 1024) {
      setCollapsed(true);
    }
  }, []);

  // Automatically dismiss the restriction message.
  useEffect(() => {
    if (!lockedMessage) return;

    const timeout = setTimeout(() => {
      setLockedMessage("");
    }, 3500);

    return () => clearTimeout(timeout);
  }, [lockedMessage]);

  function toggle() {
    const next = !collapsed;

    setCollapsed(next);
    localStorage.setItem(STORAGE_KEY, next ? "1" : "0");
  }

  function handleLockedClick(label) {
    setLockedMessage(
      `Access restricted: You don't have permission to access ${label}.`
    );
  }

  const itemBase = `relative flex w-full items-center gap-3 rounded-xl py-2.5 text-sm font-medium ${
    collapsed ? "justify-center px-0" : "px-3"
  }`;

  return (
    <aside
      className={`relative z-40 flex h-screen shrink-0 flex-col bg-blue-950 transition-[width] duration-200 ${
        collapsed ? "w-[76px]" : "w-64"
      }`}
    >
      {/* Logo */}
      <div
        className={`flex h-16 shrink-0 items-center border-b border-white/10 ${
          collapsed ? "justify-center" : "px-5"
        }`}
      >
        <Logo onDark compact={collapsed} subtitle="SUPERVISOR PORTAL" />
      </div>

      {/* Navigation */}
      <nav
        aria-label="Supervisor navigation"
        className="flex-1 space-y-1 overflow-y-auto px-3 py-4"
      >
        {supervisorNavItems.map((item) => {
          const isActive =
            pathname === item.href ||
            pathname.startsWith(`${item.href}/`);

          // Avoid showing locked states before permissions are loaded.
          const locked = !loading && !canAccessPath(item.href);
          const count = counts[item.href] || 0;

          // Locked items are buttons, not links.
          // Clicking them displays a restriction message.
          if (locked) {
            return (
              <button
                key={item.href}
                type="button"
                onClick={() => handleLockedClick(item.label)}
                title={
                  collapsed
                    ? `${item.label} — Access restricted`
                    : "You don't have access to this section"
                }
                aria-label={`${item.label}, access restricted`}
                aria-disabled="true"
                className={`${itemBase} cursor-not-allowed transition-colors ${
                  isActive
                    ? "bg-white/10 text-blue-200/50"
                    : "text-blue-200/40 hover:bg-white/5 hover:text-blue-200/60"
                }`}
              >
                <Icon>{iconFor(item.href)}</Icon>

                {!collapsed && (
                  <>
                    <span className="truncate">{item.label}</span>
                    <LockIcon className="ml-auto h-3.5 w-3.5 shrink-0" />
                  </>
                )}

                {collapsed && (
                  <span className="absolute right-1 top-1 rounded-full bg-blue-900 p-0.5 text-blue-300">
                    <LockIcon className="h-3 w-3" />
                  </span>
                )}
              </button>
            );
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive ? "page" : undefined}
              className={`group ${itemBase} transition-colors ${
                isActive
                  ? "bg-white/15 text-white"
                  : "text-blue-200 hover:bg-white/10 hover:text-white"
              }`}
            >
              {isActive && (
                <span className="absolute -left-3 top-1/2 h-6 w-1 -translate-y-1/2 rounded-r-full bg-amber-400" />
              )}

              <Icon>{iconFor(item.href)}</Icon>

              {!collapsed && (
                <span className="truncate">{item.label}</span>
              )}

              {count > 0 &&
                (collapsed ? (
                  <span className="absolute right-1.5 top-1 min-w-[18px] rounded-full bg-amber-400 px-1 text-center text-[10px] font-bold leading-[18px] text-blue-950">
                    {count > 99 ? "99+" : count}
                  </span>
                ) : (
                  <span className="ml-auto rounded-full bg-amber-400 px-2 py-0.5 text-[11px] font-bold leading-none text-blue-950">
                    {count > 99 ? "99+" : count}
                  </span>
                ))}

              {collapsed && (
                <span className="pointer-events-none absolute left-full z-50 ml-3 whitespace-nowrap rounded-md bg-gray-900 px-2.5 py-1.5 text-xs font-medium text-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100">
                  {item.label}
                  {count > 0 ? ` (${count})` : ""}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Restriction message */}
      {lockedMessage && (
        <div
          role="status"
          aria-live="polite"
          className="mx-3 mb-3 rounded-lg border border-amber-400/30 bg-blue-900 px-3 py-3 text-xs leading-relaxed text-blue-100 shadow-lg"
        >
          <div className="flex items-start gap-2">
            <LockIcon className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" />

            <p className="min-w-0 flex-1">{lockedMessage}</p>

            <button
              type="button"
              onClick={() => setLockedMessage("")}
              aria-label="Dismiss restriction message"
              className="shrink-0 text-blue-300 hover:text-white"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* Collapse / expand */}
      <div className="shrink-0 border-t border-white/10 p-3">
        <button
          type="button"
          onClick={toggle}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          aria-expanded={!collapsed}
          className={`flex w-full items-center gap-3 rounded-xl py-2.5 text-sm font-medium text-blue-200 transition-colors hover:bg-white/10 hover:text-white ${
            collapsed ? "justify-center px-0" : "px-3"
          }`}
        >
          <Icon>
            {collapsed ? (
              <>
                <path d="m6 17 5-5-5-5" />
                <path d="m13 17 5-5-5-5" />
              </>
            ) : (
              <>
                <path d="m11 17-5-5 5-5" />
                <path d="m18 17-5-5 5-5" />
              </>
            )}
          </Icon>

          {!collapsed && <span>Collapse</span>}
        </button>
      </div>
    </aside>
  );
}