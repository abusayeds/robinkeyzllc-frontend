"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { FiSearch, FiX } from "react-icons/fi";
import { useAppDispatch, useAppSelector } from "@/lib/store/hooks";
import { useLeagueRostersQuery } from "@/lib/store/api/endpoints/rosterApi";
import { useLeagueMembersQuery } from "@/lib/store/api/endpoints/leagueSettingsApi";
import { setContractsViewTeamId } from "@/lib/store/features/uiSlice";
import TeamLogo from "@/components/ui/TeamLogo";

type SearchResult = {
  kind: "player" | "user";
  id: string;
  name: string;
  detail: string;
  /** Null for a member who has not been given a team yet. */
  teamId: number | null;
  teamName: string;
  teamLogo?: string;
};

/**
 * Searches the league the user is standing in: its rosters and its members.
 *
 * Both queries are skipped until something is typed, so opening the box
 * costs nothing. RTK Query caches them, so the keystrokes after the first
 * filter what is already in hand rather than asking again.
 */
function useSearchResults(query: string) {
  const leagueId = useAppSelector((state) => state.activeLeague.current?.id);
  const q = query.trim().toLowerCase();
  const skip = !leagueId || q.length === 0;

  const { data: rosters } = useLeagueRostersQuery(leagueId as number, {
    skip,
  });
  const { data: members } = useLeagueMembersQuery(leagueId as number, {
    skip,
  });

  return useMemo(() => {
    if (skip) {
      return { players: [] as SearchResult[], users: [] as SearchResult[] };
    }

    const players: SearchResult[] = [];
    for (const team of rosters?.teams ?? []) {
      for (const player of team.players) {
        if (!player.name.toLowerCase().includes(q)) continue;
        players.push({
          kind: "player",
          id: String(player.id),
          name: player.name,
          detail: [player.position, player.nbaTeam]
            .filter(Boolean)
            .join(" · "),
          teamId: team.id,
          teamName: team.name,
          teamLogo: team.logo ?? undefined,
        });
      }
    }

    // A free agent belongs to the league but to no team, and is worth
    // finding: he is exactly who a commissioner goes looking for.
    for (const player of rosters?.unassigned ?? []) {
      if (!player.name.toLowerCase().includes(q)) continue;
      players.push({
        kind: "player",
        id: String(player.id),
        name: player.name,
        detail: [player.position, player.nbaTeam].filter(Boolean).join(" · "),
        teamId: null,
        teamName: "Free agent",
      });
    }

    const users: SearchResult[] = [];
    for (const member of members ?? []) {
      if (!member.name.toLowerCase().includes(q)) continue;
      users.push({
        kind: "user",
        id: String(member.userId),
        name: member.name,
        detail: member.email,
        teamId: member.team?.id ?? null,
        teamName: member.team?.name ?? "No team yet",
        teamLogo: member.team?.logo ?? undefined,
      });
    }

    return { players: players.slice(0, 6), users: users.slice(0, 6) };
  }, [skip, q, rosters, members]);
}

