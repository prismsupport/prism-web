import { Icon } from "@/components/landing/Icon";

function MapArt({ route = true, className = "" }) {
  return (
    <svg viewBox="0 0 400 200" preserveAspectRatio="xMidYMid slice" className={className} aria-hidden="true" focusable="false">
      <rect width="400" height="200" fill="#EAF1FB" />
      <g stroke="#D5E2F4" strokeWidth="1">
        {[40, 80, 120, 160].map((y) => (<line key={y} x1="0" x2="400" y1={y} y2={y} />))}
        {[50, 100, 150, 200, 250, 300, 350].map((x) => (<line key={x} y1="0" y2="200" x1={x} x2={x} />))}
      </g>
      <g fill="none" stroke="#fff" strokeLinecap="round">
        <path d="M-10 150 C 70 140 110 90 200 95 S 330 60 410 40" strokeWidth="12" />
        <path d="M120 -10 C 130 60 170 110 160 210" strokeWidth="9" />
        <path d="M-10 60 C 60 70 100 40 150 30" strokeWidth="7" />
      </g>
      
      {route && (
        <>
          {/* Blue navigation route follows the main white road */}
          <path
            d="M-10 150 C70 140 110 90 200 95 S330 60 410 40"
            fill="none"
            stroke="#2563EB"
            strokeWidth="3.5"
            strokeLinecap="round"
            strokeDasharray="7 6"
          />

          {/* Starting point */}
          <circle
            cx="70"
            cy="124"
            r="9"
            fill="#2563EB"
            stroke="#fff"
            strokeWidth="3"
          />
        </>
      )}

      {/* Blinking destination marker placed on the road */}
      <circle
        className="origin-center [transform-box:fill-box] motion-safe:animate-ping"
        cx="290"
        cy="80"
        r="12"
        fill="#EF4444"
        fillOpacity="0.35"
      />
      <circle
        cx="290"
        cy="80"
        r="8"
        fill="#EF4444"
        stroke="#fff"
        strokeWidth="3"
      />
    </svg>
  );
}

function Phone({ children, width = "w-52", className = "" }) {
  return (
    <div aria-hidden="true" className={`mx-auto ${width} rounded-[1.75rem] border-[5px] border-gray-900 bg-gray-900 shadow-xl ${className}`}>
      <div className="overflow-hidden rounded-[1.3rem] bg-gray-50">
        <div className="mx-auto mt-2 h-1.5 w-12 rounded-full bg-gray-200" />
        {children}
      </div>
    </div>
  );
}

function AppHeader({ role, badge, right }) {
  return (
    <div className="flex items-center justify-between border-b border-gray-200 px-3 py-2">
      <div className="flex items-center gap-1.5">
        <span className="font-display text-[11px] font-extrabold tracking-tight text-blue-700">PRISM</span>
        {role && <span className="text-[10px] font-semibold text-blue-600">{role}</span>}
      </div>
      {right || (
        <span className="relative text-gray-800">
          <Icon name="bell" className="h-3.5 w-3.5" />
          {badge && (
            <span className="absolute -right-1.5 -top-1.5 flex h-3 min-w-3 items-center justify-center rounded-full bg-red-600 px-0.5 text-[7px] font-bold text-white">
              {badge}
            </span>
          )}
        </span>
      )}
    </div>
  );
}

function ScreenTitle({ kicker, title }) {
  return (
    <div className="flex items-center justify-between border-b border-gray-200 px-3 py-2">
      <Icon name="arrowLeft" className="h-3.5 w-3.5 text-blue-700" />
      <div className="text-center">
        <p className="text-[7px] font-semibold tracking-[0.15em] text-gray-500">{kicker}</p>
        <p className="font-display text-[11px] font-bold text-blue-700">{title}</p>
      </div>
      <span className="relative text-gray-800">
        <Icon name="bell" className="h-3.5 w-3.5" />
      </span>
    </div>
  );
}

