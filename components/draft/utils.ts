"use client";

import { useEffect, useState } from "react";

export function useCountdown(seconds: number, resetKey: unknown) {
  const [remaining, setRemaining] = useState(seconds);

  useEffect(() => {
    setRemaining(seconds);
    const id = setInterval(() => {
      setRemaining((r) => (r > 0 ? r - 1 : 0));
    }, 1000);
    return () => clearInterval(id);
  }, [seconds, resetKey]);

  const mm = Math.floor(remaining / 60);
  const ss = remaining % 60;
  return {
    label: `${mm}:${String(ss).padStart(2, "0")}`,
    ratio: remaining / seconds,
    remaining,
  };
}

export function money(value: number) {
  const rounded = Number(Math.abs(value).toFixed(1));
  return `${value < 0 ? "-" : ""}$${rounded}M`;
}

export function moneyFull(valueInMillions: number) {
  const dollars = Math.round(Math.abs(valueInMillions) * 1_000_000);
  return `${valueInMillions < 0 ? "-" : ""}$${dollars.toLocaleString()}`;
}
