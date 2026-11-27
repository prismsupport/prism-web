import { Icon } from "@/components/landing/Icon";
import { Chip } from "@/components/landing/Chip";

function WindowChrome({ label }) {
  return (
    <div className="flex items-center gap-1.5 border-b border-gray-200 bg-gray-50 px-4 py-2.5">
      <span className="h-2.5 w-2.5 rounded-full bg-gray-300" />
      <span className="h-2.5 w-2.5 rounded-full bg-gray-300" />
      <span className="h-2.5 w-2.5 rounded-full bg-gray-300" />
      <span className="ml-3 truncate rounded-md bg-white px-3 py-1 text-[11px] font-medium text-gray-400 ring-1 ring-gray-200">
        {label}
      </span>
    </div>
  );
}

const SIDEBAR = [
  { group: "Operations", items: [["grid", "Dashboard"], ["clipboard", "Dispatch"], ["chart", "Reports"]] },
  { group: "Communication", items: [["megaphone", "Advisories"], ["help", "FAQ"]] },
  { group: "Setup", items: [["building", "Service Areas"], ["receipt", "Billing Integration"], ["users", "Users"]] },
];

export function SupervisorShell({ active, url, children, className = "" }) {
  return (
    <div aria-hidden="true" className={`overflow-hidden rounded-xl border border-gray-200 bg-white shadow-2xl shadow-black/20 ring-1 ring-white/10 ${className}`}>
      <WindowChrome label={url} />
      <div className="flex">
        <div className="hidden w-36 shrink-0 bg-blue-950 pb-4 sm:block">
          <div className="border-b border-white/10 px-3.5 py-3">
            <p className="font-display text-xs font-extrabold leading-none text-white">PRISM</p>
            <p className="mt-1 text-[8px] font-bold tracking-wide text-blue-200">SUPERVISOR PORTAL</p>
          </div>
          <div className="space-y-2.5 px-2 pt-3">
            {SIDEBAR.map((g) => (
              <div key={g.group}>
                <p className="px-2 pb-1 text-[8px] font-semibold text-blue-300/70">{g.group}</p>
                {g.items.map(([icon, label]) => {
                  const on = label === active;
                  return (
                    <div
                      key={label}
                      className={`relative flex items-center gap-2 rounded-lg px-2 py-1.5 text-[10px] font-medium ${
                        on ? "bg-white/[0.18] text-white" : "text-blue-200"
                      }`}
                    >
                      {on && <span className="absolute -left-2 bottom-1.5 top-1.5 w-0.5 rounded-r-full bg-amber-400" />}
                      <Icon name={icon} className={`h-3 w-3 shrink-0 ${on ? "text-amber-300" : ""}`} />
                      <span className="truncate">{label}</span>
                      {label === "Dispatch" && (
                        <span className="ml-auto rounded-full bg-amber-400 px-1.5 text-[8px] font-bold leading-4 text-blue-950">4</span>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex h-9 items-center justify-end gap-2 border-b border-gray-200 bg-white px-3">
            <Icon name="bell" className="h-3.5 w-3.5 text-gray-400" />
            <span className="h-4 w-px bg-gray-200" />
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-100 text-[8px] font-bold text-blue-700">SV</span>
          </div>
          <div className="bg-gray-50 p-3 sm:p-4">{children}</div>
        </div>
      </div>
    </div>
  );
}

const PRIORITY_TONE = { Critical: "solid", High: "red", Medium: "amber", Low: "blue" };

const BOARD_ROWS = [
  { id: "MT-2026-01", master: "MASTER · 4", cat: "No Power / Total Power Interruption", pri: "Critical", loc: "Barangay A, Municipality A", status: ["Pending", "red"], who: "Unassigned", over: true },
  { id: "RPT-2026-003", cat: "Damaged Power Lines", pri: "High", loc: "Barangay B, Municipality A", status: ["Dispatched", "amber"], who: "Lineman A" },
  { id: "RPT-2026-002", cat: "Low Voltage / Weak Power Supply", pri: "Medium", loc: "Barangay C, Municipality A", status: ["In Progress", "orange"], who: "Lineman B" },
  { id: "RPT-2026-001", cat: "Sparks or Unusual Equipment Sounds", pri: "High", loc: "Barangay A, Municipality A", status: ["QA Review", "blue"], who: "Lineman C" },
];

export function DispatchBoard() {
  const cards = [
    ["Pending", "3", "text-red-600"],
    ["Dispatched", "2", "text-amber-600"],
    ["In Progress", "4", "text-green-600"],
    ["QA Review", "1", "text-blue-700"],
    ["Resolved", "12", "text-gray-900"],
  ];
  return (
    <div className="space-y-3">
      <div>
        <p className="font-display text-sm font-bold text-gray-900">Dispatch Management</p>
        <p className="text-[10px] text-gray-500">Real-time tickets monitoring and lineman coordination.</p>
      </div>

      <div className="flex items-center gap-2 rounded-lg border-2 border-red-500 bg-red-50 px-3 py-2">
        <span className="relative flex h-2.5 w-2.5 shrink-0">
          <span className="absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75 motion-safe:animate-ping" />
          <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-red-600" />
        </span>
        <p className="text-[10px] font-extrabold uppercase tracking-wide text-red-700">1 item needs your attention</p>
        <span className="ml-auto hidden items-center gap-1.5 rounded-md border border-gray-300 bg-white px-2 py-1 text-[10px] font-semibold text-gray-800 sm:flex">
          <span className="rounded bg-red-600 px-1 text-[10px] font-bold text-white">1</span>
          Response Time Exceeded
        </span>
      </div>

      <div className="grid grid-cols-5 gap-1.5">
        {cards.map(([label, value, color]) => (
          <div key={label} className="rounded-lg border border-gray-200 bg-white px-2 py-1.5">
            <p className="truncate text-[8px] font-bold uppercase tracking-wide text-gray-400">{label}</p>
            <p className={`font-display text-base font-extrabold leading-tight ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-1.5">
        <div className="flex min-w-0 flex-1 items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-[10px] text-gray-400">
          <Icon name="search" className="h-3 w-3 shrink-0" />
          <span className="truncate">Search ticket no., landmark, barangay…</span>
        </div>
        <span className="hidden rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-[10px] font-semibold text-gray-700 sm:block">Filters</span>
        <span className="hidden rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-[10px] font-semibold text-gray-700 sm:block">Settings</span>
        <span className="whitespace-nowrap rounded-lg bg-blue-700 px-2.5 py-1.5 text-[10px] font-semibold text-white">+ Create Master Ticket</span>
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white text-[10px]">
        <div className="grid grid-cols-[1.4fr_.8fr_1fr] gap-2 border-b border-gray-200 bg-gray-50 px-3 py-1.5 text-[8px] font-semibold uppercase tracking-wide text-gray-500 sm:grid-cols-6 sm:gap-3">
          <span>Ticket ID</span>
          <span className="hidden sm:block">Category</span>
          <span>Priority</span>
          <span className="hidden sm:block">Location</span>
          <span>Status</span>
          <span className="hidden sm:block">Assignee</span>
        </div>
        {BOARD_ROWS.map((r) => (
          <div
            key={r.id}
            className="grid grid-cols-[1.4fr_.8fr_1fr] items-center gap-2 border-b border-gray-100 px-3 py-2 last:border-0 sm:grid-cols-6 sm:gap-3"
          >
            <div className="min-w-0">
              <p className="truncate font-semibold text-gray-900">
                {r.id}
                {r.master && (
                  <span className="ml-1.5 rounded bg-blue-50 px-1 py-0.5 text-[8px] font-bold text-blue-700">{r.master}</span>
                )}
              </p>
              {r.over && <p className="text-[9px] font-medium text-red-600">Response Time Exceeded</p>}
            </div>
            <p className="hidden truncate text-gray-700 sm:block">{r.cat}</p>
            <div>
              <Chip tone={PRIORITY_TONE[r.pri]} className="!px-1.5 !text-[9px]">{r.pri}</Chip>
            </div>
            <p className="hidden truncate text-gray-900 sm:block">{r.loc}</p>
            <div>
              <Chip tone={r.status[1]} dot className="!px-1.5 !text-[9px]">{r.status[0]}</Chip>
            </div>
            <p className="hidden text-gray-700 sm:block">{r.who}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export function DashboardBody({ attention = true }) {
  const att = [
    ["Pending tickets", "3", "text-red-600"],
    ["Overdue tickets", "1", "text-red-600"],
    ["QA reviews waiting", "1", "text-blue-700"],
    ["Reopen requests", "0", "text-gray-300"],
    ["Unanswered FAQs", "2", "text-amber-600"],
  ];
  const metrics = [
    ["Total outage reports", "46"],
    ["Reports resolved", "38"],
    ["Unresolved tickets", "8"],
    ["Resolved within target", "82%"],
  ];
  const trend = [6, 11, 8, 14, 7];
  const labels = ["Week 1", "Week 2", "Week 3", "Week 4", "Week 5"];
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="font-display text-sm font-bold text-gray-900">Service Analytics Dashboard</p>
        <span className="rounded-md bg-white px-2 py-1 text-[9px] font-semibold text-gray-900 shadow-sm ring-1 ring-gray-200">Last 30 days</span>
      </div>

      {attention && (
        <div>
          <p className="mb-1.5 text-[10px] font-bold text-gray-900">Needs Attention</p>
          <div className="grid grid-cols-3 gap-1.5 sm:grid-cols-5">
            {att.map(([label, value, color]) => (
              <div key={label} className="rounded-lg border border-gray-200 bg-white p-2">
                <p className="truncate text-[8px] font-bold uppercase tracking-wide text-gray-400">{label}</p>
                <p className={`font-display text-lg font-extrabold leading-tight ${color}`}>{value}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="inline-flex rounded-lg bg-gray-100 p-0.5 text-[9px] font-semibold text-gray-500">
        {["Overview", "Insights", "Performance"].map((l, i) => (
          <span key={l} className={`rounded-md px-2.5 py-1 ${i === 0 ? "bg-white text-gray-900 shadow-sm" : ""}`}>{l}</span>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-4">
        {metrics.map(([label, value]) => (
          <div key={label} className="rounded-xl border border-gray-200 bg-white p-2.5">
            <p className="truncate text-[8px] font-bold uppercase tracking-wide text-gray-400">{label}</p>
            <p className="font-display mt-1 text-xl font-extrabold tabular-nums text-gray-900">{value}</p>
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-3">
        <p className="text-[10px] font-bold text-gray-900">Report Trend</p>
        <p className="mb-2 text-[9px] text-gray-400">Reports per period</p>
        <div className="flex h-20 items-end gap-3">
          {trend.map((n, i) => (
            <div key={labels[i]} className="flex h-full flex-1 flex-col items-center justify-end">
              <span className="mb-0.5 text-[9px] font-semibold text-gray-700">{n}</span>
              <div className={`w-full rounded-t-md ${n === 14 ? "bg-blue-700" : "bg-blue-200"}`} style={{ height: `${(n / 14) * 70}%` }} />
            </div>
          ))}
        </div>
        <div className="mt-1.5 flex gap-3">
          {labels.map((l) => (<span key={l} className="flex-1 text-center text-[8px] text-gray-400">{l}</span>))}
        </div>
      </div>
    </div>
  );
}

export function RecommendPanel() {
  const rows = [
    { name: "Lineman A", badges: [["BEST MATCH", "blue"], ["COVERS THIS AREA", "green"]], score: 94, km: "1.0", eta: 2, jobs: 1, parts: "Availability 100 · Office 100 · Proximity 80 · Workload 80", state: "On duty", best: true },
    { name: "Lineman B", badges: [["CLOSEST", "purple"], ["AVAILABLE NOW", "green"]], score: 68, km: "0.5", eta: 1, jobs: 0, parts: "Availability 100 · Office 0 · Proximity 90 · Workload 100", state: "Available" },
    { name: "Lineman C", badges: [["OFF SCHEDULE", "gray"]], score: 54, km: "1.5", eta: 3, jobs: 0, parts: "Availability 0 · Office 100 · Proximity 70 · Workload 100", state: "Off schedule", muted: true },
  ];
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <p className="font-display text-sm font-bold text-gray-900">Smart Dispatch Recommendation</p>
      <p className="mb-1 mt-3 text-[10px] font-medium text-gray-700">Incident Priority</p>
      <div className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-[11px] text-gray-800">High</div>
      <p className="mt-3 rounded-lg bg-blue-50 p-2.5 text-[11px] leading-relaxed text-blue-800">
        Match % = 40% availability (on duty and reporting) + 30% assigned office + 20% proximity + 10% workload. This is a decision-support tool; the final choice is yours.
      </p>
      <p className="mb-2 mt-4 text-[10px] font-bold uppercase text-gray-500">Lineman Recommendations</p>
      <div className="space-y-2">
        {rows.map((r) => (
          <div key={r.name} className={`rounded-lg border-2 p-3 ${r.best ? "border-blue-600" : "border-gray-200"} ${r.muted ? "bg-gray-50" : ""}`}>
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-100 text-[10px] font-bold text-blue-700">
                  {r.name.slice(-1)}
                </span>
                <div>
                  <p className="text-xs font-semibold text-gray-900">{r.name}</p>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {r.badges.map(([t, tone]) => (
                      <span key={t} className={`rounded px-1.5 py-0.5 text-[8px] font-bold ${
                        tone === "blue" ? "bg-blue-100 text-blue-700" : tone === "green" ? "bg-green-100 text-green-700" : tone === "purple" ? "bg-purple-100 text-purple-700" : "bg-gray-200 text-gray-600"
                      }`}>{t}</span>
                    ))}
                  </div>
                </div>
              </div>
              <span className={`font-display text-lg font-bold ${r.muted ? "text-gray-400" : "text-blue-700"}`}>{r.score}%</span>
            </div>
            <div className="mt-2 flex items-center justify-between text-[10px] text-gray-500">
              <span>{r.km} km away · ETA {r.eta} mins</span>
              <span>{r.jobs} active {r.jobs === 1 ? "task" : "tasks"} · {r.state}</span>
            </div>
            <p className="mt-1.5 text-[9px] text-gray-400">{r.parts}</p>
          </div>
        ))}
      </div>
      <div className="mt-3 rounded-lg bg-blue-700 py-2.5 text-center text-[11px] font-semibold text-white">Assign Selected Lineman</div>
    </div>
  );
}

/* Cluster map: reports of one suspected outage, pins coloured by priority */
function ClusterMap() {
  const pins = [
    { x: 168, y: 118, c: "#DC2626", anchor: true },
    { x: 214, y: 146, c: "#F87171" },
    { x: 150, y: 168, c: "#F59E0B" },
    { x: 204, y: 100, c: "#F87171" },
  ];
  return (
    <div className="relative">
      <svg viewBox="0 0 400 260" className="block h-auto w-full" aria-hidden="true" focusable="false">
        <rect width="400" height="260" fill="#EAF1FB" />
        <g stroke="#D5E2F4" strokeWidth="1">
          {[50, 100, 150, 200].map((y) => (<line key={y} x1="0" x2="400" y1={y} y2={y} />))}
          {[50, 100, 150, 200, 250, 300, 350].map((x) => (<line key={x} y1="0" y2="260" x1={x} x2={x} />))}
        </g>
        <g fill="none" stroke="#fff" strokeLinecap="round">
          <path d="M-10 190 C 70 180 120 120 210 126 S 340 90 410 70" strokeWidth="13" />
          <path d="M130 -10 C 140 80 190 150 170 270" strokeWidth="10" />
          <path d="M-10 70 C 60 80 110 50 170 36" strokeWidth="8" />
          <path d="M270 -10 C 262 70 300 130 330 270" strokeWidth="8" />
        </g>
        <circle cx="184" cy="134" r="66" fill="#EF4444" fillOpacity="0.07" stroke="#EF4444" strokeOpacity="0.45" strokeDasharray="5 5" />
        {pins.map((p) => (
          <g key={`${p.x}-${p.y}`}>
            {p.anchor && (
              <circle
                className="origin-center [transform-box:fill-box] motion-safe:animate-ping"
                cx={p.x}
                cy={p.y - 18}
                r="14"
                fill="#EF4444"
                fillOpacity="0.35"
              />
            )}
            <g transform={`translate(${p.x - 10.5} ${p.y - 28.7}) scale(0.7)`}>
              <path d="M15 41C15 41 2 25.5 2 15a13 13 0 0 1 26 0c0 10.5-13 26-13 26z" fill={p.c} stroke="#fff" strokeWidth="2" />
              <circle cx="15" cy="15" r="5" fill="#fff" />
            </g>
          </g>
        ))}
      </svg>
      <div className="absolute left-[46%] top-[5%] rounded-lg bg-white px-2 py-1 text-[9px] shadow-md ring-1 ring-gray-200">
        <p className="font-bold text-gray-900">Consumer A — RPT-2026-001</p>
        <p className="text-gray-500">Priority: Critical</p>
      </div>
      <div className="absolute bottom-2 left-2 flex items-center gap-2.5 rounded-lg bg-white/95 px-2 py-1 text-[8px] font-medium text-gray-700 shadow">
        {[["Highest priority", "#DC2626"], ["Lowest priority", "#2563EB"], ["Not set", "#9CA3AF"]].map(([t, c]) => (
          <span key={t} className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: c }} />
            {t}
          </span>
        ))}
      </div>
    </div>
  );
}

export function DuplicateReview() {
  const factors = [
    "Same Feeder (Feeder A)",
    "Within 120m",
    "3 nearby reports",
    "Filed 12 minutes apart",
    "Consumer confirmed nearby homes affected",
  ];
  const members = [
    ["Consumer A", "RPT-2026-001", null, true],
    ["Consumer B", "RPT-2026-002", "96% match vs anchor"],
    ["Consumer C", "RPT-2026-003", "91% match vs anchor"],
  ];
  return (
    <SupervisorShell active="Dispatch" url="Supervisor portal · Dispatch · Possible Duplicates">
      <div className="grid gap-3 md:grid-cols-[1.05fr_1fr]">
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
          <ClusterMap />
        </div>

        <div className="space-y-3">
          <div className="rounded-xl border border-gray-200 bg-white p-3">
            <div className="flex items-start justify-between gap-2">
              <p className="font-display text-xs font-bold text-gray-900">Smart Master Ticket Suggestion</p>
              <span className="shrink-0 rounded bg-green-50 px-1.5 py-1 text-[8px] font-bold uppercase text-green-700">Highly Likely Duplicate</span>
            </div>
            <p className="mt-1 text-[10px] text-gray-500">
              Area A · Overall Confidence: <span className="font-semibold text-green-600">92%</span>
            </p>
            <p className="mt-2 rounded-lg bg-blue-50 px-2.5 py-2 text-[9px] leading-relaxed text-blue-700">
              The system recommends grouping these reports into one Master Ticket.
            </p>
            <div className="mt-2.5 space-y-1 border-t border-gray-100 pt-2.5">
              <p className="text-[8px] font-bold uppercase text-gray-400">Match Breakdown</p>
              {factors.map((f) => (
                <p key={f} className="flex items-center gap-2 text-[9px] text-gray-700">
                  <span className="text-green-600">✓</span>
                  {f}
                </p>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-3">
            <div className="mb-2 flex items-center justify-between">
              <p className="text-[10px] font-bold text-gray-900">Reports in this Cluster</p>
              <span className="rounded bg-blue-50 px-1.5 py-0.5 text-[8px] font-bold text-blue-700">TOTAL: 4</span>
            </div>
            <div className="space-y-1.5">
              {members.map(([name, id, score, anchor]) => (
                <div key={id} className={`flex items-start gap-2 rounded-lg border px-2 py-1.5 ${anchor ? "border-blue-300" : "border-gray-200"}`}>
                  {!anchor && <span className="mt-0.5 flex h-3 w-3 shrink-0 items-center justify-center rounded border border-blue-600 bg-blue-600 text-white"><Icon name="tick" className="h-2 w-2" /></span>}
                  <div className="min-w-0">
                    <p className="text-[10px] font-semibold text-gray-900">
                      {name}
                      {anchor && <span className="ml-1.5 rounded bg-blue-50 px-1 py-0.5 text-[8px] font-bold text-blue-700">ANCHOR</span>}
                    </p>
                    <p className="text-[8px] text-gray-400">{id}{score ? ` · ${score}` : ""}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 text-center text-[10px] font-semibold">
            <span className="rounded-lg bg-gray-100 py-2 text-gray-700">Not a Duplicate</span>
            <span className="rounded-lg bg-blue-700 py-2 text-white">Merge 4 Selected</span>
          </div>
        </div>
      </div>
    </SupervisorShell>
  );
}

export function AlertsMock() {
  return (
    <div className="overflow-hidden rounded-xl border-2 border-red-500 bg-red-50">
      <div className="flex items-center gap-2 p-3">
        <span className="relative flex h-2.5 w-2.5 shrink-0">
          <span className="absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75 motion-safe:animate-ping" />
          <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-red-600" />
        </span>
        <p className="text-[10px] font-extrabold uppercase tracking-wide text-red-700">1 item needs your attention</p>
      </div>
      <div className="border-t-2 border-red-500 bg-white p-3">
        <div className="flex items-center justify-between gap-3">
          <p className="text-[10px] text-gray-800">
            <span className="font-medium">Ticket</span> unassigned for{" "}
            <span className="font-semibold text-red-600">42 min</span> (threshold: 30 min)
          </p>
          <span className="shrink-0 rounded-lg bg-blue-700 px-2.5 py-1.5 text-[10px] font-semibold text-white">Review Now</span>
        </div>
      </div>
    </div>
  );
}

export function QAPanel() {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <p className="text-xs font-bold text-gray-900">Quality Assurance Review</p>
      <div className="mt-3 grid grid-cols-2 gap-2 rounded-lg bg-gray-50 p-2.5 text-[10px]">
        <div>
          <p className="text-[9px] text-gray-400">Category</p>
          <p className="text-[12px] text-gray-900">Damaged Power Lines</p>
        </div>
        <div>
          <p className="mb-0.5 text-[9px] text-gray-400">Consumer evidence location</p>
          <Chip tone="green">Location Consistent</Chip>
        </div>
      </div>
      <div className="mt-3 space-y-2.5 text-[10px]">
        <div>
          <p className="mb-1 text-[9px] text-gray-400">Proof of Completion Photo</p>
          <div className="flex h-18 items-center justify-center rounded-lg border border-gray-200 bg-gray-100 text-gray-400">
            <Icon name="image" className="h-5 w-5" />
          </div>
        </div>
        <div>
          <p className="text-[9px] text-gray-400">Repair Note</p>
          <p className="mt-1 rounded-lg bg-gray-50 p-2 text-gray-700">
            Completion checklist: cleared the fault, restored supply to the feeder.
          </p>
        </div>
        <div>
          <p className="mb-1 text-[9px] text-gray-400">Voice Record</p>
          <div className="flex items-center gap-2 rounded-full bg-gray-100 px-2.5 py-1.5 text-gray-500">
            <Icon name="play" className="h-3 w-3" />
            <span className="h-1 flex-1 rounded-full bg-gray-300" />
            <span className="text-[9px]">0:12</span>
          </div>
        </div>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2 text-center text-[10px] font-semibold">
        <span className="rounded-lg bg-green-600 py-2 text-white">Approve and Close Ticket</span>
        <span className="rounded-lg border border-red-200 bg-red-50 py-2 text-red-700">Reject</span>
      </div>
    </div>
  );
}

export function AdvisoryPanel() {
  const field = (label, value) => (
    <div>
      <p className="mb-1 text-[9px] font-medium text-gray-700">{label}</p>
      <div className="rounded-lg border border-gray-200 bg-gray-50 px-2.5 py-1.5 text-[10px] text-gray-700">{value}</div>
    </div>
  );
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <p className="text-[13px] font-bold text-gray-900">Create New Advisory</p>
      <div className="mt-3 space-y-2.5">
        <div>
          <p className="mb-1 text-[9px] font-medium text-gray-700">Category</p>
          <div className="flex flex-wrap gap-1">
            {["Power Interruption", "Power Rates", "Collection & Payment", "Programs & Activities", "General Announcement"].map((c, i) => (
              <span
                key={c}
                className={`rounded-full px-2 py-0.5 text-[9px] font-semibold ring-1 ring-inset ${
                  i === 0 ? "bg-amber-50 text-amber-700 ring-amber-200" : "bg-gray-100 text-gray-600 ring-gray-200"
                }`}
              >
                {c}
              </span>
            ))}
          </div>
        </div>
        {field("Advisory Title", "Scheduled power interruption")}
        <div className="grid grid-cols-3 gap-2">
          {field("Date", "Select date")}
          {field("Start Time", "08:00")}
          {field("End Time", "12:00")}
        </div>
        <div className="border-t border-gray-100 pt-2.5">
          <p className="mb-1.5 text-[10px] font-semibold text-gray-900">Target Scope</p>
          <div className="grid grid-cols-[1fr_1.6fr] gap-2">
            <div className="rounded-lg border border-gray-200 bg-gray-50 px-2.5 py-1.5 text-[10px] text-gray-700">Barangay</div>
            <div className="rounded-lg border border-gray-200 bg-gray-50 px-2.5 py-1.5 text-[10px] text-gray-700">Barangay A (Municipality A)</div>
          </div>
          <p className="mt-1.5 text-[11px] font-medium text-blue-700">+ Add Another Scope</p>
        </div>
      </div>
      <div className="mt-3 rounded-lg bg-blue-700 py-2 text-center text-[12px] font-semibold text-white">Publish Advisory</div>
    </div>
  );
}

/* Reports page with the Export menu open, plus the two files it produces */
export function ExportVisual() {
  const metrics = [
    ["Total outage reports", "46"],
    ["Reports resolved", "38"],
    ["Avg. response time", "24 mins"],
    ["Avg. resolution time", "1hr 12m"],
  ];
  const rows = [
    ["No Power / Total Power Interruption", 18, 39],
    ["Damaged Power Lines", 12, 26],
    ["Low Voltage / Weak Power Supply", 9, 20],
    ["Partial Power Interruption", 7, 15],
  ];
  const sheets = ["Summary", "Outage Frequency", "Issue Categories", "Affected Locations", "Tickets"];
  return (
    <div className="space-y-4">
      <SupervisorShell active="Reports" url="Supervisor portal · Reports">
        <div className="space-y-3">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="font-display text-sm font-bold text-gray-900">Reports</p>
              <p className="max-w-[18rem] text-[9px] text-gray-500">
                Outage frequency, issue categories, locations, response and resolution times, recurring incidents, and lineman performance.
              </p>
            </div>
            <div className="relative shrink-0">
              <span className="inline-flex items-center gap-1 rounded-lg border-2 border-blue-600 bg-white px-2.5 py-1.5 text-[10px] font-semibold text-blue-700">
                Export ▾
              </span>
              <div className="absolute right-0 top-full z-10 mt-1 w-36 overflow-hidden rounded-lg border border-gray-200 bg-white text-[10px] shadow-lg">
                <p className="bg-blue-50 px-3 py-2 font-semibold text-blue-700">Excel (.xlsx)</p>
                <p className="px-3 py-2 text-gray-700">PDF (.pdf)</p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-[9px]">
            <div className="inline-flex rounded-lg bg-gray-100 p-0.5 font-semibold text-gray-500">
              {["Last 7 days", "Last 30 days", "Last 90 days", "All time", "Custom"].map((l, i) => (
                <span key={l} className={`rounded-md px-2 py-1 ${i === 1 ? "bg-white text-gray-900 shadow-sm" : ""}`}>{l}</span>
              ))}
            </div>
            <span className="text-gray-500">☐ Compare with previous period</span>
          </div>

          <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-4">
            {metrics.map(([label, value]) => (
              <div key={label} className="rounded-xl border border-gray-200 bg-white p-2.5">
                <p className="truncate text-[8px] font-bold uppercase tracking-wide text-gray-400">{label}</p>
                <p className="font-display mt-1 text-lg font-extrabold tabular-nums text-gray-900">{value}</p>
              </div>
            ))}
          </div>

          <div className="inline-flex rounded-lg bg-gray-100 p-0.5 text-[9px] font-semibold text-gray-500">
            {["Overview", "Locations", "Response & Resolution", "Lineman Performance"].map((l, i) => (
              <span key={l} className={`rounded-md px-2 py-1 ${i === 0 ? "bg-white text-gray-900 shadow-sm" : ""}`}>{l}</span>
            ))}
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-3">
            <p className="text-[10px] font-bold text-gray-900">Outage Frequency</p>
            <div className="mt-2 flex h-16 items-end gap-2">
              {[30, 55, 40, 80, 50, 95, 60, 70].map((h, i) => (
                <span key={i} className={`flex-1 rounded-t ${i === 5 ? "bg-blue-700" : "bg-blue-200"}`} style={{ height: `${h}%` }} />
              ))}
            </div>
          </div>
        </div>
      </SupervisorShell>

    </div>
  );
}