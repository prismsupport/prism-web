import Link from "next/link";
import Logo from "@/components/ui/Logo";
import MobileNav from "@/components/landing/MobileNav";

export const metadata = {
  title: "Outage reporting and dispatch for electric cooperatives",
  description:
    "PRISM connects consumers, linemen and supervisors in one system: GPS-tagged outage reports, duplicate detection, smart dispatch, QA review and targeted advisories.",
  openGraph: {
    title: "PRISM: Outage reporting and dispatch for electric cooperatives",
    description:
      "Report, dispatch, repair and keep every member informed, in one connected workflow.",
    type: "website",
  },
};

// Leave empty until a real APK is hosted. While empty, no download button or
// install steps are shown anywhere on the page.
const APK_URL = "";

const FOCUS =
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600";
const FOCUS_DARK =
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-300";

/* -------------------------------------------------------------------------- */
/* Content                                                                    */
/* -------------------------------------------------------------------------- */

const NAV = [
  { href: "#problem", label: "Why PRISM" },
  { href: "#features", label: "Features" },
  { href: "#how", label: "How it works" },
  { href: "#faq", label: "FAQ" },
  { href: "#download", label: "Download" },
];

// Figures from the consumer survey in the study (48 respondents, CASURECO I and II).
const STATS = [
  { value: "62.5%", pct: 62.5, label: "agree there is a gap between what the cooperative knows and what consumers are told" },
  { value: "70.8%", pct: 70.8, label: "have had to contact the cooperative themselves just to get an update" },
  { value: "55.6%", pct: 55.6, label: "of those who reported an outage did not get consistent updates afterward" },
  { value: "93.8%", pct: 93.8, label: "said an app to report and track outages would be useful" },
];

const GROUPS = [
  {
    n: "01",
    title: "Reporting and Detection",
    text: "Capture accurate reports and spot the ones that belong together.",
  },
  {
    n: "02",
    title: "Dispatch and Field Operations",
    text: "Get the right crew to the right place, and keep an eye on the clock.",
  },
  {
    n: "03",
    title: "Management and Communication",
    text: "Verify repairs, keep members informed, and measure performance.",
  },
];

const F = {
  report: {
    title: "GPS-tagged reports",
    text: "Consumers pin the exact location, pick a concern category, attach a photo or video, and get a ticket number right away. Available in English and Filipino.",
    icon: "pin",
  },
  duplicate: {
    title: "Duplicate detection",
    text: "Related reports are scored and suggested for merging into one Master Ticket, so crews are not sent to the same fault twice.",
    icon: "copy",
  },
  tracking: {
    title: "Live ticket tracking",
    text: "Every status change reaches the consumer by push notification, from Pending to Resolved, including a rating and reopen option.",
    icon: "bell",
  },
  dispatch: {
    title: "Smart dispatch",
    text: "Linemen are ranked by availability, area office, distance and workload, with the score breakdown visible. You make the final call.",
    icon: "bolt",
  },
  routing: {
    title: "Turn-by-turn routing",
    text: "Linemen get job orders on their phone and a route to the outage site, instead of asking residents for directions.",
    icon: "route",
  },
  monitoring: {
    title: "Response monitoring",
    text: "Tickets left unassigned past your threshold are flagged, and supervisors are alerted once per ticket.",
    icon: "clock",
  },
  qa: {
    title: "QA before closing",
    text: "Repair photos, video, voice notes and a completion checklist are reviewed by a supervisor before a ticket is resolved.",
    icon: "check",
  },
  advisories: {
    title: "Targeted advisories",
    text: "Publish maintenance and interruption notices to a feeder, municipality, barangay or the whole cooperative. Only affected members are notified.",
    icon: "megaphone",
  },
  analytics: {
    title: "Service analytics",
    text: "Response and repair times, time per stage, recurring issues and lineman ratings, with Excel and PDF export.",
    icon: "chart",
  },
};

const ALSO = [
  "Read-only bill inquiry",
  "FAQ chatbot (EN + TL)",
  "Offline report saving",
  "Office hours and hotlines",
  "Custom status names",
  "Custom priority levels",
  "Duty schedules and on-call",
  "Module-level supervisor access",
  "Archive and restore",
];

const STEPS = [
  {
    n: "1",
    title: "Consumer reports",
    text: "A member files an outage report from the mobile app and gets a ticket number.",
    device: "Mobile app",
    icon: "pin",
    tags: ["Location", "Photo or video"],
  },
  {
    n: "2",
    title: "Supervisor dispatches",
    text: "Duplicates are grouped and the best-matched lineman is assigned.",
    device: "Web dashboard",
    icon: "bolt",
    tags: ["Master Ticket", "Lineman ranking"],
  },
  {
    n: "3",
    title: "Lineman repairs",
    text: "The crew is routed to the site, repairs, and uploads proof of completion.",
    device: "Mobile app",
    icon: "route",
    tags: ["Route", "Proof of completion"],
  },
  {
    n: "4",
    title: "Supervisor reviews and approves",
    text: "The supervisor reviews the proof in QA and approves or rejects it. Once approved, the ticket is resolved and the consumer is notified and can rate the job.",
    device: "Web dashboard",
    icon: "check",
    tags: ["Approve", "Reject with remarks"],
  },
];

const ROLES = [
  {
    who: "Consumers",
    where: "Mobile app",
    points: [
      "Report outages with location and photo",
      "Follow ticket progress live",
      "Read advisories for their barangay",
      "View bills and ask the FAQ chatbot",
    ],
  },
  {
    who: "Linemen",
    where: "Mobile app",
    points: [
      "Receive job orders by push notification",
      "Navigate to the outage site",
      "Update status step by step",
      "Submit proof of completion",
    ],
  },
  {
    who: "Supervisors",
    where: "Web dashboard",
    points: [
      "Dispatch, merge and review repairs",
      "Publish targeted advisories",
      "Manage service areas, FAQ and billing",
      "Track performance and export reports",
    ],
  },
];

const FAQS = [
  {
    q: "How does a cooperative get started?",
    a: "Register your cooperative and your Owner account. The PRISM administrator reviews the registration, and you can log in once it is approved. Then add your service areas, create lineman accounts, and your consumers register in the mobile app.",
  },
  {
    q: "Does PRISM dispatch crews automatically?",
    a: "No. Duplicate suggestions and lineman rankings are rule-based recommendations with the full score breakdown shown. Supervisors confirm every merge and make every dispatch decision.",
  },
  {
    q: "Does it replace our billing system?",
    a: "No. Bill inquiry is read-only and uses a billing API your cooperative provides. PRISM does not process payments or change billing records.",
  },
  {
    q: "What happens when a consumer has no signal?",
    a: "The report is saved on the phone with its ticket number and sent automatically when the connection returns.",
  },
  {
    q: "Which devices are supported?",
    a: "The mobile app is currently available for Android. Supervisors use the web dashboard in any modern browser.",
  },
];

/* -------------------------------------------------------------------------- */
/* Primitives                                                                 */
/* -------------------------------------------------------------------------- */

