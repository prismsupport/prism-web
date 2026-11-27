import Link from "next/link";
import Logo from "@/components/ui/Logo";
import MobileNav from "@/components/landing/MobileNav";
import ActionLink from "@/components/landing/ActionLink";
import ProcessFlow from "@/components/landing/ProcessFlow";
import { APK, APK_URL, WRAP, YEAR, FOCUS, FOCUS_DARK } from "@/components/landing/constants";
import { NAV, STATS, GROUPS, F, ALSO, STEPS, ROLES, FAQS } from "@/components/landing/content";
import { Icon } from "@/components/landing/Icon";
import { Chip } from "@/components/landing/Chip";
import { SectionHeading, GroupHeader, RoleList } from "@/components/landing/SectionParts";
import { AvailabilityChips } from "@/components/landing/AvailabilityChips";
import { SupervisorShell, DashboardBody, RecommendPanel, DuplicateReview, AlertsMock, QAPanel, AdvisoryPanel } from "@/components/landing/WebPreviews";
import { ConsumerHome, ConsumerLocation, ConsumerTracking, LinemanJobs, LinemanNav } from "@/components/landing/MobilePreviews";
import { HeroPreview } from "@/components/landing/HeroPreview";
import { FeatureCard, ExportFeature } from "@/components/landing/FeatureCard";

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