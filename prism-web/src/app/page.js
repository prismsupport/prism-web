import Link from "next/link";
import Logo from "@/components/ui/Logo";
import MobileNav from "@/components/landing/MobileNav";
import ActionLink from "@/components/landing/ActionLink";
import ProcessFlow from "@/components/landing/ProcessFlow";

export const metadata = {
  title: { absolute: "PRISM" },
  description:
    "PRISM connects consumers, linemen and supervisors in one system: GPS-tagged outage reports, duplicate detection, smart dispatch, QA review and targeted advisories.",
  openGraph: {
    title: "PRISM: Outage reporting and dispatch for electric cooperatives",
    description:
      "Report, dispatch, repair and keep every member informed, in one connected workflow.",
    type: "website",
  },
};

// One place to edit on every release. Set url to "" to show the "coming soon" state.
const APK = {
  url: "https://github.com/prismsupport/prism-web/releases/download/android-v1.3.0/prism-android-v1.3.0.apk",
  version: "1.3.0",
  size: "140.8 MB",
  minAndroid: "Android 7.0+",
};
const APK_URL = APK.url;

// PAGE WIDTH: edit this one line to resize every section.
// max-w-6xl = 72rem (original) · max-w-7xl = 80rem · 84rem (now) · 100rem (too wide)
const WRAP = "mx-auto w-full max-w-[84rem] px-4 sm:px-6 lg:px-8";

const YEAR = new Date().getFullYear();

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

const STATS = [
  { value: "62.5%", pct: 62.5, label: "agree there is a gap between what the cooperative knows and what consumers are told" },
  { value: "70.8%", pct: 70.8, label: "have had to contact the cooperative themselves just to get an update" },
  { value: "55.6%", pct: 55.6, label: "of those who reported an outage did not get consistent updates afterward" },
  { value: "93.8%", pct: 93.8, label: "said an app to report and track outages would be useful" },
];

const GROUPS = [
  { n: "01", title: "Reporting and Detection", text: "Capture accurate reports and spot the ones that belong together." },
  { n: "02", title: "Dispatch and Field Operations", text: "Get the right crew to the right place, and keep an eye on the clock." },
  { n: "03", title: "Management and Communication", text: "Verify repairs, keep members informed, and measure performance." },
];

const F = {
  report: {
    title: "GPS-tagged reports",
    text: "Consumers pin the exact location, pick a concern category, attach a photo or video, and get a ticket number right away. Available in English and Filipino.",
    icon: "pin",
    surface: "mobile",
  },
  duplicate: {
    title: "Smart Duplicate detection",
    text: "Related reports are scored and suggested for merging into one Master Ticket, so crews are not sent to the same fault twice.",
    icon: "copy",
    surface: "web",
  },
  tracking: {
    title: "Live ticket tracking",
    text: "Every status change reaches the consumer by push notification, from Pending to Resolved, including a rating and reopen option.",
    icon: "bell",
    surface: "mobile",
  },
  dispatch: {
    title: "Smart dispatch",
    text: "Linemen are ranked by availability, area office, distance and workload, with the score breakdown visible. You make the final call.",
    icon: "bolt",
    surface: "web",
  },
  routing: {
    title: "Turn-by-turn routing",
    text: "Linemen get job orders on their phone and a route to the outage site, instead of asking residents for directions.",
    icon: "route",
    surface: "mobile",
  },
  monitoring: {
    title: "Response monitoring",
    text: "Tickets left unassigned past your threshold are flagged, and supervisors are alerted once per ticket.",
    icon: "clock",
    surface: "web",
  },
  qa: {
    title: "QA before closing",
    text: "Repair photos, video, voice notes and a completion checklist are reviewed by a supervisor before a ticket is resolved.",
    icon: "check",
    surface: "web",
  },
  advisories: {
    title: "Targeted advisories",
    text: "Publish maintenance and interruption notices to a feeder, municipality, barangay or the whole cooperative. Only affected members are notified.",
    icon: "megaphone",
    surface: "web",
  },
  analytics: {
    title: "Service analytics",
    text: "Response and repair times, time per stage, recurring issues and lineman ratings, with Excel and PDF export.",
    icon: "chart",
    surface: "web",
  },
};

const ALSO = [
  { icon: "receipt", title: "Read-only bill inquiry", text: "Consumers view their bills in the app, pulled from your billing system. No payments, no changes." },
  { icon: "chat", title: "FAQ chatbot (EN + TL)", text: "Answers common questions in English or Filipino. Unanswered ones go to a supervisor." },
  { icon: "phone", title: "Offline report saving", text: "Reports filed without signal are saved on the phone and sent when the connection returns." },
  { icon: "clock", title: "Office hours and hotlines", text: "Accept new reports only during set hours. Outside them, consumers see their area office hotline." },
  { icon: "list", title: "Custom status names", text: "Rename ticket statuses and job steps to the terms your cooperative already uses." },
  { icon: "sliders", title: "Custom priority levels", text: "Define your own 2 to 6 priority levels, from lowest to highest." },
  { icon: "users", title: "Duty schedules and on-call", text: "Set each lineman's shifts, with an on-call override for emergencies. Dispatch uses it." },
  { icon: "lock", title: "Module-level supervisor access", text: "The Owner chooses which areas each supervisor can open: Dispatch, Advisories or FAQ." },
  { icon: "archive", title: "Archive and restore", text: "Advisories, FAQ entries and service areas are archived, not deleted, and can be restored." },
];

