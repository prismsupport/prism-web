"use client";

import { useEffect, useRef, useState } from "react";

const INTERVAL = 3200;

const TAG_TONES = {
  gray: "bg-gray-100 text-gray-600 ring-gray-200",
  green: "bg-green-50 text-green-700 ring-green-200",
  red: "bg-red-50 text-red-700 ring-red-200",
};

function CheckIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-4 w-4"
      aria-hidden="true"
    >
      <path d="m5 13 4 4L19 7" />
    </svg>
  );
}

// steps: [{ n, title, text, device, icon (node), deviceIcon (node), tags: [[label, tone]] }]
export default function ProcessFlow({ steps }) {
  const [active, setActive] = useState(0);
  const [inView, setInView] = useState(false);
  const [hovering, setHovering] = useState(false);
  const [userPaused, setUserPaused] = useState(false);
  const [reduced, setReduced] = useState(false);
  const ref = useRef(null);
  const last = steps.length - 1;

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const onChange = (e) => setReduced(e.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), {
      threshold: 0.35,
    });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const running = inView && !hovering && !userPaused && !reduced;

  useEffect(() => {
    if (!running) return;
    const t = setTimeout(() => setActive((a) => (a >= last ? 0 : a + 1)), INTERVAL);
    return () => clearTimeout(t);
  }, [running, active, last]);

  return (
    <div
      ref={ref}
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
      onFocus={() => setHovering(true)}
      onBlur={() => setHovering(false)}
    >
      {!reduced && (
        <div className="mb-6 flex justify-end">
          <button
            type="button"
            onClick={() => setUserPaused((v) => !v)}
            aria-pressed={userPaused}
            className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-600 transition-colors hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
          >
            {userPaused ? "Play animation" : "Pause animation"}
          </button>
        </div>
      )}

      <ol className="grid gap-6 sm:grid-cols-2 lg:grid-cols-[repeat(3,minmax(0,1fr))_minmax(0,1.2fr)]">
        {steps.map((s, i) => {
          const done = i < active;
          const current = i === active;
          return (
            <li key={s.n} className="relative flex pl-16 lg:flex-col lg:pl-0 lg:pt-16">
              {/* Connector to the next step (vertical on mobile, horizontal on desktop) */}
              {i < last && (
                <>
                  <span
                    aria-hidden="true"
                    className="absolute -bottom-6 left-[19px] top-10 w-0.5 bg-gray-200 lg:hidden"
                  >
                    <span
                      className={`block h-full w-full origin-top bg-blue-600 transition-transform duration-700 ${
                        done ? "scale-y-100" : "scale-y-0"
                      }`}
                    />
                  </span>
                  <span
                    aria-hidden="true"
                    className={`absolute left-1/2 top-[19px] hidden h-0.5 bg-gray-200 lg:block ${
                        i === last - 1
                            ? "w-[calc(110%+1.5rem)]"
                            : "w-[calc(100%+1.5rem)]"
                        }`}
                  >
                    <span
                      className={`block h-full w-full origin-left bg-blue-600 transition-transform duration-700 ${
                        done ? "scale-x-100" : "scale-x-0"
                      }`}
                    />
                  </span>
                </>
              )}

              {/* Stage marker */}
              <button
                type="button"
                onClick={() => setActive(i)}
                aria-label={`Step ${s.n}: ${s.title}`}
                aria-current={current ? "step" : undefined}
                className={`font-display absolute left-0 top-0 z-10 flex h-10 w-10 items-center justify-center rounded-full text-sm font-extrabold ring-8 ring-white transition-colors duration-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 lg:left-1/2 lg:-translate-x-1/2 ${
                  done || current ? "bg-blue-700 text-white" : "bg-gray-200 text-gray-500"
                }`}
              >
                {current && (
                  <span
                    aria-hidden="true"
                    className="absolute inset-0 rounded-full bg-blue-600/40 motion-safe:animate-ping"
                  />
                )}
                <span className="relative">{done ? <CheckIcon /> : s.n}</span>
              </button>

              {/* Card */}
              <div
                onClick={() => setActive(i)}
                className={`flex w-full flex-1 cursor-pointer flex-col rounded-2xl border p-5 transition-[transform,box-shadow,border-color,background-color,opacity] duration-500 ${
                  current
                    ? "border-blue-300 bg-white shadow-lg lg:-translate-y-1"
                    : done
                      ? "border-gray-200 bg-white"
                      : "border-gray-200 bg-gray-50 opacity-80"
                }`}
              >
                <div className="mb-3 flex items-center justify-between gap-2">
                  <span
                    className={`flex h-9 w-9 items-center justify-center rounded-lg transition-colors duration-500 ${
                      current ? "bg-blue-700 text-white" : "bg-blue-50 text-blue-700"
                    }`}
                  >
                    {s.icon}
                  </span>
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-2.5 py-1 text-[11px] font-semibold text-gray-600 ring-1 ring-gray-200">
                    {s.deviceIcon}
                    {s.device}
                  </span>
                </div>
                <h3 className="font-display text-base font-bold text-[#071B3A]">{s.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-gray-600">{s.text}</p>
                <ul className="mt-4 flex flex-wrap gap-1.5">
                  {s.tags.map(([label, tone]) => (
                    <li key={label}>
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1 ring-inset ${TAG_TONES[tone]}`}
                      >
                        {label}
                      </span>
                    </li>
                  ))}
                </ul>
                <div className="mt-auto pt-4">
                  <div className="h-0.5 overflow-hidden rounded-full bg-gray-100">
                    {current && running && (
                      <span
                        key={active}
                        className="block h-full origin-left bg-blue-600"
                        style={{ animation: `step-fill ${INTERVAL}ms linear forwards` }}
                      />
                    )}
                  </div>
                </div>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}