function ResultsList({
  query,
  onSelect,
}: {
  query: string;
  onSelect: (result: SearchResult) => void;
}) {
  const { players, users } = useSearchResults(query);
  const hasQuery = query.trim().length > 0;
  const hasResults = players.length > 0 || users.length > 0;

  if (!hasQuery) return null;

  return (
    <div className="max-h-80 overflow-y-auto py-1.5">
      {!hasResults ? (
        <p className="px-4 py-6 text-center text-sm text-brand-muted">
          No players or users match &ldquo;{query}&rdquo;.
        </p>
      ) : (
        <>
          {players.length > 0 ? (
            <div className="mb-1">
              <p className="px-4 py-1 text-[10px] font-bold uppercase tracking-[0.08em] text-brand-muted">
                Players
              </p>
              {players.map((r) => (
                <button
                  key={`player-${r.id}`}
                  type="button"
                  onClick={() => onSelect(r)}
                  className="flex w-full items-center gap-2.5 px-4 py-2 text-left transition hover:bg-brand-soft"
                >
                  <TeamLogo name={r.teamName} src={r.teamLogo} className="h-7 w-7" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium text-brand-dark">
                      {r.name}
                    </span>
                    <span className="block truncate text-xs text-brand-muted">
                      {r.detail} · {r.teamName}
                    </span>
                  </span>
                </button>
              ))}
            </div>
          ) : null}

          {users.length > 0 ? (
            <div>
              <p className="px-4 py-1 text-[10px] font-bold uppercase tracking-[0.08em] text-brand-muted">
                Users
              </p>
              {users.map((r) => (
                <button
                  key={`user-${r.id}`}
                  type="button"
                  onClick={() => onSelect(r)}
                  className="flex w-full items-center gap-2.5 px-4 py-2 text-left transition hover:bg-brand-soft"
                >
                  <TeamLogo name={r.teamName} src={r.teamLogo} className="h-7 w-7" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium text-brand-dark">
                      {r.name}
                    </span>
                    <span className="block truncate text-xs text-brand-muted">
                      {r.teamName} · Owner
                    </span>
                  </span>
                </button>
              ))}
            </div>
          ) : null}
        </>
      )}
    </div>
  );
}

function useSelectResult() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const role = useAppSelector((state) => state.auth.role);

  return function selectResult(result: SearchResult) {
    if (role === "commissioner" || role === "admin") {
      router.push("/league-office/teams");
      return;
    }
    dispatch(
      setContractsViewTeamId(result.teamId ? String(result.teamId) : null),
    );
    router.push("/my-team/contracts");
  };
}

/** Desktop: an always-visible inline search box in the header. */
export function HeaderSearchDesktop() {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const selectResult = useSelectResult();

  useEffect(() => {
    if (!open) return;
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  return (
    <div className="relative hidden md:block" ref={ref}>
      <div className="relative">
        <FiSearch className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/50" />
        <input
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          placeholder="Search players or users..."
          className="w-48 rounded-lg border border-white/15 bg-white/10 py-1.5 pl-9 pr-3 text-sm text-white placeholder:text-white/50 outline-none transition focus:w-64 focus:border-white/30 focus:bg-white/15"
        />
      </div>

      {open && query.trim() ? (
        <div className="absolute right-0 top-full z-20 mt-2 w-80 overflow-hidden rounded-xl border border-brand-border bg-white shadow-card">
          <ResultsList
            query={query}
            onSelect={(r) => {
              selectResult(r);
              setOpen(false);
              setQuery("");
            }}
          />
        </div>
      ) : null}
    </div>
  );
}

/** Mobile: a circular icon button (matching the bell) that opens a search row. */
export function HeaderSearchMobile() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const ref = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const selectResult = useSelectResult();

  useEffect(() => {
    if (open) {
      requestAnimationFrame(() => inputRef.current?.focus());
    } else {
      setQuery("");
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Search"
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/15 text-white/80 transition hover:bg-white/10 hover:text-white md:hidden"
      >
        <FiSearch className="h-4 w-4" />
      </button>

      {open ? (
        <div
          className="fixed inset-0 z-[60] bg-brand-dark/50 md:hidden"
          onMouseDown={() => setOpen(false)}
        >
          <div
            ref={ref}
            className="mx-3 mt-3 flex max-h-[80vh] flex-col overflow-hidden rounded-2xl bg-white shadow-card supports-[height:100dvh]:max-h-[80dvh]"
            onMouseDown={(e) => e.stopPropagation()}
          >
            <div className="flex shrink-0 items-center gap-2 border-b border-brand-border px-3 py-2.5">
              <FiSearch className="h-4 w-4 shrink-0 text-brand-muted" />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search players or users..."
                className="min-w-0 flex-1 text-sm outline-none placeholder:text-brand-muted"
              />
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close search"
                className="shrink-0 rounded-lg p-1 text-brand-muted transition hover:bg-brand-soft hover:text-brand-dark"
              >
                <FiX className="h-4 w-4" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">
              <ResultsList
                query={query}
                onSelect={(r) => {
                  selectResult(r);
                  setOpen(false);
                }}
              />
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