const STEPS = [
  {
    n: "1",
    title: "Consumer reports",
    text: "A member files an outage report from the mobile app and gets a ticket number.",
    device: "Mobile app",
    icon: "pin",
    tags: [["Location", "gray"], ["Photo or video", "gray"]],
  },
  {
    n: "2",
    title: "Supervisor dispatches",
    text: "Duplicate reports are grouped and the best-matched lineman is assigned.",
    device: "Web dashboard",
    icon: "bolt",
    tags: [["Master Ticket", "gray"], ["Lineman ranking", "gray"]],
  },
  {
    n: "3",
    title: "Lineman repairs",
    text: "The crew is routed to the site, repairs, and uploads proof of completion.",
    device: "Mobile app",
    icon: "route",
    tags: [["Route", "gray"], ["Proof of completion", "gray"]],
  },
  {
    n: "4",
    title: "Supervisor reviews and approves",
    text: "The supervisor reviews the proof in QA and approves or rejects it. Once approved, the ticket is resolved and the consumer is notified and can rate the job.",
    device: "Web dashboard",
    icon: "check",
    tags: [["Approve", "green"], ["Reject with remarks", "red"]],
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
  pin: (<><path d="M12 22s7-6.2 7-12a7 7 0 1 0-14 0c0 5.8 7 12 7 12Z" /><circle cx="12" cy="10" r="2.5" /></>),
  copy: (<><rect x="8" y="8" width="12" height="12" rx="2" /><path d="M4 16V6a2 2 0 0 1 2-2h10" /></>),
  bolt: <path d="M13 2 3 14h7l-1 8 11-14h-7l1-6Z" />,
  route: <path d="m3 11 19-9-9 19-2-8-8-2Z" />,
  check: (<><circle cx="12" cy="12" r="10" /><path d="m9 12 2 2 4-4" /></>),
  tick: <path d="m5 13 4 4L19 7" />,
  megaphone: (<><path d="m3 11 18-5v12L3 14v-3z" /><path d="M11.6 16.8a3 3 0 1 1-5.8-1.6" /></>),
  bell: (<><path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.7 21a2 2 0 0 1-3.4 0" /></>),
  clock: (<><circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" /></>),
  chart: (<><path d="M3 3v18h18" /><path d="M7 16v-5" /><path d="M12 16V7" /><path d="M17 16v-3" /></>),
  phone: (<><rect x="7" y="2" width="10" height="20" rx="2" /><path d="M11 18h2" /></>),
  monitor: (<><rect x="3" y="4" width="18" height="12" rx="2" /><path d="M8 20h8" /><path d="M12 16v4" /></>),
  grid: (<><rect width="7" height="9" x="3" y="3" rx="1" /><rect width="7" height="5" x="14" y="3" rx="1" /><rect width="7" height="9" x="14" y="12" rx="1" /><rect width="7" height="5" x="3" y="16" rx="1" /></>),
  clipboard: (<><rect width="8" height="4" x="8" y="2" rx="1" /><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" /></>),
  users: (<><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.9" /><path d="M16 3.1a4 4 0 0 1 0 7.8" /></>),
  image: (<><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="9" cy="9" r="2" /><path d="m21 15-5-5L5 21" /></>),
  arrow: (<><path d="M5 12h14" /><path d="m12 5 7 7-7 7" /></>),
  arrowLeft: (<><path d="M19 12H5" /><path d="m12 19-7-7 7-7" /></>),
  arrowUp: (<><path d="M12 19V5" /><path d="m5 12 7-7 7 7" /></>),
  chevron: <path d="m6 9 6 6 6-6" />,
  mail: (<><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m3 7 9 6 9-6" /></>),
  home: <path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1Z" />,
  list: (<><path d="M8 6h13" /><path d="M8 12h13" /><path d="M8 18h13" /><path d="M3 6h.01" /><path d="M3 12h.01" /><path d="M3 18h.01" /></>),
  receipt: (<><path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1Z" /><path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8" /></>),
  chat: <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2Z" />,
  user: (<><circle cx="12" cy="8" r="4" /><path d="M4 21v-1a6 6 0 0 1 6-6h4a6 6 0 0 1 6 6v1" /></>),
  history: (<><path d="M3 12a9 9 0 1 0 3-6.7L3 8" /><path d="M3 3v5h5" /><path d="M12 7v5l3 2" /></>),
  search: (<><circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" /></>),
  building: (<><path d="M3 21h18" /><path d="M5 21V5l7-3 7 3v16" /><path d="M9 9h1" /><path d="M14 9h1" /><path d="M9 21v-4h6v4" /></>),
  help: (<><circle cx="12" cy="12" r="10" /><path d="M9.1 9a3 3 0 0 1 5.8 1c0 2-3 3-3 3" /><path d="M12 17h.01" /></>),
  play: <path d="m7 4 13 8-13 8Z" />,
  briefcase: (<><rect x="3" y="7" width="18" height="13" rx="2" /><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /><path d="M3 13h18" /></>),
  filePlus: (<><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><path d="M14 2v6h6" /><path d="M12 12v6" /><path d="M9 15h6" /></>),
  wallet: (<><rect x="2" y="6" width="20" height="14" rx="2" /><path d="M2 10h20" /><path d="M16 14h2" /></>),
  volume: (<><path d="M11 5 6 9H2v6h4l5 4z" /><path d="M15.5 8.5a5 5 0 0 1 0 7" /></>),
  calendar: (<><rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4" /><path d="M8 2v4" /><path d="M3 10h18" /></>),
  warning: (<><path d="m10.3 3.9-8.4 14.5A2 2 0 0 0 3.6 21h16.8a2 2 0 0 0 1.7-2.6L13.7 3.9a2 2 0 0 0-3.4 0Z" /><path d="M12 9v4" /><path d="M12 17h.01" /></>),
  sliders: (<><path d="M4 21v-7" /><path d="M4 10V3" /><path d="M12 21v-9" /><path d="M12 8V3" /><path d="M20 21v-5" /><path d="M20 12V3" /><path d="M1 14h6" /><path d="M9 8h6" /><path d="M17 16h6" /></>),
  lock: (<><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></>),
  archive: (<><rect x="2" y="3" width="20" height="5" rx="1" /><path d="M4 8v11a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8" /><path d="M10 12h4" /></>),
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
  purple: "bg-purple-50 text-purple-700 ring-purple-200",
  solid: "bg-red-600 text-white ring-red-600",
};

function Chip({ tone = "gray", dot = false, children, className = "" }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1 ring-inset ${CHIP_TONES[tone]} ${className}`}
    >
      {dot && <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden="true" />}
      {children}
    </span>
  );
}

function SectionHeading({ id, eyebrow, title, text, className = "" }) {
  return (
    <div className={`max-w-none ${className}`}>
      <p className="flex items-center gap-3 text-xs font-bold tracking-wide text-blue-700">
        <span className="h-px w-8 bg-blue-700" aria-hidden="true" />
        {eyebrow}
      </p>
      <h2 id={id} className="font-display mt-3 text-3xl font-extrabold tracking-tight text-[#022b67] sm:text-4xl">
        {title}
      </h2>
      {text && <p className="mt-3 text-base leading-relaxed text-gray-500">{text}</p>}
    </div>
  );
}

function AvailabilityChips({ dark = false }) {
  const base = `inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-xs font-medium ${
    dark ? "border-white/15 bg-white/5 text-blue-100" : "border-gray-200 bg-white text-gray-600"
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
          <ActionLink
            href={APK_URL}
            download
            doneLabel="Download started"
            className={`${base} hover:bg-white/10 ${dark ? FOCUS_DARK : FOCUS}`}
          >
            <Icon name="phone" className="h-3.5 w-3.5" />
            Download Android app v{APK.version}
          </ActionLink>
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
/* Interface previews: shared pieces                                          */
/* All previews are illustrative and use placeholder data.                    */
/* -------------------------------------------------------------------------- */

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

/* -------------------------------------------------------------------------- */
/* Web (Supervisor portal) previews                                           */
/* -------------------------------------------------------------------------- */

const SIDEBAR = [
  { group: "Operations", items: [["grid", "Dashboard"], ["clipboard", "Dispatch"], ["chart", "Reports"]] },
  { group: "Communication", items: [["megaphone", "Advisories"], ["help", "FAQ"]] },
  { group: "Setup", items: [["building", "Service Areas"], ["receipt", "Billing Integration"], ["users", "Users"]] },
];

function SupervisorShell({ active, url, children, className = "" }) {
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

function DispatchBoard() {
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

function DashboardBody({ attention = true }) {
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

function RecommendPanel() {
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

function DuplicateReview() {
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

function AlertsMock() {
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

function QAPanel() {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <p className="text-xs font-bold text-gray-900">Quality Assurance Review</p>
      <div className="mt-3 grid grid-cols-2 gap-2 rounded-lg bg-gray-50 p-2.5 text-[10px]">
        <div>
          <p className="text-[9px] text-gray-400">Category</p>
          <p className="font-medium text-gray-900">Damaged Power Lines</p>
        </div>
        <div>
          <p className="mb-0.5 text-[9px] text-gray-400">Consumer evidence location</p>
          <Chip tone="green">Location Consistent</Chip>
        </div>
      </div>
      <div className="mt-3 space-y-2.5 text-[10px]">
        <div>
          <p className="mb-1 text-[9px] text-gray-400">Proof of Completion Photo</p>
          <div className="flex h-16 items-center justify-center rounded-lg border border-gray-200 bg-gray-100 text-gray-400">
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

function AdvisoryPanel() {
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
        {field("Category", "Power Interruption")}
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
function ExportVisual() {
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

/* -------------------------------------------------------------------------- */
/* Mobile app previews (modelled on the real screens)                         */
/* -------------------------------------------------------------------------- */

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

function ConsumerHome() {
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

function ConsumerLocation() {
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

function ConsumerTracking({ width }) {
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

function LinemanJobs() {
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

function LinemanNav() {
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

/* -------------------------------------------------------------------------- */
/* Hero preview                                                               */
/* -------------------------------------------------------------------------- */

function HeroPreview() {
  return (
    <figure className="mx-auto w-full max-w-3xl">
      <div className="relative pb-6 lg:pb-0" aria-hidden="true">
        <SupervisorShell url="Supervisor portal · Dispatch" active="Dispatch">
          <DispatchBoard />
        </SupervisorShell>

        <div className="absolute -bottom-10 -left-4 hidden md:block xl:-left-12">
          <div className="h-64 overflow-hidden rounded-[1.75rem]">
            <ConsumerTracking width="w-48" />
          </div>
        </div>


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
      <figcaption className="mt-12 text-center text-[11px] text-blue-200/70 md:mt-14">
        Illustrative interface preview. Placeholder data.
      </figcaption>
    </figure>
  );
}

/* -------------------------------------------------------------------------- */
/* Feature card + layout                                                      */
/* -------------------------------------------------------------------------- */

function SurfaceTag({ surface }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-white/80 px-2 py-0.5 text-[11px] font-semibold text-gray-600 ring-1 ring-gray-200">
      <Icon name={surface === "web" ? "monitor" : "phone"} className="h-3 w-3" />
      {surface === "web" ? "Web dashboard" : "Mobile app"}
    </span>
  );
}

function FeatureCard({ feature, visual, featured = false, className = "" }) {
  return (
    <article
    className={`group flex h-fit min-w-0 flex-col self-start rounded-2xl border p-6 shadow-sm transition-[border-color,box-shadow] hover:border-blue-300 hover:shadow-md motion-safe:duration-200 ${
        featured ? "border-blue-100 bg-[linear-gradient(135deg,#EFF6FF_0%,#ffffff_60%)]" : "border-gray-200 bg-white"
      } ${className}`}
    >
      <div>
        <div className="mb-4 flex items-center justify-between gap-3">
          <span className={`flex h-10 w-10 items-center justify-center rounded-xl ${featured ? "bg-blue-700 text-white" : "bg-blue-50 text-blue-700"}`}>
            <Icon name={feature.icon} />
          </span>
          <SurfaceTag surface={feature.surface} />
        </div>
        <h4 className="font-display text-lg font-bold text-[#022b67]">{feature.title}</h4>
        <p className="mt-1.5 text-sm leading-relaxed text-gray-600">{feature.text}</p>
      </div>
      {visual && (
        <div aria-hidden="true" className="mt-6">
          {visual}
        </div>
      )}
    </article>
  );
}

function ExportFeature() {
  return (
    <article className="group grid min-w-0 gap-8 rounded-2xl border border-blue-100 bg-[linear-gradient(135deg,#EFF6FF_0%,#ffffff_60%)] p-6 shadow-sm transition-[border-color,box-shadow] hover:border-blue-300 hover:shadow-md motion-safe:duration-200 lg:col-span-2 lg:grid-cols-[0.8fr_1.2fr] lg:p-8">
      <div className="flex flex-col">
        <div className="mb-4 flex items-center justify-between gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-700 text-white">
            <Icon name={F.analytics.icon} />
          </span>
          <SurfaceTag surface="web" />
        </div>
        <h4 className="font-display text-lg font-bold text-[#022b67]">{F.analytics.title}</h4>
        <p className="mt-1.5 text-sm leading-relaxed text-gray-600">{F.analytics.text}</p>

        <p className="mt-6 inline-flex w-fit items-center gap-2 rounded-full bg-amber-100 px-3 py-1 text-[11px] font-bold tracking-wide text-amber-800">
          EXPORT YOUR REPORTS
        </p>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl border border-gray-200 bg-white p-4">
            <span className="rounded bg-green-600 px-1.5 py-0.5 text-[10px] font-bold text-white">XLSX</span>
            <p className="mt-2 text-sm font-bold text-[#022b67]">Excel (.xlsx)</p>
            <p className="mt-1 text-xs leading-relaxed text-gray-600">
              A summary sheet, one sheet per report section, and a Tickets sheet with one row per report.
            </p>
          </div>
          <div className="rounded-xl border border-gray-200 bg-white p-4">
            <span className="rounded bg-red-600 px-1.5 py-0.5 text-[10px] font-bold text-white">PDF</span>
            <p className="mt-2 text-sm font-bold text-[#022b67]">PDF (.pdf)</p>
            <p className="mt-1 text-xs leading-relaxed text-gray-600">
              A print-ready report with a header, key findings, charts, tables and page numbers.
            </p>
          </div>
        </div>
        <p className="mt-4 text-xs leading-relaxed text-gray-500">
          Choose the period and location first, and optionally compare with the previous period.
        </p>
      </div>
      <div aria-hidden="true">
        <ExportVisual />
      </div>
    </article>
  );
}

function GroupHeader({ group }) {
  return (
    <div className="mb-6 flex flex-wrap items-baseline gap-x-4 gap-y-1 border-t border-gray-200 pt-6">
      <span className="font-display text-sm font-bold text-blue-700">{group.n}</span>
      <h3 className="font-display text-xl font-bold text-[#022b67]">{group.title}</h3>
      <p className="text-sm text-gray-500 sm:ml-auto sm:text-right sm:whitespace-nowrap">
        {group.text}
      </p>
    </div>
  );
}

function RoleList({ points, dark = false }) {
  return (
    <ul className="mt-4 space-y-2.5">
      {points.map((p) => (
        <li key={p} className={`flex items-start gap-2.5 text-sm ${dark ? "text-blue-100/80" : "text-gray-600"}`}>
          <span className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full ${dark ? "bg-amber-300/20 text-amber-300" : "bg-blue-100 text-blue-700"}`}>
            <Icon name="tick" className="h-2.5 w-2.5" />
          </span>
          {p}
        </li>
      ))}
    </ul>
  );
}

/* -------------------------------------------------------------------------- */
/* Page                                                                       */
/* -------------------------------------------------------------------------- */

export default function Home() {
  return (
    <div id="top" className="landing-page min-h-screen overflow-x-clip bg-gray-50 text-gray-900">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-white focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-blue-700 focus:shadow-lg"
      >
        Skip to content
      </a>

      {/* Navigation */}
      <header className="sticky top-0 z-40 border-b border-gray-200/80 bg-white/85 backdrop-blur-md">
        <div className={`${WRAP} flex h-16 items-center justify-between gap-4`}>
          <a href="#top" aria-label="PRISM, back to top" className={`rounded-lg ${FOCUS}`}>
            <Logo subtitle="OUTAGE MANAGEMENT" />
          </a>

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
            <ActionLink
              href="/supervisor/login"
              className={`hidden rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700 sm:inline-flex sm:items-center sm:gap-2 ${FOCUS}`}
            >
              Log in
            </ActionLink>
            <ActionLink
              href="/supervisor/register"
              className={`inline-flex items-center gap-2 rounded-lg bg-blue-700 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-800 ${FOCUS}`}
            >
              Register
            </ActionLink>
            <MobileNav links={NAV} />
          </div>
        </div>
      </header>

      <main id="main">
        {/* Hero */}
        <section
          aria-labelledby="hero-title"
          className="relative overflow-hidden"
          style={{
            background: "linear-gradient(135deg, #022b67 0%, #021940 100%)",
          }}
        >
          {/* Dotted background - same as login page */}
          <div
            className="pointer-events-none absolute inset-0"
            aria-hidden="true"
            style={{
              backgroundImage:
                "radial-gradient(rgba(255,255,255,0.08) 1px, transparent 1px)",
              backgroundSize: "24px 24px",
            }}
          />

          {/* Blue glow - upper right */}
          <div className="pointer-events-none absolute -right-24 top-1/4 h-96 w-96 rounded-full bg-blue-500/25 blur-3xl" />

          {/* Amber glow - lower left */}
          <div className="pointer-events-none absolute -left-16 bottom-10 h-72 w-72 rounded-full bg-amber-300/10 blur-3xl" />

          <div className={`${WRAP} relative grid items-center gap-16 py-16 lg:grid-cols-[0.85fr_1.15fr] lg:py-24`}>
            <div>
              <p className="mb-5 inline-flex items-center gap-2 rounded-full border border-amber-300/30 bg-amber-300/10 px-3 py-1 text-xs font-bold tracking-wide text-amber-300">
                FOR ELECTRIC COOPERATIVES
              </p>

              <h1 id="hero-title" className="font-display text-[2rem] font-extrabold leading-[1.08] tracking-tight text-white sm:text-4xl xl:text-5xl">
                <span className="block">Outages reported.</span>
                <span className="block">Crews dispatched.</span>
                <span className="block text-amber-300">Power restored.</span>
              </h1>

              <p className="mt-5 max-w-lg text-base leading-relaxed text-blue-100/80 xl:text-md">
                PRISM connects consumers, linemen and supervisors in one system, so your cooperative can
                respond faster and every member knows what is happening with their report.
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                <ActionLink
                  href="/supervisor/register"
                  className={`inline-flex items-center gap-2 rounded-xl bg-amber-400 px-6 py-3 text-sm font-bold text-[#022b67] shadow-lg shadow-amber-400/20 hover:bg-amber-300 ${FOCUS_DARK}`}
                >
                  Register your cooperative
                  <Icon name="arrow" className="h-4 w-4" />
                </ActionLink>

                <ActionLink
                  href="/supervisor/login"
                  className={`inline-flex items-center gap-2 rounded-xl border border-white/25 px-6 py-3 text-sm font-semibold text-white hover:bg-white/10 ${FOCUS_DARK}`}
                >
                  Supervisor log in
                </ActionLink>
              </div>

              <div className="mt-6">
                <AvailabilityChips dark />
              </div>
            </div>

            <HeroPreview />
          </div>
        </section>
        {/* Problem / evidence */}
        <section id="problem" aria-labelledby="problem-title" className="scroll-mt-16 border-b border-gray-200 bg-white">
          <div className={`${WRAP} grid gap-12 py-20 lg:grid-cols-12 lg:py-28`}>
            <div className="lg:col-span-5">
              <SectionHeading
                id="problem-title"
                eyebrow="WHY PRISM"
                title="Repairs are not the problem. Silence is."
                text="In the survey, about two-thirds of consumers who reported an outage saw it resolved within two hours. What frustrated them was not knowing what happened in between."
              />
              <p className="mt-8 text-xs text-gray-400">Figures from the PRISM consumer survey.</p>
            </div>

            <dl className="grid gap-6 sm:grid-cols-2 lg:col-span-7">
              {STATS.map((s, i) => {
                const dark = i === 3;
                return (
                  <div
                    key={s.value}
                    className={`flex flex-col rounded-2xl border p-6 shadow-sm ${dark ? "border-[#022b67] bg-[linear-gradient(135deg,_#022b67_0%,_#021940_100%)]" : "border-gray-200 bg-white"}`}
                  >
                    <dt className={`font-display text-5xl font-extrabold tracking-tight ${dark ? "text-amber-300" : "text-blue-700"}`}>
                      {s.value}
                    </dt>
                    <dd className={`mt-3 text-sm leading-relaxed ${dark ? "text-blue-100/80" : "text-gray-600"}`}>{s.label}</dd>
                    <div aria-hidden="true" className={`mt-auto h-1.5 rounded-full ${dark ? "bg-white/15" : "bg-gray-100"}`}>
                      <div className={`h-1.5 rounded-full ${dark ? "bg-amber-300" : "bg-blue-600"}`} style={{ width: `${s.pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </dl>
          </div>
        </section>

        {/* Features */}
        <section id="features" aria-labelledby="features-title" className="scroll-mt-16">
          <div className={`${WRAP} py-20 lg:py-28`}>
            <SectionHeading
              id="features-title"
              eyebrow="FEATURES"
              title="Everything the outage workflow needs"
              text="From the first report to the final approval, in one place."
              className="mb-14"
            />

            <div className="space-y-16">
              {/* 01 */}
              <div>
                <GroupHeader group={GROUPS[0]} />
                <div className="grid items-start gap-6 lg:grid-cols-3">
                  <FeatureCard
                    feature={F.duplicate}
                    visual={<DuplicateReview />}
                    featured
                    className="lg:col-span-2 lg:row-span-2"
                  />
                  <FeatureCard feature={F.report} visual={<div className="h-60 overflow-hidden"><ConsumerLocation /></div>} />
                  <FeatureCard feature={F.tracking} visual={<div className="h-60 overflow-hidden"><ConsumerTracking /></div>} />
                </div>
              </div>

              {/* 02 */}
              <div>
                <GroupHeader group={GROUPS[1]} />
                <div className="grid items-start gap-6 lg:grid-cols-3">
                  <FeatureCard
                    feature={F.dispatch}
                    visual={<RecommendPanel />}
                    featured
                    className="lg:col-span-2 lg:col-start-2 lg:row-span-2 lg:row-start-1"
                  />
                  <FeatureCard feature={F.routing} visual={<div className="h-64 overflow-hidden"><LinemanNav /></div>} className="lg:col-start-1" />
                  <FeatureCard feature={F.monitoring} visual={<AlertsMock />} className="lg:col-start-1" />
                </div>
              </div>

              {/* 03 */}
              <div>
                <GroupHeader group={GROUPS[2]} />
                <div className="grid gap-6 lg:grid-cols-2">
                  <FeatureCard feature={F.qa} visual={<QAPanel />} />
                  <FeatureCard feature={F.advisories} visual={<AdvisoryPanel />} />
                  <ExportFeature />
                </div>
              </div>
            </div>

            <p className="mt-8 text-center text-xs text-gray-400">
              Interface previews are illustrative and use placeholder data.
            </p>

            {/* Also included */}
            <div className="mt-12">
              <div className="mb-6 flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
                <h3 className="font-display text-xl font-bold text-[#022b67]">Also included</h3>
                <p className="text-sm text-gray-500">The details that make day-to-day operations easier.</p>
              </div>
              <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {ALSO.map((a) => (
                  <li
                    key={a.title}
                    className="flex gap-4 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition-[border-color,box-shadow] hover:border-blue-200 hover:shadow-md motion-safe:duration-200"
                  >
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
                      <Icon name={a.icon} className="h-5 w-5" />
                    </span>
                    <div className="min-w-0">
                      <p className="font-display text-sm font-bold text-[#022b67]">{a.title}</p>
                      <p className="mt-1 text-sm leading-relaxed text-gray-600">{a.text}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* How it works */}
        <section id="how" aria-labelledby="how-title" className="scroll-mt-16 border-y border-gray-200 bg-white">
          <div className={`${WRAP} py-20 lg:py-28`}>
            <SectionHeading
              id="how-title"
              eyebrow="HOW IT WORKS"
              title="From report to restoration"
              text="One connected workflow across the mobile app and the web dashboard."
              className="mb-10"
            />
            <ProcessFlow
              steps={STEPS.map((s) => ({
                n: s.n,
                title: s.title,
                text: s.text,
                device: s.device,
                tags: s.tags,
                icon: <Icon name={s.icon} className="h-4 w-4" />,
                deviceIcon: <Icon name={s.device === "Mobile app" ? "phone" : "monitor"} className="h-3 w-3" />,
              }))}
            />
          </div>
        </section>

        {/* Roles */}
        <section id="roles" aria-labelledby="roles-title" className="scroll-mt-16">
          <div className={`${WRAP} py-20 lg:py-28`}>
            <SectionHeading
              id="roles-title"
              eyebrow="BUILT FOR EVERYONE INVOLVED"
              title="One platform, three roles"
              text="Consumers and linemen work in the mobile app. Supervisors work in the web dashboard."
              className="mb-12"
            />

            <div className="grid gap-6 md:grid-cols-2">

              {/* Consumers */}
              <article className="relative grid grid-cols-1 items-center gap-y-6 gap-x-8 overflow-hidden rounded-3xl border border-gray-200 bg-[radial-gradient(ellipse_at_bottom_right,_#DBEAFE_0%,_#FFFFFF_55%)] p-6 sm:grid-cols-2 sm:p-8">
                <div>
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-2.5 py-1 text-xs font-bold text-blue-700">
                    <Icon name="phone" className="h-3 w-3" />
                    {ROLES[0].where}
                  </span>
                  <h3 className="font-display mt-4 text-2xl font-extrabold text-[#022b67]">
                    {ROLES[0].who}
                  </h3>
                  <RoleList points={ROLES[0].points} />
                </div>

                <div className="flex justify-center overflow-hidden">
                  <div className="min-h-[28rem] flex items-start justify-center overflow-visible">
                    <ConsumerHome />
                  </div>
                </div>
              </article>

              {/* Linemen */}
              <article className="grid grid-cols-1 items-center gap-6 overflow-hidden rounded-3xl border border-gray-200 bg-[linear-gradient(135deg,#EFF6FF_0%,#ffffff_55%)] p-6 sm:grid-cols-2 sm:p-8">
                <div>
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-2.5 py-1 text-xs font-bold text-blue-700">
                    <Icon name="phone" className="h-3 w-3" />
                    {ROLES[1].where}
                  </span>
                  <h3 className="font-display mt-4 text-2xl font-extrabold text-[#022b67]">
                    {ROLES[1].who}
                  </h3>
                  <RoleList points={ROLES[1].points} />
                </div>

                <div className="flex justify-center overflow-hidden">
                  <div className="min-h-[28rem] flex items-start justify-center overflow-visible">
                    <LinemanJobs />
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
                    <h3 className="font-display mt-4 text-2xl font-extrabold text-[#022b67]">{ROLES[2].who}</h3>
                    <RoleList points={ROLES[2].points} />
                  </div>
                  <SupervisorShell url="Supervisor portal · Dashboard" active="Dashboard">
                    <DashboardBody />
                  </SupervisorShell>
                </div>
              </article>
            </div>
            <p className="mt-6 text-center text-xs text-gray-400">Interface previews are illustrative and use placeholder data.</p>
          </div>
        </section>

        {/* FAQ */}
        <section id="faq" aria-labelledby="faq-title" className="scroll-mt-16 border-y border-gray-200 bg-white">
          <div className={`${WRAP} grid gap-12 py-20 lg:grid-cols-12 lg:py-28`}>
            <div className="lg:col-span-4">
              <SectionHeading id="faq-title" eyebrow="FAQ" title="Common questions" />
              <div className="mt-8 rounded-2xl border border-gray-200 bg-gray-50 p-5">
                <p className="text-sm font-semibold text-[#022b67]">Still have questions?</p>
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
                  className="faq group rounded-2xl border border-gray-200 bg-white transition-colors open:border-blue-200 open:bg-blue-50/30"
                >
                  <summary
                    className={`flex cursor-pointer list-none items-center justify-between gap-4 rounded-2xl px-5 py-4 text-sm font-semibold text-[#022b67] transition-transform active:scale-[0.99] motion-reduce:active:scale-100 sm:text-base [&::-webkit-details-marker]:hidden ${FOCUS}`}
                  >
                    {f.q}
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gray-100 text-gray-500 transition-[transform,background-color,color] group-open:rotate-180 group-open:bg-blue-700 group-open:text-white motion-safe:duration-300">
                      <Icon name="chevron" className="h-4 w-4" />
                    </span>
                  </summary>
                  <div className="faq-body px-5 pb-5 pr-14">
                    <p className="text-sm leading-relaxed text-gray-600">{f.a}</p>
                  </div>
                </details>
              ))}
            </div>
          </div>
        </section>
        {/* Mobile App + Web Dashboard */}
        <section id="download" aria-labelledby="download-title" className="scroll-mt-16">
          <div className={`${WRAP} grid grid-cols-1 items-stretch gap-6 py-20 lg:grid-cols-2 lg:py-28`}>

            {/* Mobile App Card */}
            <div className="flex h-full flex-col rounded-3xl border border-gray-200 bg-white p-8 shadow-sm sm:p-10">
              <p className="flex items-center gap-3 text-xs font-bold tracking-wide text-blue-700">
                <span className="h-px w-8 bg-blue-700" aria-hidden="true" />
                MOBILE APP
              </p>

              <h2 id="download-title" className="font-display mt-3 text-2xl font-extrabold tracking-tight text-[#022b67] sm:text-3xl">
                {APK_URL ? "Get the PRISM app for Android" : "The PRISM Android app is coming soon"}
              </h2>

              <p className="mt-3 text-sm leading-relaxed text-gray-600">
                Consumers use it to report outages and follow repairs. Linemen use it to receive job
                orders and submit proof of completion.
              </p>

              {APK_URL ? (
                <>
                  <div className="mt-5 flex flex-wrap gap-2">
                    <Chip tone="blue">Version {APK.version}</Chip>
                    <Chip>{APK.size}</Chip>
                    <Chip>{APK.minAndroid}</Chip>
                  </div>

                  <ol className="mt-5 list-decimal space-y-1 pl-5 text-sm leading-relaxed text-gray-600">
                    <li>Download the APK file to your Android phone.</li>
                    <li>Open it. If asked, allow installs from this source in your phone settings.</li>
                    <li>Install, open PRISM and sign in or register.</li>
                  </ol>

                  <p className="mt-3 text-xs text-gray-400">
                    The app is installed directly from this page, not from the Play Store.
                  </p>

                  <div className="mt-auto pt-6">
                    <ActionLink
                      href={APK_URL}
                      download
                      doneLabel="Download started"
                      className={`inline-flex items-center gap-2 rounded-xl bg-blue-700 px-6 py-3 text-sm font-bold text-white hover:bg-blue-800 ${FOCUS}`}
                    >
                      <Icon name="phone" className="h-4 w-4" />
                      Download PRISM v{APK.version} (.apk)
                    </ActionLink>
                  </div>
                </>
              ) : (
                <div className="mt-auto pt-6">
                  <AvailabilityChips />
                </div>
              )}
            </div>

            {/* Web Dashboard Card */}
            <div className="flex h-full flex-col rounded-3xl border border-gray-200 bg-white p-8 shadow-sm sm:p-10">
              <p className="flex items-center gap-3 text-xs font-bold tracking-wide text-blue-700">
                <span className="h-px w-8 bg-blue-700" aria-hidden="true" />
                WEB DASHBOARD
              </p>

              <h2 className="font-display mt-3 text-2xl font-extrabold tracking-tight text-[#022b67] sm:text-3xl">
                Manage your cooperative with PRISM
              </h2>

              <p className="mt-3 text-sm leading-relaxed text-gray-600">
                Supervisors use the PRISM web dashboard to monitor outage reports, coordinate field
                operations, review completed repairs, and keep consumers informed.
              </p>

              <div className="mt-5 flex flex-wrap gap-2">
                <Chip tone="blue">For supervisors</Chip>
                <Chip tone="green">Web access available</Chip>
              </div>

              <ol className="mt-5 list-decimal space-y-1 pl-5 text-sm leading-relaxed text-gray-600">
                <li>Register your electric cooperative with PRISM.</li>
                <li>Wait for the PRISM administrator to review your registration.</li>
                <li>Once approved, log in to access your cooperative's dashboard.</li>
              </ol>

              <p className="mt-3 text-xs text-gray-400">
                Your cooperative registration must be approved before you can access the dashboard.
              </p>

              <div className="mt-auto flex flex-wrap gap-3 pt-6">
                <ActionLink
                  href="/supervisor/register"
                  className={`inline-flex items-center gap-2 rounded-xl bg-amber-400 px-6 py-3 text-sm font-bold text-[#022b67] shadow-lg shadow-amber-400/20 hover:bg-amber-300 ${FOCUS_DARK}`}
                  >
                  Register your cooperative
                  <Icon name="arrow" className="h-4 w-4" />
                </ActionLink>

                <ActionLink
                  href="/supervisor/login"
                  className={`inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-6 py-3 text-sm font-semibold text-[#022b67] hover:border-blue-200 hover:bg-blue-50 ${FOCUS}`}
                >
                  Log in
                </ActionLink>
              </div>
            </div>

          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-[linear-gradient(135deg,_#022b67_0%,_#021940_100%)] text-blue-100/80">
        <div className={`${WRAP} grid py-14 md:grid-cols-12`}>
          <div className="md:col-span-5">
            <a href="#top" aria-label="PRISM, back to top" className={`inline-block rounded-lg ${FOCUS_DARK}`}>
              <Logo onDark subtitle="OUTAGE MANAGEMENT" />
            </a>
            <p className="mt-4 max-w-sm text-sm leading-relaxed">
              PRISM · Power Reporting and Integrated System Management. One system for outage reporting,
              dispatch, field operations and member communication.
            </p>
            <div className="mt-6">
              <p className="text-[11px] font-bold tracking-wide text-white">Designed & Developed by</p>
              <div className="mt-2 space-y-2">
                <div className="grid grid-cols-[110px_1fr] items-center gap-3 text-sm font-semibold text-blue-100">
                  <span>PRISM Mobile</span>
                  <span>Selwyn T. Duro</span>
                </div>
                <div className="grid grid-cols-[110px_1fr] items-center gap-3 text-sm font-semibold text-blue-100">
                  <span>PRISM Web</span>
                  <span>Charlene S. Nepomuceno</span>
                </div>
              </div>
            </div>
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
                  <a href={href} className={`rounded transition-colors hover:text-white ${FOCUS_DARK}`}>{label}</a>
                </li>
              ))}
            </ul>
          </nav>

          <nav aria-label="Get started" className="md:col-span-2">
            <p className="text-xs font-bold tracking-wide text-white">GET STARTED</p>
            <ul className="mt-4 space-y-2.5 text-sm">
              <li><Link href="/supervisor/register" className={`rounded transition-colors hover:text-white ${FOCUS_DARK}`}>Register</Link></li>
              <li><Link href="/supervisor/login" className={`rounded transition-colors hover:text-white ${FOCUS_DARK}`}>Supervisor log in</Link></li>
              <li><a href="#faq" className={`rounded transition-colors hover:text-white ${FOCUS_DARK}`}>FAQ</a></li>
              <li><a href="#download" className={`rounded transition-colors hover:text-white ${FOCUS_DARK}`}>Mobile app</a></li>
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
          <div className={`${WRAP} flex flex-col gap-3 py-5 text-xs text-blue-200/70 sm:flex-row sm:items-center sm:justify-between`}>
            <p>© {YEAR} PRISM · Power Reporting and Integrated System Management</p>
            <a
              href="#top"
              className={`inline-flex items-center gap-1.5 rounded font-semibold text-blue-100 transition-colors hover:text-white ${FOCUS_DARK}`}
            >
              Back to top
              <Icon name="arrowUp" className="h-3.5 w-3.5" />
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}