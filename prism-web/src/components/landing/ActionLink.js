
"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

const PRESS =
  "transition-[transform,background-color,border-color,color,box-shadow] duration-150 active:scale-[0.96] motion-reduce:transition-none motion-reduce:active:scale-100";

function Spinner() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className="h-4 w-4 shrink-0 motion-safe:animate-spin"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity="0.25" strokeWidth="3" />
      <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

function Check() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="animate-pop h-4 w-4 shrink-0"
      aria-hidden="true"
    >
      <path d="m5 13 4 4L19 7" />
    </svg>
  );
}

export default function ActionLink({
  href,
  download = false,
  doneLabel = "Download started",
  className = "",
  children,
  onClick,
  ...props
}) {
  const router = useRouter();
  const [state, setState] = useState("idle");
  const timer = useRef(null);
  const navigationTimer = useRef(null);

  const isAuthDestination =
    typeof href === "string" &&
    (href.startsWith("/supervisor/login") ||
      href.startsWith("/supervisor/register"));

  useEffect(
    () => () => {
      clearTimeout(timer.current);
      clearTimeout(navigationTimer.current);
    },
    []
  );

  function handleClick(e) {
    onClick?.(e);

    if (
      e.defaultPrevented ||
      e.button !== 0 ||
      e.metaKey ||
      e.ctrlKey ||
      e.shiftKey ||
      e.altKey
    ) {
      return;
    }

    clearTimeout(timer.current);
    clearTimeout(navigationTimer.current);

    // Soft blur-and-fade transition for login and registration pages.
    if (isAuthDestination && !download) {
      e.preventDefault();
      setState("loading");

      const root = document.documentElement;

      if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        root.style.transition =
          "filter 300ms ease, opacity 300ms ease";
        root.style.filter = "blur(5px)";
        root.style.opacity = "0.65";
      }

      navigationTimer.current = setTimeout(() => {
        router.push(href);
      }, 250);

      return;
    }

    setState(download ? "done" : "loading");

    timer.current = setTimeout(
      () => setState("idle"),
      download ? 3500 : 6000
    );
  }

  const content = (
    <>
      {state === "loading" && <Spinner />}
      {state === "done" && <Check />}
      <span className="inline-flex items-center gap-2">
        {state === "done" ? doneLabel : children}
      </span>
      <span role="status" aria-live="polite" className="sr-only">
        {state === "loading"
          ? "Loading"
          : state === "done"
            ? doneLabel
            : ""}
      </span>
    </>
  );

  const common = {
    className: `${className} ${PRESS}`,
    onClick: handleClick,
    "aria-busy": state === "loading" ? true : undefined,
    ...props,
  };

  return download ? (
    <a href={href} download {...common}>
      {content}
    </a>
  ) : (
    <Link href={href} {...common}>
      {content}
    </Link>
  );
}
