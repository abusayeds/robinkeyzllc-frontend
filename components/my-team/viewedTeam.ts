"use client";

import { useCallback } from "react";
import { setContractsViewTeamId } from "@/lib/store/features/uiSlice";
import { useAppDispatch, useAppSelector } from "@/lib/store/hooks";

/**
 * The team the Contracts and Draft Picks tabs are looking at.
 *
 * Held in `uiSlice` rather than in each page's own state for two reasons: the
 * two tabs stay on the same team when you switch between them, and the header
 * search can aim them at the team a result belongs to before navigating.
 *
 * Nothing is read from the slice without checking it against this league's
 * teams first — a stored id survives changing league, and a team can be
 * removed while it is the one being viewed.
 */
export function useViewedTeam(
  myTeamId: number | null,
  teams: { id: number }[],
) {
  const dispatch = useAppDispatch();
  const stored = useAppSelector((state) => state.ui.contractsViewTeamId);

  const chosen =
    stored !== null && teams.some((team) => team.id === stored) ? stored : null;

  const teamId = chosen ?? myTeamId ?? teams[0]?.id ?? null;

  const setTeamId = useCallback(
    (id: number) => dispatch(setContractsViewTeamId(id)),
    [dispatch],
  );

  return [teamId, setTeamId] as const;
}
