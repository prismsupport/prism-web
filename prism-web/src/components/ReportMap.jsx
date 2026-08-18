"use client";

import dynamic from "next/dynamic";
import { Skeleton } from "@/components/ui/skeleton";

// Leaflet reaches for `window` as soon as it is imported, so the map itself is
// never rendered on the server. next/dynamic with ssr:false only works from a
// Client Component, which is why this wrapper exists.
const ReportMapView = dynamic(() => import("@/components/ReportMapView"), {
  ssr: false,
  loading: () => <Skeleton className="h-full w-full rounded-none" />,
});

export default function ReportMap({ latitude, longitude }) {
  return (
    <div className="relative h-full w-full">
      <ReportMapView latitude={latitude} longitude={longitude} />

      <span className="absolute top-4 left-4 z-[1000] inline-flex items-center gap-2 rounded-full bg-white px-3 py-1.5 text-[11px] font-bold tracking-wide text-gray-700 uppercase shadow">
        <span className="h-2 w-2 rounded-full bg-red-500" />
        Active Incident
      </span>

      <span className="absolute bottom-4 left-4 z-[1000] rounded-md bg-white/95 px-2.5 py-1 text-[11px] font-semibold text-gray-600 shadow">
        Coordinates: {latitude.toFixed(4)}° N, {longitude.toFixed(4)}° E
      </span>
    </div>
  );
}
