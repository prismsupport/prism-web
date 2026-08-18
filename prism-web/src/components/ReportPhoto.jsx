"use client";

import { ImageOff, Maximize2 } from "lucide-react";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function ReportPhoto({ photoLink, ticketNumber, hasPhoto }) {
  const [open, setOpen] = useState(false);

  if (!photoLink) {
    return (
      <div className="mt-3 flex h-40 flex-col items-center justify-center rounded-lg border border-dashed border-gray-200 bg-gray-50 text-center">
        <ImageOff className="h-5 w-5 text-gray-300" />
        <p className="mt-2 text-xs text-gray-500">
          {hasPhoto
            ? "This photo couldn't be loaded."
            : "No photo was attached."}
        </p>
      </div>
    );
  }

  const altText = `Evidence submitted with ${ticketNumber}`;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="group relative mt-3 block h-40 w-full overflow-hidden rounded-lg border border-gray-200 bg-gray-50"
      >
        {/* biome-ignore lint/performance/noImgElement: the src is a short-lived signed URL from a private bucket, so next/image optimisation and caching don't apply */}
        <img
          src={photoLink}
          alt={altText}
          className="h-full w-full object-cover"
        />
        <span className="absolute inset-0 flex items-center justify-center gap-1.5 bg-black/45 text-xs font-semibold text-white opacity-0 transition-opacity group-hover:opacity-100">
          <Maximize2 className="h-4 w-4" />
          View full photo
        </span>
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle className="text-sm font-bold text-gray-900">
              Photo Evidence — {ticketNumber}
            </DialogTitle>
          </DialogHeader>
          {/* biome-ignore lint/performance/noImgElement: same signed URL as the thumbnail above */}
          <img
            src={photoLink}
            alt={altText}
            className="max-h-[70vh] w-full rounded-lg bg-gray-50 object-contain"
          />
        </DialogContent>
      </Dialog>
    </>
  );
}
