"use client";

import { useEffect, useState } from "react";

/**
 * False during the server render and the first client render, true afterwards.
 *
 * The store is preloaded from localStorage, which does not exist on the server,
 * so anything derived from the signed-in user — the role above all — differs
 * between the two and React reports a hydration mismatch. Gate that markup on
 * this and both renders agree.
 */
export function useHydrated() {
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => setHydrated(true), []);
  return hydrated;
}
