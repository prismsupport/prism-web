import Logo from "@/components/ui/Logo";

const CONTENT = {
  supervisor: {
    headline: "Outages reported. Crews dispatched. Power restored.",
    text: "Run your cooperative's outage response from one place.",
    points: [
      "Real-time outage tickets and dispatch",
      "Smart lineman recommendations",
      "Advisories your members actually see",
    ],
  },
  superadmin: {
    headline: "Oversee every cooperative on the platform.",
    text: "Review registrations and keep each cooperative running smoothly.",
    points: [
      "Approve and review cooperative registrations",
      "Activate or deactivate cooperatives",
      "A full history of every status change",
    ],
  },
};

export default function AuthLayout({ children, logoSubtitle, variant = "supervisor", wide = false }) {
  const c = CONTENT[variant] || CONTENT.supervisor;

  return (
    <div
      className="relative grid min-h-screen overflow-hidden lg:grid-cols-[2fr_3fr]"
      style={{ background: "linear-gradient(135deg, #022b67 0%, #021940 100%)" }}
    >
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage: "radial-gradient(rgba(255,255,255,0.08) 1px, transparent 1px)",
          backgroundSize: "24px 24px",
        }}
      />
      <div className="pointer-events-none absolute -right-24 top-1/4 h-96 w-96 rounded-full bg-blue-500/25 blur-3xl" />
      <div className="pointer-events-none absolute -left-16 bottom-10 h-72 w-72 rounded-full bg-amber-300/10 blur-3xl" />

      {/* Brand panel */}
      <div
        className="relative z-10 hidden flex-col justify-between p-12 lg:sticky lg:top-0 lg:flex lg:h-screen lg:self-start"
      >
        <div className="relative">
          <Logo hideMark onDark subtitle={logoSubtitle} />
        </div>

        <div className="relative mx-auto w-full max-w-sm">
          <img src="/brand/mascot.png" alt="" className="mx-auto w-56 max-w-full drop-shadow-2xl" />
          <h2 className="mt-8 text-3xl font-extrabold leading-tight text-white">{c.headline}</h2>
          <p className="mt-3 max-w-md text-sm text-blue-200">{c.text}</p>
          <ul className="mt-6 space-y-3">
            {c.points.map((p) => (
              <li key={p} className="flex items-center gap-3 text-sm text-blue-100">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-amber-400/20 text-amber-300">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-3 w-3"
                  >
                    <path d="m5 13 4 4L19 7" />
                  </svg>
                </span>
                {p}
              </li>
            ))}
          </ul>
        </div>

        <p className="relative text-xs text-blue-300/70">
          Integrated Consumer Service and Outage Management System
        </p>
      </div>

      {/* Form panel */}
      <div className="relative z-10 flex flex-col items-center justify-center px-4 py-8 sm:px-6 sm:py-10">
        <div className="mb-8 lg:hidden">
          <Logo hideMark subtitle={logoSubtitle} />
        </div>
        <div
          className={`w-full rounded-3xl bg-white p-6 shadow-2xl shadow-blue-950/30 sm:p-8 ${
            "max-w-xl"
          }`}
        >
          {children}
        </div>
      </div>
    </div>
  );
}