function TabBar({ items, active }) {
  return (
    <div className="flex items-end border-t border-gray-100 bg-white px-1 pb-2">
      {items.map(([icon, label]) => {
        const on = label === active;
        return (
          <div key={label} className={`flex flex-1 flex-col items-center gap-0.5 text-[8px] font-medium ${on ? "text-blue-700" : "text-gray-500"}`}>
            {on ? (
              <span className="-mt-4 flex h-7 w-7 items-center justify-center rounded-full bg-blue-600 text-white shadow-md ring-4 ring-white">
                <Icon name={icon} className="h-3.5 w-3.5" />
              </span>
            ) : (
              <Icon name={icon} className="mt-1 h-3.5 w-3.5" />
            )}
            {label}
          </div>
        );
      })}
    </div>
  );
}

const CONSUMER_TABS = [["home", "Home"], ["filePlus", "Reports"], ["wallet", "Bills"], ["chat", "Chatbot"], ["user", "Account"]];

const LINEMAN_TABS = [["briefcase", "Jobs"], ["history", "History"], ["bell", "Notifications"], ["user", "Account"]];

function LangToggle() {
  return (
    <span className="inline-flex rounded-full bg-gray-200 p-0.5 text-[8px] font-bold">
      <span className="rounded-full bg-blue-700 px-1.5 py-0.5 text-white">ENG</span>
      <span className="px-1.5 py-0.5 text-gray-600">FIL</span>
    </span>
  );
}

export function ConsumerHome() {
  return (
    <Phone>
      <AppHeader />
      <div className="space-y-2.5 p-3">
        <div className="flex items-baseline justify-between">
          <p className="font-display text-[12px] font-bold text-blue-700">Power Advisory</p>
          <span className="text-[8px] font-semibold text-blue-700">View All ›</span>
        </div>
        <div className="rounded-xl border border-dashed border-gray-300 bg-blue-50 px-3 py-3.5 text-center">
          <span className="mx-auto flex h-7 w-7 items-center justify-center rounded-full bg-blue-100 text-blue-700">
            <Icon name="bolt" className="h-3.5 w-3.5" />
          </span>
          <p className="mt-1.5 text-[10px] font-bold text-blue-900">No Scheduled Outages</p>
          <p className="mt-0.5 text-[8px] leading-snug text-gray-500">You&apos;ll see upcoming power interruptions in your area here.</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white px-3 py-3.5 text-center shadow-sm">
          <span className="mx-auto flex h-7 w-7 items-center justify-center rounded-full bg-orange-50 text-orange-600">
            <Icon name="warning" className="h-3.5 w-3.5" />
          </span>
          <p className="mt-1.5 text-[11px] font-extrabold text-gray-900">Experiencing an Outage?</p>
          <p className="mt-0.5 text-[8px] leading-snug text-gray-500">
            Report power interruptions immediately. Our team will be notified and dispatched to resolve the issue as quickly as possible.
          </p>
          <div className="mt-2.5 flex items-center justify-center gap-1.5 rounded-lg bg-blue-700 py-1.5 text-[10px] font-semibold text-white">
            <Icon name="warning" className="h-3 w-3" />
            Report Now
          </div>
        </div>
      </div>
      <div className="h-6" />
      <TabBar items={CONSUMER_TABS} active="Home" />
    </Phone>
  );
}

