"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  CLOSED_REPORT_STATUSES,
  PRIORITY_LABELS,
  PRIORITY_LEVELS,
} from "@/lib/reports";
import { subscribeToReportChanges } from "@/services/reports";

export default function ReportPriorityPicker({
  reportId,
  priority,
  status,
  onChangePriority,
}) {
  const router = useRouter();
  const [selected, setSelected] = useState(priority ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const locked = CLOSED_REPORT_STATUSES.includes(status);

  // Adopt the server value — our own saved change, or someone else's.
  useEffect(() => {
    setSelected(priority ?? "");
  }, [priority]);

  // Another supervisor or the mobile app may change this report while it's open.
  useEffect(() => {
    return subscribeToReportChanges(reportId, (row) => {
      setSelected(row?.priority ?? "");
      router.refresh();
    });
  }, [reportId, router]);

  async function handleChange(nextPriority) {
    if (nextPriority === selected) {
      return;
    }

    const previous = selected;
    setSelected(nextPriority);
    setSaving(true);
    setError("");

    const result = await onChangePriority(reportId, nextPriority);

    setSaving(false);

    if (!result?.ok) {
      setSelected(previous);
      setError(
        result?.message ??
          "We couldn't save the priority right now. Please try again.",
      );
    }
  }

  return (
    <>
      {!selected && !locked && (
        <p className="text-[10px] text-gray-400">Not set yet</p>
      )}

      <RadioGroup
        value={selected}
        onValueChange={handleChange}
        disabled={locked}
        aria-label="Incident priority"
        className="mt-1.5 gap-1.5 data-disabled:opacity-60"
      >
        {PRIORITY_LEVELS.map((level) => (
          
          <label
            key={level}
            className={`flex items-center gap-2 ${
              locked ? "cursor-default" : "cursor-pointer"
            }`}
          >
            <RadioGroupItem
              value={level}
              className="size-3.5 data-checked:bg-blue-600 dark:data-checked:bg-blue-600"
            />
            <span
              className={`text-[10px] font-semibold tracking-wide uppercase ${
                selected === level ? "text-gray-900" : "text-gray-500"
              }`}
            >
              {PRIORITY_LABELS[level]}
            </span>
          </label>
        ))}
      </RadioGroup>

      

      {locked && (
        <p className="mt-1.5 text-[10px] text-gray-400">
          {status === "cancelled"
            ? "Locked — this report was declined."
            : "Locked — this report is resolved."}
        </p>
      )}

      {error && <p className="mt-1.5 text-[10px] text-red-600">{error}</p>}
    </>
  );
}
