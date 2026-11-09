"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { usePermissions } from "@/lib/supervisor/PermissionsContext";
import { BILLING_CHANGED_EVENT } from "@/components/billing/BillingIntegrationForm";
import SidebarCooperative from "@/components/navigation/SidebarCooperative";
import Logo from "@/components/ui/Logo";
import PrivacyPolicyModal from "@/components/ui/PrivacyPolicyModal";
import TermsModal from "@/components/ui/TermsModal";
import useNavCounts from "@/lib/supervisor/useNavCounts";
import supervisorNavItems from "./supervisorNavItems";

const STORAGE_KEY = "prism.sidebar.collapsed";
const SUPPORT_EMAIL = "prismsupport01@gmail.com";

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
  reports: (
    <>
      <path d="M3 3v18h18" />
      <path d="M7 16v-5" />
      <path d="M12 16V7" />
      <path d="M17 16v-3" />
    </>
  ),
  advisories: (
    <>
      <path d="m3 11 18-5v12L3 14v-3z" />
      <path d="M11.6 16.8a3 3 0 1 1-5.8-1.6" />
    </>
  ),
  "service-areas": (
    <>
      <path d="M3 21h18" />
      <path d="M5 21V5l7-3 7 3v16" />
      <path d="M9 9h1" />
      <path d="M14 9h1" />
      <path d="M9 13h1" />
      <path d="M14 13h1" />
      <path d="M9 21v-4h6v4" />
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

// Groups the flat nav list, keeping the order items were written in.
function groupItems(items) {
  const groups = [];
  items.forEach((item) => {
    const name = item.group || "";
    let group = groups.find((g) => g.name === name);
    if (!group) {
      group = { name, items: [] };
      groups.push(group);
    }
    group.items.push(item);
  });
  return groups;
}

const NAV_GROUPS = groupItems(supervisorNavItems);

// Billing health for the Owner: a dot on Billing Integration when the connection
// is not set up, failed its last test, or has not been verified.
// Returns null when everything is fine (or the user is not the Owner).
function useBillingHealth(enabled, pathname) {
  const [health, setHealth] = useState(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/supervisor/billing/config", { cache: "no-store" });
      if (!res.ok) return;
      const body = await res.json();

      if (!body.setupComplete) {
        setHealth({ level: "error", text: "Billing is not connected" });
      } else if (body.lastTestStatus === "failed") {
        setHealth({ level: "error", text: "The last billing connection test failed" });
      } else if (body.lastTestStatus !== "connected") {
        setHealth({ level: "warn", text: "Billing connection has not been verified" });
      } else {
        setHealth(null);
      }
    } catch {
      // A failed check never affects navigation.
    }
  }, []);

  useEffect(() => {
    if (enabled) load();
  }, [enabled, pathname, load]);

  useEffect(() => {
    if (!enabled) return;
    window.addEventListener(BILLING_CHANGED_EVENT, load);
    return () => window.removeEventListener(BILLING_CHANGED_EVENT, load);
  }, [enabled, load]);

  return enabled ? health : null;
}