export function ConsumerLocation() {
  return (
    <Phone>
      <AppHeader right={<LangToggle />} />
      <div className="space-y-2 p-3">
        <div className="flex items-baseline justify-between">
          <p className="text-[10px] font-bold text-blue-700">Location</p>
          <p className="text-[8px] font-bold tracking-wide text-blue-700">STEP 1 OF 3</p>
        </div>
        <div className="flex gap-1">
          <span className="h-1 flex-1 rounded-full bg-blue-700" />
          <span className="h-1 flex-1 rounded-full bg-blue-100" />
          <span className="h-1 flex-1 rounded-full bg-blue-100" />
        </div>
        <p className="font-display text-[13px] font-extrabold text-gray-900">Select Location</p>
        <p className="text-[8px] leading-snug text-gray-500">Pin the exact location where the service issue is occurring.</p>
        <div className="overflow-hidden rounded-xl border border-gray-200">
          <MapArt route={false} className="block h-28 w-full" />
        </div>
        <div className="flex items-center justify-center gap-1.5 rounded-lg bg-blue-700 py-2 text-[10px] font-semibold text-white">
          Capture My Location
          <Icon name="pin" className="h-3 w-3" />
        </div>
        <p className="text-center text-[10px] font-medium text-blue-700">Cancel</p>
      </div>
    </Phone>
  );
}