const ICONS = {
  pin: (
    <>
      <path d="M12 22s7-6.2 7-12a7 7 0 1 0-14 0c0 5.8 7 12 7 12Z" />
      <circle cx="12" cy="10" r="2.5" />
    </>
  ),
  copy: (
    <>
      <rect x="8" y="8" width="12" height="12" rx="2" />
      <path d="M4 16V6a2 2 0 0 1 2-2h10" />
    </>
  ),
  bolt: <path d="M13 2 3 14h7l-1 8 11-14h-7l1-6Z" />,
  route: <path d="m3 11 19-9-9 19-2-8-8-2Z" />,
  check: (
    <>
      <circle cx="12" cy="12" r="10" />
      <path d="m9 12 2 2 4-4" />
    </>
  ),
  tick: <path d="m5 13 4 4L19 7" />,
  megaphone: (
    <>
      <path d="m3 11 18-5v12L3 14v-3z" />
      <path d="M11.6 16.8a3 3 0 1 1-5.8-1.6" />
    </>
  ),
  bell: (
    <>
      <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.7 21a2 2 0 0 1-3.4 0" />
    </>
  ),
  clock: (
    <>
      <circle cx="12" cy="12" r="10" />
      <path d="M12 6v6l4 2" />
    </>
  ),
  chart: (
    <>
      <path d="M3 3v18h18" />
      <path d="M7 16v-5" />
      <path d="M12 16V7" />
      <path d="M17 16v-3" />
    </>
  ),
  phone: (
    <>
      <rect x="7" y="2" width="10" height="20" rx="2" />
      <path d="M11 18h2" />
    </>
  ),
  monitor: (
    <>
      <rect x="3" y="4" width="18" height="12" rx="2" />
      <path d="M8 20h8" />
      <path d="M12 16v4" />
    </>
  ),
  grid: (
    <>
      <rect width="7" height="9" x="3" y="3" rx="1" />
      <rect width="7" height="5" x="14" y="3" rx="1" />
      <rect width="7" height="9" x="14" y="12" rx="1" />
      <rect width="7" height="5" x="3" y="16" rx="1" />
    </>
  ),
  clipboard: (
    <>
      <rect width="8" height="4" x="8" y="2" rx="1" />
      <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
    </>
  ),
  users: (
    <>
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.9" />
      <path d="M16 3.1a4 4 0 0 1 0 7.8" />
    </>
  ),
  image: (
    <>
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <circle cx="9" cy="9" r="2" />
      <path d="m21 15-5-5L5 21" />
    </>
  ),
  arrow: (
    <>
      <path d="M5 12h14" />
      <path d="m12 5 7 7-7 7" />
    </>
  ),
  chevron: <path d="m6 9 6 6 6-6" />,
  mail: (
    <>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="m3 7 9 6 9-6" />
    </>
  ),
};

function Icon({ name, className = "h-5 w-5" }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
      focusable="false"
    >
      {ICONS[name]}
    </svg>
  );
}

const CHIP_TONES = {
  red: "bg-red-50 text-red-700 ring-red-200",
  amber: "bg-amber-50 text-amber-700 ring-amber-200",
  orange: "bg-orange-50 text-orange-700 ring-orange-200",
  blue: "bg-blue-50 text-blue-700 ring-blue-200",
  green: "bg-green-50 text-green-700 ring-green-200",
  gray: "bg-gray-100 text-gray-600 ring-gray-200",
};