export default function SupervisorSidebar() {
  const pathname = usePathname();
  const { loading, canAccessPath, isOwner } = usePermissions();
  const counts = useNavCounts();
  const billingHealth = useBillingHealth(!loading && isOwner, pathname);

  const [collapsed, setCollapsed] = useState(false);
  const [lockedMessage, setLockedMessage] = useState("");
  const [helpOpen, setHelpOpen] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [showTerms, setShowTerms] = useState(false);

  // Restore the saved sidebar state.
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved !== null) {
      setCollapsed(saved === "1");
    } else if (window.innerWidth < 1024) {
      setCollapsed(true);
    }
  }, []);

  const compact = collapsed;

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
    compact ? "justify-center px-0" : "px-3"
  }`;

  return (
    <>
      <aside
        className={`relative z-40 flex h-screen shrink-0 flex-col bg-blue-950 transition-[width] duration-200 ${
          compact ? "w-[76px]" : "w-64"
        }`}
      >
        {/* Logo */}
        <div
          className={`flex h-16 shrink-0 items-center border-b border-white/10 ${
            compact ? "justify-center" : "px-5"
          }`}
        >
          <Logo onDark compact={compact} subtitle="SUPERVISOR PORTAL" />
        </div>

        {/* Navigation */}
        <nav
          aria-label="Supervisor navigation"
          className="flex-1 overflow-y-auto px-3 py-3"
        >
          {NAV_GROUPS.map((group, groupIndex) => (
            <div
              key={group.name || groupIndex}
              role="group"
              aria-label={group.name || undefined}
              className={groupIndex > 0 ? "mt-3" : ""}
            >
              {/* Heading when expanded, a thin divider when collapsed */}
              {group.name &&
                (compact ? (
                  groupIndex > 0 && <div className="mx-3 mb-3 border-t border-white/10" />
                ) : (
                  <p className="px-3 pb-1.5 pt-2 text-xs font-semibold text-blue-300/70">
                    {group.name}
                  </p>
                ))}

              <div className="space-y-1">
                {group.items.map((item) => {
                  const isActive =
                    pathname === item.href ||
                    pathname.startsWith(`${item.href}/`);

                  // Avoid showing locked states before permissions are loaded.
                  const locked = !loading && !canAccessPath(item.href);
                  const count = counts[item.href] || 0;
                  const health = item.href === "/supervisor/billing" ? billingHealth : null;

                  // Locked items are buttons, not links.
                  // Clicking them displays a restriction message.
                  if (locked) {
                    return (
                      <button
                        key={item.href}
                        type="button"
                        onClick={() => handleLockedClick(item.label)}
                        title={
                          compact
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

                        {!compact && (
                          <>
                            <span className="truncate">{item.label}</span>
                            <LockIcon className="ml-auto h-3.5 w-3.5 shrink-0" />
                          </>
                        )}

                        {compact && (
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
                      title={health ? health.text : undefined}
                      className={`group ${itemBase} transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 ${
                        isActive
                          ? "bg-white/[0.18] text-white shadow-sm ring-1 ring-inset ring-white/10"
                          : "text-blue-200 hover:bg-white/10 hover:text-white"
                      }`}
                    >
                      {/* Accent bar sits inside the pill so it reads as part of it */}
                      {isActive && (
                        <span
                          aria-hidden="true"
                          className="absolute bottom-2.5 -left-3 top-2.5 w-1 rounded-r-full bg-amber-400"
                        />
                      )}

                      <Icon
                        className={`h-5 w-5 transition-colors ${
                          isActive ? "text-amber-300" : ""
                        }`}
                      >
                        {iconFor(item.href)}
                      </Icon>

                      {!compact && (
                        <span className="truncate">{item.label}</span>
                      )}

                      {count > 0 &&
                        (compact ? (
                          <span className="absolute right-1.5 top-1 min-w-[18px] rounded-full bg-amber-400 px-1 text-center text-[10px] font-bold leading-[18px] text-blue-950">
                            {count > 99 ? "99+" : count}
                          </span>
                        ) : (
                          <span className="ml-auto rounded-full bg-amber-400 px-2 py-0.5 text-[11px] font-bold leading-none text-blue-950">
                            {count > 99 ? "99+" : count}
                          </span>
                        ))}

                      {health && (
                        <span
                          className={`h-2.5 w-2.5 shrink-0 rounded-full ring-2 ring-blue-950 ${
                            health.level === "error" ? "bg-red-500" : "bg-amber-400"
                          } ${compact ? "absolute right-2 top-2" : "ml-auto"}`}
                        >
                          <span className="sr-only">{health.text}</span>
                        </span>
                      )}

                      {compact && (
                        <span className="pointer-events-none absolute left-full z-50 ml-3 whitespace-nowrap rounded-md bg-gray-900 px-2.5 py-1.5 text-xs font-medium text-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100">
                          {item.label}
                          {count > 0 ? ` (${count})` : ""}
                          {health ? ` — ${health.text}` : ""}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
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

        <SidebarCooperative collapsed={compact} />

        {/* Help + collapse / expand */}
        <div className="shrink-0 space-y-1 border-t border-white/10 p-3">
          <div className="relative">
            {helpOpen && (
              <>
                <button
                  type="button"
                  aria-label="Close help menu"
                  className="fixed inset-0 z-10 cursor-default"
                  onClick={() => setHelpOpen(false)}
                />
                <div
                  role="menu"
                  className={`absolute z-20 w-60 overflow-hidden rounded-xl border border-white/10 bg-blue-900 shadow-xl ${
                    compact ? "bottom-0 left-full ml-3" : "bottom-full left-0 mb-2"
                  }`}
                >
                  <a
                    role="menuitem"
                    href={`mailto:${SUPPORT_EMAIL}`}
                    className="block border-b border-white/10 px-4 py-3 text-sm text-blue-100 hover:bg-white/10"
                  >
                    <span className="block font-semibold text-white">Contact support</span>
                    <span className="block truncate text-xs text-blue-300">{SUPPORT_EMAIL}</span>
                  </a>
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      setHelpOpen(false);
                      setShowPrivacy(true);
                    }}
                    className="block w-full px-4 py-2.5 text-left text-sm text-blue-100 hover:bg-white/10"
                  >
                    Privacy Policy
                  </button>
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      setHelpOpen(false);
                      setShowTerms(true);
                    }}
                    className="block w-full px-4 py-2.5 text-left text-sm text-blue-100 hover:bg-white/10"
                  >
                    Terms and Conditions
                  </button>
                </div>
              </>
            )}

            <button
              type="button"
              onClick={() => setHelpOpen(!helpOpen)}
              aria-haspopup="menu"
              aria-expanded={helpOpen}
              title={compact ? "Help & support" : undefined}
              className={`flex w-full items-center gap-3 rounded-xl py-2.5 text-sm font-medium text-blue-200 transition-colors hover:bg-white/10 hover:text-white ${
                compact ? "justify-center px-0" : "px-3"
              }`}
            >
              <Icon>
                <circle cx="12" cy="12" r="10" />
                <circle cx="12" cy="12" r="4" />
                <path d="m4.93 4.93 4.24 4.24" />
                <path d="m14.83 9.17 4.24-4.24" />
                <path d="m14.83 14.83 4.24 4.24" />
                <path d="m9.17 14.83-4.24 4.24" />
              </Icon>
              {!compact && <span>Help &amp; support</span>}
            </button>
          </div>

          <button
            type="button"
            onClick={toggle}
            aria-label={compact ? "Expand sidebar" : "Collapse sidebar"}
            aria-expanded={!compact}
            className={`flex w-full items-center gap-3 rounded-xl py-2.5 text-sm font-medium text-blue-200 transition-colors hover:bg-white/10 hover:text-white ${
              compact ? "justify-center px-0" : "px-3"
            }`}
          >
            <Icon>
              {compact ? (
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

            {!compact && <span>Collapse</span>}
          </button>
        </div>
      </aside>

      {/* Rendered outside the aside: its transform would otherwise trap fixed modals */}
      {showPrivacy && <PrivacyPolicyModal onClose={() => setShowPrivacy(false)} />}
      {showTerms && (
        <TermsModal onClose={() => setShowTerms(false)} onAccept={() => setShowTerms(false)} />
      )}
    </>
  );
}