export function ConsumerTracking({ width }) {
  const steps = [
    ["Report received", "10:16 PM", "done"],
    ["Lineman dispatched", "10:26 PM", "done"],
    ["Repair in progress", "10:53 PM", "current"],
    ["Restored", "", "todo"],
  ];
  const right = { done: ["Complete", "text-green-600"], current: ["In progress", "text-blue-600"], todo: ["Pending", "text-gray-400"] };
  return (
    <Phone width={width}>
      <ScreenTitle kicker="OUTAGE REPORT DETAIL" title="RPT-2026-001" />
      <div className="space-y-2.5 p-3">
        <div className="flex items-center justify-between rounded-lg border border-blue-300 bg-blue-100 px-2.5 py-2 text-[9px] font-extrabold text-blue-700">
          <span className="flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-blue-700" />
            STATUS
          </span>
          <span>IN PROGRESS</span>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-2.5">
          <div className="flex items-center gap-2 border-b border-gray-100 pb-2">
            <Icon name="clock" className="h-3.5 w-3.5 text-blue-700" />
            <div>
              <p className="text-[10px] font-bold text-gray-900">Report Tracking</p>
              <p className="text-[8px] text-gray-500">Report and repair progress</p>
            </div>
          </div>
          <p className="mb-1.5 mt-2 text-[10px] font-bold text-gray-900">Outage repair progress</p>
          <ol>
            {steps.map(([label, time, s], i) => (
              <li key={label} className="relative flex items-start gap-2 pb-2 last:pb-0">
                {i < steps.length - 1 && <span className={`absolute left-[4px] top-3 h-full w-px ${s === "done" ? "bg-blue-300" : "bg-gray-200"}`} />}
                <span
                  className={`relative mt-0.5 h-2.5 w-2.5 shrink-0 rounded-full border-2 ${
                    s === "done" ? "border-green-600 bg-green-100" : s === "current" ? "border-blue-600 bg-blue-100" : "border-gray-300 bg-white"
                  }`}
                />
                <div className="flex flex-1 items-start justify-between gap-1">
                  <div>
                    <p className={`text-[9px] font-semibold ${s === "todo" ? "text-gray-400" : "text-gray-900"}`}>{label}</p>
                    {time && <p className="text-[8px] text-gray-500">{time}</p>}
                  </div>
                  <span className={`text-[8px] font-semibold ${right[s][1]}`}>{right[s][0]}</span>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </Phone>
  );
}

export function LinemanJobs() {
  return (
    <Phone>
      <AppHeader role="Lineman" badge="3" />
      <div className="space-y-2 p-3">
        <div className="grid grid-cols-2 gap-1.5">
          <div className="rounded-lg border border-gray-200 bg-white p-2">
            <p className="text-[7px] font-semibold tracking-wide text-gray-500">ACTIVE JOBS</p>
            <p className="font-display text-lg font-extrabold leading-tight text-blue-700">5</p>
          </div>
          <div className="rounded-lg border border-gray-200 bg-white p-2">
            <p className="text-[7px] font-semibold tracking-wide text-gray-500">HIGH-PRIORITY</p>
            <p className="font-display text-lg font-extrabold leading-tight text-red-600">3</p>
          </div>
        </div>
        <p className="font-display text-[11px] font-bold text-gray-900">Active Queue</p>
        <div className="flex gap-1 overflow-hidden text-[8px] font-semibold">
          <span className="whitespace-nowrap rounded-full bg-blue-700 px-2 py-1 text-white">To Do (4)</span>
          <span className="whitespace-nowrap rounded-full border border-gray-300 px-2 py-1 text-gray-700">Verification (1)</span>
          <span className="whitespace-nowrap rounded-full border border-gray-300 px-2 py-1 text-gray-700">High Priority</span>
        </div>
        <p className="text-[8px] font-semibold tracking-wide text-gray-500">WORK TO DO (4)</p>

        <div className="space-y-1.5 rounded-xl border border-gray-200 border-l-4 border-l-blue-700 bg-white p-2.5">
          <div className="flex items-center justify-between">
            <span className="flex gap-1">
              <span className="rounded bg-amber-100 px-1 py-0.5 text-[7px] font-bold text-amber-800">REOPENED</span>
              <span className="rounded bg-orange-100 px-1 py-0.5 text-[7px] font-bold text-orange-700">HIGH</span>
            </span>
            <span className="text-[8px] font-semibold text-gray-700">RPT-2026-002</span>
          </div>
          <p className="text-[10px] font-bold text-gray-900">Consumer A</p>
          <p className="flex items-center gap-1 text-[8px] text-gray-500"><Icon name="pin" className="h-2.5 w-2.5" />Zone 1, Barangay A, Municipality A</p>
          <div className="rounded-md bg-amber-100 p-1.5">
            <p className="text-[7px] font-bold text-amber-800">REOPENED BY THE SUPERVISOR</p>
            <p className="text-[8px] leading-snug text-amber-900">The consumer reported that power went out again after the previous repair.</p>
          </div>
          <p className="flex items-center gap-1 border-t border-gray-100 pt-1.5 text-[9px] font-semibold text-blue-700"><span className="h-1.5 w-1.5 rounded-full bg-blue-700" />Assigned</p>
        </div>

      </div>
      <div className="h-4" />
      <TabBar items={LINEMAN_TABS} active="Jobs" />
    </Phone>
  );
}

export function LinemanNav() {
  return (
    <Phone>
      <ScreenTitle kicker="JOB ORDER" title="Navigation" />
      <div className="relative p-2">
        <div className="relative overflow-hidden rounded-xl border border-gray-200">
          <MapArt className="block h-48 w-full" />
          <div className="absolute inset-x-1.5 top-1.5 flex items-center gap-2 rounded-lg bg-blue-800 p-2 text-white shadow">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-white/15">
              <Icon name="arrowLeft" className="h-3.5 w-3.5" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="font-display text-[10px] font-bold leading-none">120 m Turn Left</p>
              <p className="truncate text-[8px] text-blue-100">Then continue onto Street A</p>
            </div>
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-white/15">
              <Icon name="volume" className="h-3 w-3" />
            </span>
          </div>
          <div className="absolute inset-x-1.5 bottom-1.5 rounded-lg bg-white p-2 shadow-md">
            <div className="grid grid-cols-3 gap-1 text-center">
              {[["DISTANCE", "1.2 km", "text-gray-900"], ["TRAVEL TIME", "4 min", "text-blue-700"], ["ETA", "9:42 PM", "text-gray-900"]].map(([l, v, c]) => (
                <div key={l}>
                  <p className="text-[6px] font-semibold tracking-wide text-gray-500">{l}</p>
                  <p className={`text-[10px] font-bold ${c}`}>{v}</p>
                </div>
              ))}
            </div>
            <div className="mt-1.5 flex items-center justify-center gap-1 rounded-md bg-blue-700 py-1.5 text-[9px] font-semibold text-white">
              <Icon name="route" className="h-2.5 w-2.5" />
              Start Task
            </div>
          </div>
        </div>
      </div>
    </Phone>
  );
}