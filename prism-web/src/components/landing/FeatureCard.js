import { F } from "@/components/landing/content";
import { Icon } from "@/components/landing/Icon";
import { ExportVisual } from "@/components/landing/WebPreviews";

function SurfaceTag({ surface }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-white/80 px-2 py-0.5 text-[11px] font-semibold text-gray-600 ring-1 ring-gray-200">
      <Icon name={surface === "web" ? "monitor" : "phone"} className="h-3 w-3" />
      {surface === "web" ? "Web dashboard" : "Mobile app"}
    </span>
  );
}

export function FeatureCard({ feature, visual, featured = false, className = "" }) {
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

export function ExportFeature() {
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