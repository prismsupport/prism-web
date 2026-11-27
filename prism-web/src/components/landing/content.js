export const NAV = [
  { href: "#problem", label: "Why PRISM" },
  { href: "#features", label: "Features" },
  { href: "#how", label: "How it works" },
  { href: "#faq", label: "FAQ" },
  { href: "#download", label: "Download" },
];

export const STATS = [
  { value: "62.5%", pct: 62.5, label: "agree there is a gap between what the cooperative knows and what consumers are told" },
  { value: "70.8%", pct: 70.8, label: "have had to contact the cooperative themselves just to get an update" },
  { value: "55.6%", pct: 55.6, label: "of those who reported an outage did not get consistent updates afterward" },
  { value: "93.8%", pct: 93.8, label: "said an app to report and track outages would be useful" },
];

export const GROUPS = [
  { n: "01", title: "Reporting and Detection", text: "Capture accurate reports and spot the ones that belong together." },
  { n: "02", title: "Dispatch and Field Operations", text: "Get the right crew to the right place, and keep an eye on the clock." },
  { n: "03", title: "Management and Communication", text: "Verify repairs, keep members informed, and measure performance." },
];

export const F = {
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
    text: "Consumers get a push notification when a lineman is dispatched, when work starts, and when the ticket is resolved. They can then confirm power is back, rate the job, or request a reopen.",
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
    text: "Tickets left unassigned past your threshold are flagged on the dispatch board, and supervisors get one alert per ticket.",
    icon: "clock",
    surface: "web",
  },
  qa: {
    title: "QA before closing",
    text: "Lineman attachments such as repair photos, video, voice notes and a completion checklist are reviewed by a supervisor before a ticket is resolved.",
    icon: "check",
    surface: "web",
  },
  advisories: {
    title: "Targeted advisories",
    text: "Publish power interruptions, monthly power rates, collection and payment schedules, programs and general announcements. Aim each notice at a feeder, municipality, barangay or the whole cooperative, and only affected members are notified.",
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

export const ALSO = [
  { icon: "list", title: "Custom status names", text: "Rename ticket statuses and job steps to the terms your cooperative already uses." },
  { icon: "sliders", title: "Custom priority levels", text: "Define your own 2 to 6 priority levels, from lowest to highest." },
  { icon: "phone", title: "Offline report saving", text: "Reports filed without signal are saved on the phone and sent when the connection returns." },
  { icon: "users", title: "Duty schedules and on-call", text: "Set each lineman's shifts, with an on-call override for emergencies. Dispatch uses it." }, 
  { icon: "clock", title: "Office hours and hotlines", text: "Accept new reports only during set hours. Outside them, consumers see their area office hotline." },
  { icon: "archive", title: "Archive and restore", text: "Advisories, FAQ entries and service areas are archived, not deleted, and can be restored." },
  { icon: "history", title: "Reopen with full history", text: "A rejected repair or approved reopen goes back to the same lineman as a new job order. Earlier attempts stay on the ticket." },
  { icon: "building", title: "Service areas", text: "Map each barangay to its substation, feeder and area office. This drives duplicate detection, dispatch ranking and advisory targeting." },
  { icon: "lock", title: "Module-level supervisor access", text: "The Owner chooses which of Dispatch, Advisories and FAQ each supervisor can open. Billing, users and office hours stay Owner-only." },
  { icon: "receipt", title: "Read-only bill inquiry", text: "Consumers enter their account number, which is checked against your billing system, then view bills and history. No payments, no changes." },
  { icon: "wallet", title: "Monthly power rates", text: "The Owner records each month's rate per kWh for residential, low-voltage and high-voltage consumers. Consumers see it with the change from last month, and it can be posted as an advisory." },
  { icon: "chat", title: "FAQ chatbot", text: "Matches questions to answers your supervisors write, with optional Filipino versions. Unanswered questions go to a supervisor, who can publish the reply." },
];

export const STEPS = [
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
    text: "Suggested duplicates are merged once the supervisor confirms, and a lineman is chosen from a ranked recommendation.",
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

export const ROLES = [
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

export const FAQS = [
  {
    q: "How does a cooperative get started?",
    a: "Register your cooperative and Owner account. The PRISM administrator reviews it, and you can log in once it is approved. Then connect your billing system (required before consumers can register), add your service areas, and create lineman accounts. Consumers register in the mobile app.",
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