function Chip({ tone = "gray", children, className = "" }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1 ring-inset ${CHIP_TONES[tone]} ${className}`}
    >
      {children}
    </span>
  );
}

function SectionHeading({ id, eyebrow, title, text, className = "" }) {
  return (
    <div className={`max-w-2xl ${className}`}>
      <p className="flex items-center gap-3 text-xs font-bold tracking-wide text-blue-700">
        <span className="h-px w-8 bg-blue-700" aria-hidden="true" />
        {eyebrow}
      </p>
      <h2
        id={id}
        className="font-display mt-3 text-3xl font-extrabold tracking-tight text-[#071B3A] sm:text-4xl"
      >
        {title}
      </h2>
      {text && <p className="mt-3 text-base leading-relaxed text-gray-500">{text}</p>}
    </div>
  );
}

function AvailabilityChips({ dark = false }) {
  const base = `inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-xs font-medium ${
    dark
      ? "border-white/15 bg-white/5 text-blue-100"
      : "border-gray-200 bg-white text-gray-600"
  }`;
  return (
    <ul className="flex flex-wrap gap-2">
      <li>
        <span className={base}>
          <span className="h-1.5 w-1.5 rounded-full bg-green-400" aria-hidden="true" />
          Web dashboard: available
        </span>
      </li>
      <li>
        {APK_URL ? (
          <a
            href={APK_URL}
            download
            className={`${base} transition-colors hover:bg-white/10 ${dark ? FOCUS_DARK : FOCUS}`}
          >
            <Icon name="phone" className="h-3.5 w-3.5" />
            Download Android app (.apk)
          </a>
        ) : (
          <span className={base}>
            <span className="h-1.5 w-1.5 rounded-full bg-amber-400" aria-hidden="true" />
            Android app: coming soon
          </span>
        )}
      </li>
    </ul>
  );
}

/* -------------------------------------------------------------------------- */
/* Illustrative interface pieces (decorative, sample data)                    */
/* -------------------------------------------------------------------------- */

function MapArt({ cluster = false, className = "" }) {
  return (
    <svg
      viewBox="0 0 400 200"
      preserveAspectRatio="xMidYMid slice"
      className={className}
      aria-hidden="true"
      focusable="false"
    >
      <rect width="400" height="200" fill="#EAF1FB" />
      <g stroke="#D5E2F4" strokeWidth="1">
        {[40, 80, 120, 160].map((y) => (
          <line key={y} x1="0" x2="400" y1={y} y2={y} />
        ))}
        {[50, 100, 150, 200, 250, 300, 350].map((x) => (
          <line key={x} y1="0" y2="200" x1={x} x2={x} />
        ))}
      </g>
      <g fill="none" stroke="#fff" strokeLinecap="round">
        <path d="M-10 150 C 70 140 110 90 200 95 S 330 60 410 40" strokeWidth="12" />
        <path d="M120 -10 C 130 60 170 110 160 210" strokeWidth="9" />
        <path d="M-10 60 C 60 70 100 40 150 30" strokeWidth="7" />
      </g>
      <path
        d="M70 148 C 110 140 130 100 200 96 S 290 70 300 58"
        fill="none"
        stroke="#2563EB"
        strokeWidth="3.5"
        strokeLinecap="round"
        strokeDasharray="7 6"
      />
      <circle cx="70" cy="148" r="9" fill="#2563EB" stroke="#fff" strokeWidth="3" />
      {cluster && (
        <>
          <circle
            cx="300"
            cy="58"
            r="32"
            fill="#EF4444"
            fillOpacity="0.08"
            stroke="#EF4444"
            strokeOpacity="0.5"
            strokeDasharray="4 4"
          />
          <circle cx="284" cy="72" r="5" fill="#EF4444" stroke="#fff" strokeWidth="2" />
          <circle cx="316" cy="70" r="5" fill="#EF4444" stroke="#fff" strokeWidth="2" />
          <circle cx="298" cy="40" r="5" fill="#EF4444" stroke="#fff" strokeWidth="2" />
        </>
      )}
      <circle
        className="origin-center [transform-box:fill-box] motion-safe:animate-ping"
        cx="300"
        cy="58"
        r="12"
        fill="#EF4444"
        fillOpacity="0.35"
      />
      <circle cx="300" cy="58" r="8" fill="#EF4444" stroke="#fff" strokeWidth="3" />
    </svg>
  );
}

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

function HeroPreview() {
  return (
    <figure className="mx-auto w-full max-w-xl">
      <div className="relative" aria-hidden="true">
        <div className="overflow-hidden rounded-2xl border border-white/10 bg-white shadow-2xl shadow-black/40 ring-1 ring-white/10">
          <WindowChrome label="Supervisor portal · Dispatch" />
          <div className="flex">
            <div className="hidden w-12 shrink-0 flex-col items-center gap-3 bg-[#071B3A] py-4 sm:flex">
              {["grid", "clipboard", "megaphone", "users"].map((n, i) => (
                <span
                  key={n}
                  className={`flex h-8 w-8 items-center justify-center rounded-lg ${
                    i === 1 ? "bg-white/15 text-white" : "text-blue-300/70"
                  }`}
                >
                  <Icon name={n} className="h-4 w-4" />
                </span>
              ))}
            </div>

            <div className="min-w-0 flex-1 space-y-3 bg-gray-50 p-4">
              <div className="flex items-center justify-between gap-2">
                <p className="font-display text-sm font-bold text-gray-900">Dispatch Management</p>
                <Chip tone="red">
                  <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
                  Response time exceeded
                </Chip>
              </div>

              <div className="grid grid-cols-4 gap-2">
                {[
                  ["Pending", "3", "text-red-600"],
                  ["Dispatched", "2", "text-amber-600"],
                  ["In Progress", "4", "text-orange-600"],
                  ["QA Review", "1", "text-blue-700"],
                ].map(([label, value, color]) => (
                  <div key={label} className="rounded-lg border border-gray-200 bg-white px-2.5 py-2">
                    <p className="truncate text-[9px] font-bold uppercase tracking-wide text-gray-400">
                      {label}
                    </p>
                    <p className={`font-display text-lg font-extrabold leading-tight ${color}`}>{value}</p>
                  </div>
                ))}
              </div>

              <div className="relative overflow-hidden rounded-xl border border-gray-200">
                <MapArt cluster className="block h-36 w-full" />
                <span className="absolute left-2.5 top-2.5 rounded-md bg-white/95 px-2 py-1 text-[10px] font-bold text-gray-700 shadow-sm">
                  Master Ticket · 4 linked reports
                </span>
                <span className="absolute bottom-2.5 left-2.5 rounded-md bg-[#071B3A] px-2 py-1 text-[10px] font-semibold text-white">
                  Route to site
                </span>
              </div>

              <div className="rounded-xl border border-gray-200 bg-white p-3">
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-[11px] font-bold text-gray-900">Smart Dispatch Recommendation</p>
                  <Chip tone="green">Highly likely duplicate</Chip>
                </div>
                <div className="flex items-center justify-between rounded-lg border-2 border-blue-600 px-3 py-2">
                  <div className="flex items-center gap-2.5">
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-100 text-[10px] font-bold text-blue-700">
                      LM
                    </span>
                    <div>
                      <p className="text-xs font-semibold text-gray-900">Best match</p>
                      <p className="text-[10px] text-gray-500">On duty · covers this area</p>
                    </div>
                  </div>
                  <span className="font-display text-base font-extrabold text-blue-700">92%</span>
                </div>
                <div className="mt-3 flex items-center gap-1">
                  {["Pending", "Dispatched", "In Progress", "QA", "Resolved"].map((s, i) => (
                    <div key={s} className="flex flex-1 flex-col items-center gap-1">
                      <span className={`h-1.5 w-full rounded-full ${i < 2 ? "bg-blue-600" : "bg-gray-200"}`} />
                      <span className={`text-[9px] ${i < 2 ? "font-semibold text-blue-700" : "text-gray-400"}`}>
                        {s}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Floating: incoming report */}
        <div className="absolute -left-4 bottom-16 hidden w-52 items-start gap-3 rounded-xl border border-gray-200 bg-white p-3 shadow-xl sm:flex">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-red-50 text-red-600">
            <Icon name="pin" className="h-4 w-4" />
          </span>
          <div className="min-w-0">
            <p className="text-xs font-bold text-gray-900">New outage report</p>
            <p className="mt-0.5 text-[11px] text-gray-500">Location captured · photo attached</p>
          </div>
        </div>

        {/* Floating: assignment */}
        <div className="absolute -right-3 -top-4 hidden items-center gap-2.5 rounded-xl border border-gray-200 bg-white px-3 py-2.5 shadow-xl sm:flex">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-green-100 text-green-700">
            <Icon name="tick" className="h-3.5 w-3.5" />
          </span>
          <div>
            <p className="text-xs font-bold text-gray-900">Lineman assigned</p>
            <p className="text-[11px] text-gray-500">Consumer notified</p>
          </div>
        </div>
      </div>
      <figcaption className="mt-4 text-center text-[11px] text-blue-200/70">
        Illustrative interface preview. Sample data.
      </figcaption>
    </figure>
  );
}

function Phone({ children, className = "" }) {
  return (
    <div
      aria-hidden="true"
      className={`mx-auto w-48 rounded-[1.75rem] border-[5px] border-gray-900 bg-gray-900 shadow-xl ${className}`}
    >
      <div className="overflow-hidden rounded-[1.3rem] bg-white">
        <div className="mx-auto mt-2 h-1.5 w-12 rounded-full bg-gray-200" />
        {children}
      </div>
    </div>
  );
}

function ConsumerPhone() {
  return (
    <Phone>
      <div className="space-y-2.5 p-3">
        <p className="font-display text-xs font-bold text-gray-900">Report an outage</p>
        <div className="flex items-center gap-2 rounded-lg border border-gray-200 p-2">
          <span className="flex h-6 w-6 items-center justify-center rounded-md bg-blue-50 text-blue-700">
            <Icon name="pin" className="h-3.5 w-3.5" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-semibold text-gray-800">Location captured</p>
            <div className="mt-1 h-1.5 w-20 rounded-full bg-gray-100" />
          </div>
        </div>
        <Chip tone="blue">Damaged Power Lines</Chip>
        <div className="flex gap-2">
          <div className="flex-1 space-y-1.5 rounded-lg bg-gray-50 p-2">
            <div className="h-1.5 w-full rounded-full bg-gray-200" />
            <div className="h-1.5 w-4/5 rounded-full bg-gray-200" />
            <div className="h-1.5 w-2/3 rounded-full bg-gray-200" />
          </div>
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gray-100 text-gray-400">
            <Icon name="image" className="h-4 w-4" />
          </div>
        </div>
        <div className="rounded-lg bg-blue-700 py-2 text-center text-[11px] font-semibold text-white">
          Submit report
        </div>
        <div className="flex items-center justify-between rounded-lg border border-gray-200 p-2">
          <span className="text-[10px] font-semibold text-gray-700">Ticket status</span>
          <Chip tone="amber">Dispatched</Chip>
        </div>
      </div>
    </Phone>
  );
}

function LinemanPhone() {
  return (
    <Phone>
      <div>
        <div className="relative">
          <MapArt className="block h-28 w-full" />
          <span className="absolute left-2 top-2 rounded-md bg-white/95 px-1.5 py-0.5 text-[9px] font-bold text-gray-700 shadow-sm">
            Route to outage site
          </span>
        </div>
        <div className="space-y-2.5 p-3">
          <div className="flex items-center justify-between">
            <p className="font-display text-xs font-bold text-gray-900">Job order</p>
            <Chip tone="amber">Dispatched</Chip>
          </div>
          <div className="grid grid-cols-2 gap-2 text-center">
            <div className="rounded-lg bg-gray-50 py-1.5">
              <p className="text-[9px] text-gray-400">Distance</p>
              <p className="text-[11px] font-bold text-gray-800">1.2 km</p>
            </div>
            <div className="rounded-lg bg-gray-50 py-1.5">
              <p className="text-[9px] text-gray-400">ETA</p>
              <p className="text-[11px] font-bold text-gray-800">6 min</p>
            </div>
          </div>
          <div className="rounded-lg bg-blue-700 py-2 text-center text-[11px] font-semibold text-white">
            Start Task
          </div>
          <div className="flex gap-1">
            {["Assigned", "On the way", "At site", "Fixed"].map((s, i) => (
              <span key={s} className={`h-1.5 flex-1 rounded-full ${i === 0 ? "bg-blue-600" : "bg-gray-200"}`} />
            ))}
          </div>
        </div>
      </div>
    </Phone>
  );
}

function SupervisorMock() {
  return (
    <div aria-hidden="true" className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-lg">
      <WindowChrome label="Supervisor portal · Dashboard" />
      <div className="flex">
        <div className="hidden w-32 shrink-0 space-y-1 bg-[#071B3A] p-3 sm:block">
          {["Dashboard", "Dispatch", "Reports", "Advisories", "FAQ", "Users"].map((l, i) => (
            <p
              key={l}
              className={`rounded-md px-2.5 py-1.5 text-[10px] font-medium ${
                i === 0 ? "bg-white/15 text-white" : "text-blue-200/80"
              }`}
            >
              {l}
            </p>
          ))}
        </div>
        <div className="min-w-0 flex-1 space-y-3 bg-gray-50 p-4">
          <div className="grid grid-cols-3 gap-2">
            {[
              ["Pending tickets", "3", "text-red-600"],
              ["QA reviews waiting", "2", "text-blue-700"],
              ["Reopen requests", "1", "text-amber-600"],
            ].map(([label, value, color]) => (
              <div key={label} className="rounded-lg border border-gray-200 bg-white p-2.5">
                <p className="truncate text-[9px] font-bold uppercase tracking-wide text-gray-400">{label}</p>
                <p className={`font-display text-xl font-extrabold ${color}`}>{value}</p>
              </div>
            ))}
          </div>
          <div className="rounded-lg border border-gray-200 bg-white">
            {[
              ["Pending", "red", "w-20"],
              ["Dispatched", "amber", "w-24"],
              ["QA Review", "blue", "w-16"],
            ].map(([status, tone, w], i) => (
              <div
                key={status}
                className={`flex items-center justify-between gap-3 px-3 py-2.5 ${i > 0 ? "border-t border-gray-100" : ""}`}
              >
                <div className="space-y-1.5">
                  <div className={`h-2 rounded-full bg-gray-300 ${w}`} />
                  <div className="h-1.5 w-28 rounded-full bg-gray-100" />
                </div>
                <Chip tone={tone}>{status}</Chip>
              </div>
            ))}
          </div>
          <div className="flex h-14 items-end gap-1.5 rounded-lg border border-gray-200 bg-white px-3 pb-2 pt-3">
            {[40, 65, 35, 80, 55, 90, 50].map((h, i) => (
              <span
                key={i}
                className={`flex-1 rounded-t ${i === 5 ? "bg-blue-700" : "bg-blue-200"}`}
                style={{ height: `${h}%` }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Feature visuals                                                            */
/* -------------------------------------------------------------------------- */

function ReportVisual() {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-blue-700">
            <Icon name="pin" className="h-4 w-4" />
          </span>
          <div>
            <p className="text-xs font-bold text-gray-900">Location captured</p>
            <p className="text-[11px] text-gray-500">Pinned on the map, address confirmed</p>
          </div>
        </div>
        <Chip tone="blue">GPS</Chip>
      </div>
      <div className="mt-3 flex gap-3">
        <div className="flex-1 space-y-2">
          <Chip tone="blue">Damaged Power Lines</Chip>
          <div className="h-1.5 w-full rounded-full bg-gray-100" />
          <div className="h-1.5 w-5/6 rounded-full bg-gray-100" />
          <div className="h-1.5 w-2/3 rounded-full bg-gray-100" />
        </div>
        <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-gray-400">
          <Icon name="image" />
        </div>
      </div>
      <p className="mt-3 flex items-center gap-2 border-t border-gray-100 pt-3 text-[11px] font-medium text-gray-600">
        <span className="flex h-4 w-4 items-center justify-center rounded-full bg-green-100 text-green-700">
          <Icon name="tick" className="h-2.5 w-2.5" />
        </span>
        Ticket number issued on submission
      </p>
    </div>
  );
}

function DuplicateVisual() {
  return (
    <div className="rounded-xl bg-gray-50 p-3">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-semibold text-gray-700">Match score</span>
        <Chip tone="green">Highly likely duplicate</Chip>
      </div>
      <div className="mt-2.5 flex h-2 gap-1">
        {[30, 25, 20, 15, 10].map((w) => (
          <span key={w} style={{ flex: w }} className="rounded-full bg-blue-600" />
        ))}
      </div>
      <p className="mt-1.5 text-[11px] text-gray-400">
        Feeder · distance · nearby reports · time · confirmation
      </p>
    </div>
  );
}

function TrackingVisual() {
  const steps = ["Pending", "Dispatched", "In Progress", "QA Review", "Resolved"];
  return (
    <div className="rounded-xl bg-gray-50 p-3">
      <div className="flex items-start">
        {steps.map((s, i) => (
          <div key={s} className="flex flex-1 flex-col items-center gap-1.5">
            <span
              className={`h-2.5 w-2.5 rounded-full ${i < 3 ? "bg-blue-600" : "bg-gray-300"} ${
                i === 2 ? "ring-4 ring-blue-100" : ""
              }`}
            />
            <span className={`text-center text-[9px] leading-tight ${i < 3 ? "font-semibold text-blue-700" : "text-gray-400"}`}>
              {s}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function DispatchVisual() {
  const rows = [
    { initials: "LA", tag: "On duty · covers this area", pct: 92, best: true },
    { initials: "LB", tag: "On duty · other office", pct: 68 },
    { initials: "LC", tag: "Off schedule", pct: 34, muted: true },
  ];
  return (
    <div className="space-y-2.5 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <p className="text-xs font-bold text-gray-900">Recommended linemen</p>
        <p className="text-[11px] text-gray-400">Availability · office · distance · workload</p>
      </div>
      {rows.map((r) => (
        <div
          key={r.initials}
          className={`flex items-center gap-3 rounded-lg border px-3 py-2.5 ${
            r.best ? "border-2 border-blue-600" : "border-gray-200"
          } ${r.muted ? "bg-gray-50" : ""}`}
        >
          <span
            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${
              r.muted ? "bg-gray-200 text-gray-500" : "bg-blue-100 text-blue-700"
            }`}
          >
            {r.initials}
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <p className="truncate text-[11px] text-gray-600">{r.tag}</p>
              {r.best && <Chip tone="blue">Best match</Chip>}
            </div>
            <div className="mt-1.5 h-1.5 rounded-full bg-gray-100">
              <div
                className={`h-1.5 rounded-full ${r.muted ? "bg-gray-300" : "bg-blue-600"}`}
                style={{ width: `${r.pct}%` }}
              />
            </div>
          </div>
          <span className={`font-display text-sm font-extrabold ${r.muted ? "text-gray-400" : "text-blue-700"}`}>
            {r.pct}%
          </span>
        </div>
      ))}
      <p className="text-[11px] text-gray-400">The final assignment stays with the supervisor.</p>
    </div>
  );
}

