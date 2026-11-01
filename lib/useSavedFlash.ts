"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * A "Saved." confirmation that clears itself.
 *
 * Saving invalidates the settings cache, so the query refetches and the editor
 * re-syncs from the server. A flag cleared by that re-sync would wipe the
 * confirmation the moment it appeared, so the timer owns it instead.
 */
export function useSavedFlash(ms = 3500) {
  const [saved, setSaved] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clear = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
    setSaved(false);
  }, []);

  const flash = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    setSaved(true);
    timer.current = setTimeout(() => setSaved(false), ms);
  }, [ms]);

  useEffect(() => clear, [clear]);

  return { saved, flash, clear };
}
