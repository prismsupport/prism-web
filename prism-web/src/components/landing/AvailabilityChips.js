import ActionLink from "@/components/landing/ActionLink";
import { APK, APK_URL, FOCUS, FOCUS_DARK } from "@/components/landing/constants";
import { Icon } from "@/components/landing/Icon";

export function AvailabilityChips({ dark = false }) {
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