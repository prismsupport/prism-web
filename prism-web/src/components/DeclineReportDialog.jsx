"use client";

import { CircleX } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

export default function DeclineReportDialog({
  reportId,
  ticketNumber,
  consumerName,
  onDecline,
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  const canSubmit = reason.trim().length > 0 && !pending;

  function handleOpenChange(nextOpen) {
    if (pending) {
      return;
    }

    setOpen(nextOpen);

    if (!nextOpen) {
      setReason("");
      setError("");
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (!canSubmit) {
      return;
    }

    setPending(true);
    setError("");

    const result = await onDecline(reportId, reason);

    setPending(false);

    if (!result?.ok) {
      setError(
        result?.message ??
          "We couldn't decline this report right now. Please try again.",
      );
      return;
    }

    setOpen(false);
    setReason("");
    router.refresh();
  }

  return (
    <>
      <Button
        onClick={() => setOpen(true)}
        className="h-11 w-full rounded-lg bg-red-600 text-white hover:bg-red-700"
      >
        <CircleX className="h-4 w-4" />
        Decline Report
      </Button>

      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="rounded-xl sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-gray-900">
              Decline Outage Report
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="rounded-lg bg-red-50 px-4 py-3">
              <p className="text-xs font-bold tracking-wide text-red-600 uppercase">
                Declining request for
              </p>
              <p className="mt-2 text-sm text-gray-700">
                <span className="font-semibold">Report From:</span>{" "}
                {consumerName ?? "Unknown consumer"}
              </p>
              <p className="text-sm text-gray-700">
                <span className="font-semibold">Report Ticket:</span>{" "}
                {ticketNumber}
              </p>
            </div>

            <div>
              <label
                htmlFor="decline-reason"
                className="block text-xs font-bold tracking-wide text-gray-500 uppercase"
              >
                Reason / Remarks
              </label>
              <Textarea
                id="decline-reason"
                value={reason}
                onChange={(event) => setReason(event.target.value)}
                disabled={pending}
                rows={4}
                placeholder="Provide specific details for the consumer regarding this decline…"
                className="mt-2 rounded-lg border-gray-200 bg-gray-50 text-sm"
              />
            </div>

            {error && (
              <p className="rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-600">
                {error}
              </p>
            )}

            <div className="flex items-center justify-end gap-3 border-t border-gray-100 pt-4">
              <Button
                type="button"
                variant="ghost"
                onClick={() => handleOpenChange(false)}
                disabled={pending}
                className="h-10 rounded-lg px-4 text-gray-600"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={!canSubmit}
                className="h-10 rounded-lg bg-red-600 px-4 text-white hover:bg-red-700"
              >
                {pending ? "Declining…" : "Confirm Decline"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
