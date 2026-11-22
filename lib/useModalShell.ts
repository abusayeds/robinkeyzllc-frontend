"use client";

import { useEffect, useRef } from "react";

/**
 * Escape-to-close and a page scroll lock, for a modal that is open.
 *
 * Written as a hook because the hand-rolled version in each modal read the
 * previous overflow value on every render. Callers pass an inline arrow for
 * `onClose`, so the effect re-ran, saved "hidden" as the value to restore, and
 * left the page scroll-locked after the modal closed — which looks exactly
 * like a modal that will not go away.
 *
 * `onClose` is held in a ref so changing its identity never re-runs the
 * effect, and the real previous overflow is captured once when the modal
 * opens.
 */
export function useModalShell(open: boolean, onClose: () => void) {
  const close = useRef(onClose);
  close.current = onClose;

  useEffect(() => {
    if (!open) return;

    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") close.current();
    };
    window.addEventListener("keydown", onKey);

    const html = document.documentElement;
    const prevHtml = html.style.overflow;
    const prevBody = document.body.style.overflow;
    html.style.overflow = "hidden";
    document.body.style.overflow = "hidden";

    return () => {
      window.removeEventListener("keydown", onKey);
      html.style.overflow = prevHtml;
      document.body.style.overflow = prevBody;
    };
  }, [open]);
}
