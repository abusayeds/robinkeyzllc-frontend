"use client";

import { useEffect, useMemo, useState } from "react";

/**
 * Counts down to an instant, not for a number of seconds.
 *
 * It used to take a number and decrement it every second, which drifts: a
 * backgrounded tab is throttled, so the clock on screen slowly fell behind the
 * clock the server was judging picks against.
 *
 * `serverNow` is what the server said the time was when it sent the deadline.
 * The difference between that and the browser's own clock is the offset, and
 * everything is measured against the corrected time — so a machine whose clock
 * is ten minutes fast still sees the right countdown.
 */
export function useCountdown(
  deadline: string | null,
  serverNow: string | null,
  totalSeconds: number,
) {
  const offset = useMemo(() => {
    if (!serverNow) return 0;
    return new Date(serverNow).getTime() - Date.now();
  }, [serverNow]);

  const target = useMemo(
    () => (deadline ? new Date(deadline).getTime() : null),
    [deadline],
  );

  const [remaining, setRemaining] = useState(() =>
    target === null
      ? 0
      : Math.max(0, Math.round((target - (Date.now() + offset)) / 1000)),
  );

  useEffect(() => {
    if (target === null) {
      setRemaining(0);
      return;
    }

    const tick = () =>
      setRemaining(
        Math.max(0, Math.round((target - (Date.now() + offset)) / 1000)),
      );

    tick();
    const id = setInterval(tick, 500);
    return () => clearInterval(id);
  }, [target, offset]);

  const mm = Math.floor(remaining / 60);
  const ss = remaining % 60;

  return {
    label: target === null ? "--:--" : `${mm}:${String(ss).padStart(2, "0")}`,
    ratio: totalSeconds > 0 ? Math.min(1, remaining / totalSeconds) : 0,
    remaining,
    /** True once the buzzer has gone; the server auto-picks on the next read. */
    expired: target !== null && remaining === 0,
  };
}

export function money(value: number) {
  const rounded = Number(Math.abs(value).toFixed(1));
  return `${value < 0 ? "-" : ""}$${rounded}M`;
}

/** Whole dollars, which is what every money endpoint sends. */
export function moneyFull(dollars: number) {
  return `${dollars < 0 ? "-" : ""}$${Math.round(Math.abs(dollars)).toLocaleString("en-US")}`;
}

/** "F.Wagner" — what fits in a board cell. */
export function initialLastName(name: string) {
  const parts = name.trim().split(" ");
  if (parts.length < 2) return name;
  return `${parts[0].charAt(0)}.${parts.slice(1).join(" ")}`;
}
