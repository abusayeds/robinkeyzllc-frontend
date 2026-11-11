"use client";

import { useCallback, useEffect, useState } from "react";

/**
 * The viewer's own shortlist for a draft.
 *
 * Nobody else sees it and the server has no model for it, so it is not league
 * data — the same call Trade Finder's saved players made. But unlike a saved
 * player it is wanted during a live draft, where a refresh in the middle of a
 * round should not wipe it, so it is kept in `localStorage` per draft rather
 * than in page state.
 *
 * Every read and write is guarded: `localStorage` throws in a private window
 * and can come back empty after site data is cleared, and a draft room that
 * crashes for that is worse than one that forgets a shortlist.
 */
export function useDraftQueue(draftId: number | undefined) {
  const key = draftId === undefined ? null : `avora.draftQueue.${draftId}`;

  const [queue, setQueue] = useState<number[]>([]);

  useEffect(() => {
    if (!key) return;
    try {
      const raw = window.localStorage.getItem(key);
      const parsed = raw ? JSON.parse(raw) : [];
      setQueue(
        Array.isArray(parsed)
          ? parsed.filter((id): id is number => typeof id === "number")
          : [],
      );
    } catch {
      setQueue([]);
    }
  }, [key]);

  const write = useCallback(
    (next: number[]) => {
      setQueue(next);
      if (!key) return;
      try {
        window.localStorage.setItem(key, JSON.stringify(next));
      } catch {
        // Private mode, or the quota is full. The shortlist still works for
        // this page view.
      }
    },
    [key],
  );

  const toggle = useCallback(
    (playerId: number) =>
      write(
        queue.includes(playerId)
          ? queue.filter((id) => id !== playerId)
          : [...queue, playerId],
      ),
    [queue, write],
  );

  const remove = useCallback(
    (playerId: number) => write(queue.filter((id) => id !== playerId)),
    [queue, write],
  );

  return { queue, toggle, remove };
}