function RoutingVisual() {
  return (
    <div className="relative overflow-hidden rounded-xl border border-gray-200">
      <MapArt className="block h-28 w-full" />
      <span className="absolute bottom-2 left-2 rounded-md bg-white/95 px-2 py-1 text-[10px] font-bold text-gray-700 shadow-sm">
        Distance · travel time · ETA
      </span>
    </div>
  );
}

function MonitoringVisual() {
  return (
    <div className="rounded-xl bg-gray-50 p-3 text-xs">
      <div className="flex items-center justify-between">
        <span className="font-semibold text-gray-700">Unassigned ticket</span>
        <Chip tone="red">Overdue</Chip>
      </div>
      <div className="mt-2.5 flex h-2 overflow-hidden rounded-full">
        <span className="w-[70%] bg-amber-400" />
        <span className="w-[30%] bg-red-500" />
      </div>
      <div className="mt-1.5 flex justify-between text-[11px] text-gray-400">
        <span>Within threshold</span>
        <span>Threshold set by your cooperative</span>
      </div>
    </div>
  );
}

function QAVisual() {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <p className="text-xs font-bold text-gray-900">Proof of completion</p>
      <div className="mt-3 grid grid-cols-2 gap-2">
        {["Completion checklist", "Photo", "Voice note", "Remarks"].map((label) => (
          <div
            key={label}
            className="flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-2.5 py-2 text-[11px] font-medium text-gray-700"
          >
            <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-green-100 text-green-700">
              <Icon name="tick" className="h-2.5 w-2.5" />
            </span>
            {label}
          </div>
        ))}
      </div>
      <p className="mb-2 mt-4 text-[11px] font-bold uppercase tracking-wide text-gray-400">
        Supervisor decision
      </p>
      <div className="grid grid-cols-2 gap-2">
        <div className="rounded-lg bg-green-600 py-2 text-center text-[11px] font-semibold text-white">
          Approve and close ticket
        </div>
        <div className="rounded-lg border border-red-200 bg-red-50 py-2 text-center text-[11px] font-semibold text-red-700">
          Reject with remarks
        </div>
      </div>
    </div>
  );
}

