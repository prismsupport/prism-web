"use client";

import { useEffect, useState } from "react";
import { subscribe, dismiss } from "@/lib/toast";

const TONES = {
  success: { badge: "bg-green-100 text-green-700", icon: <path d="m5 13 4 4L19 7" /> },
  error: {
    badge: "bg-red-100 text-red-700",
    icon: (
      <>
        <path d="M12 7v6" />
        <path d="M12 17h.01" />
      </>
    ),
  },
  info: {
    badge: "bg-blue-100 text-blue-700",
    icon: (
      <>
        <path d="M12 11v6" />
        <path d="M12 7h.01" />
      </>
    ),
  },
};

export default function Toaster() {
  const [items, setItems] = useState([]);
  useEffect(() => subscribe(setItems), []);

  return (
    <div className="pointer-events-none fixed bottom-6 right-6 z-[10000] flex w-80 flex-col gap-3">
      {items.map((t) => {
        const tone = TONES[t.type] || TONES.info;
        return (
          <div
            key={t.id}
            className="pointer-events-auto flex animate-in fade-in slide-in-from-bottom-2 items-start gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-lg duration-200"
          >
            <span className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${tone.badge}`}>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-3.5 w-3.5"
              >
                {tone.icon}
              </svg>
            </span>
            <p className="flex-1 text-sm text-gray-800">{t.message}</p>
            <button
              type="button"
              onClick={() => dismiss(t.id)}
              aria-label="Dismiss"
              className="text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          </div>
        );
      })}
    </div>
  );
}