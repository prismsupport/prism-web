import { Icon } from "@/components/landing/Icon";
import { SupervisorShell, DispatchBoard } from "@/components/landing/WebPreviews";
import { ConsumerTracking } from "@/components/landing/MobilePreviews";

export function HeroPreview() {
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