function AdvisoryVisual() {
  const targets = ["Entire cooperative", "Feeder", "Municipality", "Barangay"];
  return (
    <div className="rounded-xl bg-gray-50 p-3">
      <p className="mb-2 text-[11px] font-semibold text-gray-600">Target</p>
      <div className="flex flex-wrap gap-1.5">
        {targets.map((t) => (
          <span
            key={t}
            className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1 ring-inset ${
              t === "Barangay" ? "bg-blue-700 text-white ring-blue-700" : "bg-white text-gray-600 ring-gray-200"
            }`}
          >
            {t}
          </span>
        ))}
      </div>
    </div>
  );
}

function AnalyticsVisual() {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="flex items-end gap-2" style={{ height: "5.5rem" }}>
        {[35, 60, 45, 80, 55, 95, 65, 75].map((h, i) => (
          <span
            key={i}
            className={`flex-1 rounded-t ${i === 5 ? "bg-blue-700" : "bg-blue-200"}`}
            style={{ height: `${h}%` }}
          />
        ))}
      </div>
      <div className="mt-3 flex flex-wrap gap-1.5">
        {["Response time", "Repair time", "Recurring issues", "Ratings"].map((l) => (
          <Chip key={l} tone="gray">
            {l}
          </Chip>
        ))}
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Feature card + layout                                                      */
/* -------------------------------------------------------------------------- */

function FeatureCard({ feature, visual, featured = false, row = false, className = "" }) {
  return (
    <article
      className={`group flex min-w-0 flex-col rounded-2xl border p-6 shadow-sm transition-[border-color,box-shadow] hover:border-blue-300 hover:shadow-md motion-safe:duration-200 ${
        featured
          ? "border-blue-100 bg-[linear-gradient(135deg,#EFF6FF_0%,#ffffff_60%)]"
          : "border-gray-200 bg-white"
      } ${row ? "lg:flex-row lg:items-center lg:gap-10" : ""} ${className}`}
    >
      <div className={row ? "lg:w-1/2" : ""}>
        <span
          className={`mb-4 flex h-10 w-10 items-center justify-center rounded-xl ${
            featured ? "bg-blue-700 text-white" : "bg-blue-50 text-blue-700"
          }`}
        >
          <Icon name={feature.icon} />
        </span>
        <h4 className="font-display text-lg font-bold text-[#071B3A]">{feature.title}</h4>
        <p className="mt-1.5 text-sm leading-relaxed text-gray-600">{feature.text}</p>
      </div>
      {visual && (
        <div aria-hidden="true" className={row ? "mt-6 lg:mt-0 lg:w-1/2" : "mt-auto pt-6"}>
          {visual}
        </div>
      )}
    </article>
  );
}

function GroupHeader({ group }) {
  return (
    <div className="mb-5 flex flex-wrap items-baseline gap-x-4 gap-y-1 border-t border-gray-200 pt-6">
      <span className="font-display text-sm font-bold text-blue-700">{group.n}</span>
      <h3 className="font-display text-xl font-bold text-[#071B3A]">{group.title}</h3>
      <p className="text-sm text-gray-500 sm:ml-auto sm:max-w-sm sm:text-right">{group.text}</p>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Page                                                                       */
/* -------------------------------------------------------------------------- */

export default function Home() {
  return (
    <div className="min-h-screen overflow-x-clip bg-gray-50 text-gray-900">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-white focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-blue-700 focus:shadow-lg"
      >
        Skip to content
      </a>

      {/* Navigation */}
      <header className="sticky top-0 z-40 border-b border-gray-200/80 bg-white/85 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
          <Link href="/" aria-label="PRISM home" className={`rounded-lg ${FOCUS}`}>
            <Logo subtitle="OUTAGE MANAGEMENT" />
          </Link>

          <nav aria-label="Main" className="hidden items-center gap-1 lg:flex">
            {NAV.map((n) => (
              <a
                key={n.href}
                href={n.href}
                className={`rounded-lg px-3.5 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-blue-50 hover:text-blue-700 ${FOCUS}`}
              >
                {n.label}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <Link
              href="/supervisor/login"
              className={`hidden rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 transition-colors hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700 sm:inline-block ${FOCUS}`}
            >
              Log in
            </Link>
            <Link
              href="/supervisor/register"
              className={`rounded-lg bg-blue-700 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-800 ${FOCUS}`}
            >
              Register
            </Link>
            <MobileNav links={NAV} />
          </div>
        </div>
      </header>

      <main id="main">
        {/* Hero */}
        <section
          aria-labelledby="hero-title"
          className="relative overflow-hidden bg-[#071B3A]"
        >
          <div
            className="pointer-events-none absolute inset-0"
            aria-hidden="true"
            style={{
              backgroundImage:
                "linear-gradient(rgba(255,255,255,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.06) 1px, transparent 1px)",
              backgroundSize: "48px 48px",
              maskImage: "radial-gradient(ellipse at 70% 40%, black 25%, transparent 75%)",
              WebkitMaskImage: "radial-gradient(ellipse at 70% 40%, black 25%, transparent 75%)",
            }}
          />
          <svg
            className="pointer-events-none absolute right-0 top-0 hidden h-full w-3/5 text-blue-300/20 lg:block"
            viewBox="0 0 600 600"
            fill="none"
            aria-hidden="true"
            focusable="false"
          >
            <g stroke="currentColor" strokeWidth="1">
              <path d="M80 120 L240 70 L420 150 L540 80" />
              <path d="M240 70 L300 250 L420 150" />
              <path d="M300 250 L150 360 L330 450 L500 380 L300 250" />
              <path d="M150 360 L70 500" />
              <path d="M330 450 L400 560" />
            </g>
            <g fill="currentColor">
              {[
                [80, 120],
                [240, 70],
                [420, 150],
                [540, 80],
                [300, 250],
                [150, 360],
                [330, 450],
                [500, 380],
                [70, 500],
                [400, 560],
              ].map(([x, y]) => (
                <circle key={`${x}-${y}`} cx={x} cy={y} r="4" />
              ))}
            </g>
          </svg>
          <div
            className="pointer-events-none absolute -right-24 top-0 h-96 w-96 rounded-full bg-blue-500/20 blur-3xl"
            aria-hidden="true"
          />

          <div className="relative mx-auto grid max-w-6xl items-center gap-14 px-4 py-16 sm:px-6 lg:grid-cols-[1fr_1.1fr] lg:py-24">
            <div>
              <p className="mb-5 inline-flex items-center gap-2 rounded-full border border-amber-300/30 bg-amber-300/10 px-3 py-1 text-xs font-bold tracking-wide text-amber-300">
                FOR ELECTRIC COOPERATIVES
              </p>
              <h1
                id="hero-title"
                className="font-display text-[2rem] font-extrabold leading-[1.08] tracking-tight text-white sm:text-5xl"
              >
                <span className="block">Outages reported.</span>
                <span className="block">Crews dispatched.</span>
                <span className="block text-amber-300">Power restored.</span>
              </h1>
              <p className="mt-5 max-w-lg text-base leading-relaxed text-blue-100/80">
                PRISM connects consumers, linemen and supervisors in one system, so your cooperative can
                respond faster and every member knows what is happening with their report.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  href="/supervisor/register"
                  className={`inline-flex items-center gap-2 rounded-xl bg-amber-400 px-6 py-3 text-sm font-bold text-[#071B3A] shadow-lg shadow-amber-400/20 transition-colors hover:bg-amber-300 ${FOCUS_DARK}`}
                >
                  Register your cooperative
                  <Icon name="arrow" className="h-4 w-4" />
                </Link>
                <Link
                  href="/supervisor/login"
                  className={`rounded-xl border border-white/25 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-white/10 ${FOCUS_DARK}`}
                >
                  Supervisor log in
                </Link>
              </div>
              <div className="mt-6">
                <AvailabilityChips dark />
              </div>
            </div>

            <HeroPreview />
          </div>
        </section>

        {/* Problem / evidence */}
        <section
          id="problem"
          aria-labelledby="problem-title"
          className="scroll-mt-16 border-b border-gray-200 bg-white"
        >
          <div className="mx-auto grid max-w-6xl gap-12 px-4 py-20 sm:px-6 lg:grid-cols-12 lg:py-28">
            <div className="lg:col-span-5">
              <SectionHeading
                id="problem-title"
                eyebrow="WHY PRISM"
                title="Repairs are not the problem. Silence is."
                text="In the survey, about two-thirds of consumers who reported an outage saw it resolved within two hours. What frustrated them was not knowing what happened in between."
              />
              <div className="mt-8 inline-flex items-center gap-3 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3">
                <span className="font-display text-2xl font-extrabold text-blue-700">48</span>
                <p className="text-xs leading-snug text-gray-500">
                  respondents from the CASURECO I and
                  <br />
                  CASURECO II service areas
                </p>
              </div>
            </div>

            <dl className="grid gap-4 sm:grid-cols-2 lg:col-span-7">
              {STATS.map((s, i) => {
                const dark = i === 3;
                return (
                  <div
                    key={s.value}
                    className={`flex flex-col rounded-2xl border p-6 shadow-sm ${
                      dark ? "border-[#071B3A] bg-[#071B3A]" : "border-gray-200 bg-white"
                    }`}
                  >
                    <dt
                      className={`font-display text-5xl font-extrabold tracking-tight ${
                        dark ? "text-amber-300" : "text-blue-700"
                      }`}
                    >
                      {s.value}
                    </dt>
                    <dd className={`mt-3 text-sm leading-relaxed ${dark ? "text-blue-100/80" : "text-gray-600"}`}>
                      {s.label}
                    </dd>
                    <div
                      aria-hidden="true"
                      className={`mt-auto h-1.5 rounded-full ${dark ? "bg-white/15" : "bg-gray-100"}`}
                      style={{ marginTop: "1.5rem" }}
                    >
                      <div
                        className={`h-1.5 rounded-full ${dark ? "bg-amber-300" : "bg-blue-600"}`}
                        style={{ width: `${s.pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </dl>
          </div>
        </section>

        {/* Features */}
        <section id="features" aria-labelledby="features-title" className="scroll-mt-16">
          <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 lg:py-28">
            <SectionHeading
              id="features-title"
              eyebrow="FEATURES"
              title="Everything the outage workflow needs"
              text="From the first report to the final approval, in one place."
              className="mb-14"
            />

            <div className="space-y-14">
              {/* 01 */}
              <div>
                <GroupHeader group={GROUPS[0]} />
                <div className="grid gap-4 lg:grid-cols-3 lg:grid-rows-2">
                  <FeatureCard
                    feature={F.report}
                    visual={<ReportVisual />}
                    featured
                    className="lg:col-span-2 lg:row-span-2"
                  />
                  <FeatureCard feature={F.duplicate} visual={<DuplicateVisual />} />
                  <FeatureCard feature={F.tracking} visual={<TrackingVisual />} />
                </div>
              </div>

              {/* 02 */}
              <div>
                <GroupHeader group={GROUPS[1]} />
                <div className="grid gap-4 lg:grid-cols-3 lg:grid-rows-2">
                  <FeatureCard
                    feature={F.dispatch}
                    visual={<DispatchVisual />}
                    featured
                    className="lg:col-span-2 lg:col-start-2 lg:row-span-2 lg:row-start-1"
                  />
                  <FeatureCard feature={F.routing} visual={<RoutingVisual />} className="lg:col-start-1" />
                  <FeatureCard feature={F.monitoring} visual={<MonitoringVisual />} className="lg:col-start-1" />
                </div>
              </div>

              {/* 03 */}
              <div>
                <GroupHeader group={GROUPS[2]} />
                <div className="grid gap-4 lg:grid-cols-3">
                  <FeatureCard feature={F.qa} visual={<QAVisual />} featured row className="lg:col-span-2" />
                  <FeatureCard feature={F.advisories} visual={<AdvisoryVisual />} />
                  <FeatureCard feature={F.analytics} visual={<AnalyticsVisual />} row className="lg:col-span-3" />
                </div>
              </div>
            </div>

            <div className="mt-14 rounded-2xl border border-gray-200 bg-white p-6">
              <p className="mb-4 text-xs font-bold tracking-wide text-gray-400">ALSO INCLUDED</p>
              <ul className="flex flex-wrap gap-2">
                {ALSO.map((a) => (
                  <li
                    key={a}
                    className="flex items-center gap-2 rounded-full border border-gray-200 bg-gray-50 px-3.5 py-1.5 text-xs font-medium text-gray-700"
                  >
                    <span className="h-1.5 w-1.5 rounded-full bg-blue-600" aria-hidden="true" />
                    {a}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* How it works */}
        <section
          id="how"
          aria-labelledby="how-title"
          className="scroll-mt-16 border-y border-gray-200 bg-white"
        >
          <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 lg:py-28">
            <SectionHeading
              id="how-title"
              eyebrow="HOW IT WORKS"
              title="From report to restoration"
              text="One connected workflow across the mobile app and the web dashboard."
              className="mb-14"
            />

            <ol className="relative grid gap-10 lg:grid-cols-4 lg:gap-6">
              <span
                aria-hidden="true"
                className="absolute bottom-6 left-5 top-6 w-px bg-gray-200 lg:bottom-auto lg:left-5 lg:right-5 lg:top-5 lg:h-px lg:w-auto"
              />
              {STEPS.map((s) => (
                <li key={s.n} className="relative pl-16 lg:pl-0 lg:pt-16">
                  <span className="font-display absolute left-0 top-0 flex h-10 w-10 items-center justify-center rounded-full bg-blue-700 text-sm font-extrabold text-white ring-8 ring-white">
                    {s.n}
                  </span>
                  <div className="rounded-2xl border border-gray-200 bg-gray-50 p-5 transition-colors hover:border-blue-200 hover:bg-white">
                    <div className="mb-3 flex items-center justify-between gap-2">
                      <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-blue-700">
                        <Icon name={s.icon} className="h-4 w-4" />
                      </span>
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-2.5 py-1 text-[11px] font-semibold text-gray-600 ring-1 ring-gray-200">
                        <Icon name={s.device === "Mobile app" ? "phone" : "monitor"} className="h-3 w-3" />
                        {s.device}
                      </span>
                    </div>
                    <h3 className="font-display text-base font-bold text-[#071B3A]">{s.title}</h3>
                    <p className="mt-1.5 text-sm leading-relaxed text-gray-600">{s.text}</p>
                    <ul className="mt-4 flex flex-wrap gap-1.5">
                      {s.tags.map((t) => (
                        <li key={t}>
                          <Chip tone={s.n === "4" && t.startsWith("Reject") ? "red" : s.n === "4" ? "green" : "gray"}>
                            {t}
                          </Chip>
                        </li>
                      ))}
                    </ul>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* Roles */}
        <section id="roles" aria-labelledby="roles-title" className="scroll-mt-16">
          <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 lg:py-28">
            <SectionHeading
              id="roles-title"
              eyebrow="BUILT FOR EVERYONE INVOLVED"
              title="One platform, three roles"
              text="Consumers and linemen work in the mobile app. Supervisors work in the web dashboard."
              className="mb-12"
            />

            <div className="grid gap-4 md:grid-cols-2">
              {/* Consumers */}
              <article className="flex flex-col overflow-hidden rounded-3xl border border-gray-200 bg-white">
                <div className="p-6 sm:p-8">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-2.5 py-1 text-xs font-bold text-blue-700">
                    <Icon name="phone" className="h-3 w-3" />
                    {ROLES[0].where}
                  </span>
                  <h3 className="font-display mt-4 text-2xl font-extrabold text-[#071B3A]">{ROLES[0].who}</h3>
                  <ul className="mt-4 space-y-2.5">
                    {ROLES[0].points.map((p) => (
                      <li key={p} className="flex items-start gap-2.5 text-sm text-gray-600">
                        <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-700">
                          <Icon name="tick" className="h-2.5 w-2.5" />
                        </span>
                        {p}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="mt-auto bg-[linear-gradient(180deg,#ffffff_0%,#EFF6FF_100%)] px-6 pt-8 sm:px-8">
                  <div className="h-72 overflow-hidden">
                    <ConsumerPhone />
                  </div>
                </div>
              </article>

              {/* Linemen */}
              <article className="flex flex-col overflow-hidden rounded-3xl border border-[#071B3A] bg-[#071B3A]">
                <div className="p-6 sm:p-8">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-2.5 py-1 text-xs font-bold text-amber-300">
                    <Icon name="phone" className="h-3 w-3" />
                    {ROLES[1].where}
                  </span>
                  <h3 className="font-display mt-4 text-2xl font-extrabold text-white">{ROLES[1].who}</h3>
                  <ul className="mt-4 space-y-2.5">
                    {ROLES[1].points.map((p) => (
                      <li key={p} className="flex items-start gap-2.5 text-sm text-blue-100/80">
                        <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-amber-300/20 text-amber-300">
                          <Icon name="tick" className="h-2.5 w-2.5" />
                        </span>
                        {p}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="mt-auto px-6 pt-8 sm:px-8">
                  <div className="h-72 overflow-hidden">
                    <LinemanPhone />
                  </div>
                </div>
              </article>

              {/* Supervisors */}
              <article className="overflow-hidden rounded-3xl border border-gray-200 bg-[linear-gradient(135deg,#EFF6FF_0%,#ffffff_55%)] md:col-span-2">
                <div className="grid items-center gap-8 p-6 sm:p-8 lg:grid-cols-[0.8fr_1.2fr]">
                  <div>
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-100 px-2.5 py-1 text-xs font-bold text-blue-700">
                      <Icon name="monitor" className="h-3 w-3" />
                      {ROLES[2].where}
                    </span>
                    <h3 className="font-display mt-4 text-2xl font-extrabold text-[#071B3A]">{ROLES[2].who}</h3>
                    <ul className="mt-4 space-y-2.5">
                      {ROLES[2].points.map((p) => (
                        <li key={p} className="flex items-start gap-2.5 text-sm text-gray-600">
                          <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-700">
                            <Icon name="tick" className="h-2.5 w-2.5" />
                          </span>
                          {p}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <SupervisorMock />
                </div>
              </article>
            </div>
            <p className="mt-4 text-center text-xs text-gray-400">
              Interface previews are illustrative and use sample data.
            </p>
          </div>
        </section>

        {/* FAQ */}
        <section
          id="faq"
          aria-labelledby="faq-title"
          className="scroll-mt-16 border-y border-gray-200 bg-white"
        >
          <div className="mx-auto grid max-w-6xl gap-12 px-4 py-20 sm:px-6 lg:grid-cols-12 lg:py-28">
            <div className="lg:col-span-4">
              <SectionHeading id="faq-title" eyebrow="FAQ" title="Common questions" />
              <div className="mt-8 rounded-2xl border border-gray-200 bg-gray-50 p-5">
                <p className="text-sm font-semibold text-[#071B3A]">Still have questions?</p>
                <p className="mt-1 text-sm text-gray-500">Send us a message and we will get back to you.</p>
                <a
                  href="mailto:prismsupport01@gmail.com"
                  className={`mt-3 inline-flex items-center gap-2 rounded-lg text-sm font-semibold text-blue-700 hover:underline ${FOCUS}`}
                >
                  <Icon name="mail" className="h-4 w-4" />
                  prismsupport01@gmail.com
                </a>
              </div>
            </div>

            <div className="space-y-3 lg:col-span-8">
              {FAQS.map((f, i) => (
                <details
                  key={f.q}
                  open={i === 0}
                  className="group rounded-2xl border border-gray-200 bg-white transition-colors open:border-blue-200 open:bg-blue-50/30"
                >
                  <summary
                    className={`flex cursor-pointer list-none items-center justify-between gap-4 rounded-2xl px-5 py-4 text-sm font-semibold text-[#071B3A] sm:text-base [&::-webkit-details-marker]:hidden ${FOCUS}`}
                  >
                    {f.q}
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gray-100 text-gray-500 transition-transform group-open:rotate-180 group-open:bg-blue-700 group-open:text-white motion-safe:duration-200">
                      <Icon name="chevron" className="h-4 w-4" />
                    </span>
                  </summary>
                  <p className="px-5 pb-5 pr-14 text-sm leading-relaxed text-gray-600">{f.a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* Download + CTA */}
        <section id="download" aria-labelledby="download-title" className="scroll-mt-16">
          <div className="mx-auto max-w-6xl space-y-6 px-4 py-20 sm:px-6 lg:py-28">
            <div className="grid items-center gap-8 rounded-3xl border border-gray-200 bg-white p-8 shadow-sm sm:p-10 md:grid-cols-[1fr_auto]">
              <div>
                <p className="flex items-center gap-3 text-xs font-bold tracking-wide text-blue-700">
                  <span className="h-px w-8 bg-blue-700" aria-hidden="true" />
                  MOBILE APP
                </p>
                <h2
                  id="download-title"
                  className="font-display mt-3 text-2xl font-extrabold tracking-tight text-[#071B3A] sm:text-3xl"
                >
                  {APK_URL ? "Get the PRISM app for Android" : "The PRISM Android app is coming soon"}
                </h2>
                <p className="mt-3 max-w-xl text-sm leading-relaxed text-gray-600">
                  Consumers use it to report outages and follow repairs. Linemen use it to receive job
                  orders and submit proof of completion.
                  {!APK_URL && " Supervisors can already register and use the web dashboard."}
                </p>

                {APK_URL ? (
                  <>
                    <ol className="mt-4 list-decimal space-y-1 pl-5 text-sm text-gray-600">
                      <li>Download the APK file to your Android phone.</li>
                      <li>Open it. If asked, allow installs from this source in your phone settings.</li>
                      <li>Install, open PRISM and sign in or register.</li>
                    </ol>
                    <p className="mt-3 text-xs text-gray-400">
                      The app is installed directly from this page, not from the Play Store.
                    </p>
                    <a
                      href={APK_URL}
                      download
                      className={`mt-6 inline-flex items-center gap-2 rounded-xl bg-blue-700 px-6 py-3 text-sm font-bold text-white transition-colors hover:bg-blue-800 ${FOCUS}`}
                    >
                      Download for Android (.apk)
                    </a>
                  </>
                ) : (
                  <div className="mt-6">
                    <AvailabilityChips />
                  </div>
                )}
              </div>

              <div aria-hidden="true" className="hidden md:block">
                <Phone className="w-40">
                  <div className="flex h-56 flex-col items-center justify-center gap-3 px-4 text-center">
                    <img src="/brand/mascot-sm.png" alt="" className="h-16 w-auto" />
                    <p className="font-display text-sm font-extrabold text-blue-900">PRISM</p>
                    {!APK_URL && <Chip tone="amber">Coming soon</Chip>}
                  </div>
                </Phone>
              </div>
            </div>

            {/* Final CTA */}
            <div className="relative overflow-hidden rounded-3xl bg-[#071B3A] px-6 py-14 sm:px-12">
              <div
                className="pointer-events-none absolute inset-0"
                aria-hidden="true"
                style={{
                  backgroundImage:
                    "linear-gradient(rgba(255,255,255,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.06) 1px, transparent 1px)",
                  backgroundSize: "48px 48px",
                  maskImage: "radial-gradient(ellipse at 80% 50%, black 20%, transparent 75%)",
                  WebkitMaskImage: "radial-gradient(ellipse at 80% 50%, black 20%, transparent 75%)",
                }}
              />
              <div className="relative flex flex-col items-center gap-8 text-center lg:flex-row lg:justify-between lg:text-left">
                <div className="max-w-xl">
                  <h2 className="font-display text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
                    Ready to bring your cooperative on board?
                  </h2>
                  <p className="mt-3 text-sm leading-relaxed text-blue-100/80">
                    Registrations are reviewed by the PRISM administrator. You can log in once yours is approved.
                  </p>
                  <div className="mt-7 flex flex-wrap justify-center gap-3 lg:justify-start">
                    <Link
                      href="/supervisor/register"
                      className={`inline-flex items-center gap-2 rounded-xl bg-amber-400 px-6 py-3 text-sm font-bold text-[#071B3A] transition-colors hover:bg-amber-300 ${FOCUS_DARK}`}
                    >
                      Register your cooperative
                      <Icon name="arrow" className="h-4 w-4" />
                    </Link>
                    <Link
                      href="/supervisor/login"
                      className={`rounded-xl border border-white/25 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-white/10 ${FOCUS_DARK}`}
                    >
                      Log in
                    </Link>
                  </div>
                </div>
                <img
                  src="/brand/mascot.png"
                  alt=""
                  className="hidden w-40 shrink-0 drop-shadow-2xl lg:block"
                />
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-[#071B3A] text-blue-100/80">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-12">
          <div className="md:col-span-5">
            <Logo onDark subtitle="OUTAGE MANAGEMENT" />
            <p className="mt-4 max-w-sm text-sm leading-relaxed">
              PRISM · Power Reporting and Integrated System Management. One system for outage reporting,
              dispatch, field operations and member communication.
            </p>
          </div>

          <nav aria-label="Product" className="md:col-span-2 md:col-start-7">
            <p className="text-xs font-bold tracking-wide text-white">PRODUCT</p>
            <ul className="mt-4 space-y-2.5 text-sm">
              {[
                ["#problem", "Why PRISM"],
                ["#features", "Features"],
                ["#how", "How it works"],
                ["#roles", "User roles"],
              ].map(([href, label]) => (
                <li key={href}>
                  <a href={href} className={`rounded transition-colors hover:text-white ${FOCUS_DARK}`}>
                    {label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          <nav aria-label="Get started" className="md:col-span-2">
            <p className="text-xs font-bold tracking-wide text-white">GET STARTED</p>
            <ul className="mt-4 space-y-2.5 text-sm">
              <li>
                <Link href="/supervisor/register" className={`rounded transition-colors hover:text-white ${FOCUS_DARK}`}>
                  Register
                </Link>
              </li>
              <li>
                <Link href="/supervisor/login" className={`rounded transition-colors hover:text-white ${FOCUS_DARK}`}>
                  Supervisor log in
                </Link>
              </li>
              <li>
                <a href="#faq" className={`rounded transition-colors hover:text-white ${FOCUS_DARK}`}>
                  FAQ
                </a>
              </li>
              <li>
                <a href="#download" className={`rounded transition-colors hover:text-white ${FOCUS_DARK}`}>
                  Mobile app
                </a>
              </li>
            </ul>
          </nav>

          <div className="md:col-span-3 lg:col-span-2">
            <p className="text-xs font-bold tracking-wide text-white">CONTACT</p>
            <a
              href="mailto:prismsupport01@gmail.com"
              className={`mt-4 inline-block break-all rounded text-sm font-medium text-amber-300 hover:underline ${FOCUS_DARK}`}
            >
              prismsupport01@gmail.com
            </a>
          </div>
        </div>
        <div className="border-t border-white/10">
          <div className="mx-auto max-w-6xl px-4 py-5 text-xs text-blue-200/60 sm:px-6">
            PRISM · Power Reporting and Integrated System Management
          </div>
        </div>
      </footer>
    </div>
  );
}